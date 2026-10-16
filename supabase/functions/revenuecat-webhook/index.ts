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
//
// ACCESS RULES (MyExpense, applies to iOS, Android and web):
// - Paid and cancelled: Pro stays on until the end of the paid period.
//   EXPIRATION fires then and switches the user to free.
// - Refunded: Pro stays on for 7 days from the refund, then ends. The
//   cut-off is enforced by the `expire-refunded-pro` pg_cron job, which
//   switches `subscription` to "free" once `subscription_expires_at` has
//   passed for any profile with `refunded_at` set.
// - Payment failed: unchanged. BILLING_ISSUE starts the 7-day grace period
//   that authStore enforces, and EXPIRATION ends access.
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

// How long a refunded user keeps Pro after the refund.
const REFUND_ACCESS_MS = 7 * 24 * 60 * 60 * 1000;

Deno.serve(
  async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // RevenueCat sends whatever you configure as "Authorization header value"
    // verbatim; it does not add a "Bearer " prefix itself. Accept the raw
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

      const setFree = async () => {
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription: "free",
            subscription_expires_at: null,
            billing_issue_detected_at: null,
            refunded_at: null,
          })
          .eq("id", appUserId);
        if (error) throw new Error(error.message);
      };

      if (ACTIVE_EVENT_TYPES.has(type)) {
        // Purchase, renewal or resubscribe: full access to the real expiry,
        // and any earlier refund window is cleared.
        const expirationAtMs: number | null = event.expiration_at_ms ?? null;
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription: "pro",
            subscription_expires_at: expirationAtMs ? new Date(expirationAtMs).toISOString() : null,
            billing_issue_detected_at: null,
            refunded_at: null,
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
        // Paid period is over: access ends now. The one exception is a user
        // inside their 7-day refund window; the cron job ends that one.
        const { data: profile, error: selectError } = await supabase
          .from("profiles")
          .select("refunded_at, subscription_expires_at")
          .eq("id", appUserId)
          .single();
        if (selectError) throw new Error(selectError.message);
        const inRefundWindow =
          !!profile?.refunded_at &&
          !!profile?.subscription_expires_at &&
          new Date(profile.subscription_expires_at).getTime() > Date.now();
        if (!inRefundWindow) await setFree();
      } else if (type === "CANCELLATION") {
        const now = Date.now();
        const expirationAtMs: number | null = event.expiration_at_ms ?? null;
        // A failed renewal also arrives as CANCELLATION (BILLING_ERROR),
        // usually with an expiry already in the past. That is not a refund:
        // the billing-issue grace period covers it, so never treat it as one.
        const isRefund =
          event.cancel_reason !== "BILLING_ERROR" &&
          (event.cancel_reason === "CUSTOMER_SUPPORT" ||
            (expirationAtMs !== null && expirationAtMs <= now));

        if (isRefund) {
          // Refund: 7 days of Pro from the refund. Repeat webhooks for the
          // same refund never extend the window.
          const { data: profile, error: selectError } = await supabase
            .from("profiles")
            .select("refunded_at")
            .eq("id", appUserId)
            .single();
          if (selectError) throw new Error(selectError.message);
          const refundedAtMs = profile?.refunded_at ? new Date(profile.refunded_at).getTime() : now;
          const { error } = await supabase
            .from("profiles")
            .update({
              refunded_at: new Date(refundedAtMs).toISOString(),
              subscription_expires_at: new Date(refundedAtMs + REFUND_ACCESS_MS).toISOString(),
            })
            .eq("id", appUserId);
          if (error) throw new Error(error.message);
        } else {
          // Normal cancellation (or failed payment): they paid for this
          // period, so access runs to the end of it. EXPIRATION fires then.
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_expires_at: expirationAtMs ? new Date(expirationAtMs).toISOString() : null,
            })
            .eq("id", appUserId);
          if (error) throw new Error(error.message);
        }
      }
      // Any other event types: no-op.

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
