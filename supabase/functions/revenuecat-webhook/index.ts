// Deploy: npx supabase functions deploy revenuecat-webhook --no-verify-jwt
//
// Receives RevenueCat webhook events and syncs `profiles` so authStore's
// isPremium/isAccessBlocked (the only things that actually gate features)
// reflect real payment state. Without this, purchases only update local
// RevenueCat SDK state on-device and never unlock anything server-side.
//
// Configure in the RevenueCat dashboard (Project settings > Integrations >
// Webhooks): URL = this function's deployed URL, Authorization header value
// = REVENUECAT_WEBHOOK_SECRET (set via `npx supabase secrets set`).
//
// app_user_id in the payload is always the Supabase auth.uid(), since
// lib/purchases.ts calls Purchases.configure({ appUserID: userId }).

import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVE_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
]);

Deno.serve(
  async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // RevenueCat sends whatever you configure as "Authorization header value"
    // verbatim — it does not add a "Bearer " prefix itself. Accept the raw
    // secret either bare or Bearer-prefixed so it matches regardless of how
    // the value was entered on the RevenueCat side.
    const authHeader = req.headers.get("authorization") ?? "";
    const providedSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json().catch(() => ({}));
      const event = body?.event ?? {};
      const type: string | undefined = event.type;
      const appUserId: string | undefined = event.app_user_id;

      if (!type || !appUserId) {
        return new Response(JSON.stringify({ error: "Missing event.type or event.app_user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      if (ACTIVE_EVENT_TYPES.has(type)) {
        const expirationAtMs: number | null = event.expiration_at_ms ?? null;
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription: "pro",
            subscription_expires_at: expirationAtMs ? new Date(expirationAtMs).toISOString() : null,
            billing_issue_detected_at: null,
          })
          .eq("id", appUserId);
        if (error) throw new Error(error.message);
      } else if (type === "BILLING_ISSUE") {
        // Only set the timestamp if it isn't already set, so repeated retry
        // webhooks for the same unresolved issue don't keep pushing the
        // 7-day grace-period deadline forward.
        const { data: profile, error: selectError } = await supabase
          .from("profiles")
          .select("billing_issue_detected_at")
          .eq("id", appUserId)
          .single();
        if (selectError) throw new Error(selectError.message);

        if (!profile?.billing_issue_detected_at) {
          const { error } = await supabase
            .from("profiles")
            .update({ billing_issue_detected_at: new Date().toISOString() })
            .eq("id", appUserId);
          if (error) throw new Error(error.message);
        }
      } else if (type === "EXPIRATION") {
        // Entitlement has definitively ended (RevenueCat's own retry cycle
        // completed, or the subscription simply wasn't renewed) — access
        // ends immediately, no additional grace period.
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription: "free",
            subscription_expires_at: null,
            billing_issue_detected_at: null,
          })
          .eq("id", appUserId);
        if (error) throw new Error(error.message);
      }
      // CANCELLATION and any other event types: no-op. A cancellation keeps
      // access until the paid period ends, at which point EXPIRATION fires.

      return new Response(JSON.stringify({ received: true, type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("revenuecat-webhook error:", e);
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
  { verifyJWT: false },
);
