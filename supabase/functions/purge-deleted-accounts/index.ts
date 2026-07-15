// Deploy: npx supabase functions deploy purge-deleted-accounts --no-verify-jwt
//
// Called daily by pg_cron (see supabase/migrations/20260715000000_add_account_deletion.sql)
// via pg_net, never by a user directly. Finds every profile whose 30-day
// account-deletion grace period (profiles.deletion_requested_at) has
// elapsed and permanently purges that user's data.
//
// Five of the eight user-owned tables (expenses, income, profiles, receipts,
// tax_summary) predate migration tracking and have no CREATE TABLE in this
// repo, so their FK ON DELETE behavior is unverified — every table is
// deleted from explicitly here rather than relying on cascade.

import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 30;
const RECEIPTS_BUCKET = "receipts";

// Order matters: children before profiles, profiles before the auth user.
const CHILD_TABLES = [
  "mileage_trips",
  "bank_accounts",
  "home_office_settings",
  "receipts",
  "income",
  "tax_summary",
  "expenses",
] as const;

Deno.serve(
  async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const authHeader = req.headers.get("authorization") ?? "";
    const providedSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const expectedSecret = Deno.env.get("ACCOUNT_DELETION_SECRET");
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const purged: string[] = [];
    const failed: { id: string; error: string }[] = [];

    try {
      const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 86_400_000).toISOString();
      const { data: dueProfiles, error: queryError } = await supabase
        .from("profiles")
        .select("id")
        .not("deletion_requested_at", "is", null)
        .lte("deletion_requested_at", cutoff);

      if (queryError) throw new Error(queryError.message);

      for (const { id: userId } of dueProfiles ?? []) {
        try {
          // Storage cleanup first — DB row deletes don't touch Storage objects.
          const { data: files } = await supabase.storage.from(RECEIPTS_BUCKET).list(userId, {
            limit: 1000,
          });
          if (files && files.length > 0) {
            const paths = files.map((f) => `${userId}/${f.name}`);
            await supabase.storage.from(RECEIPTS_BUCKET).remove(paths);
          }

          for (const table of CHILD_TABLES) {
            const { error } = await supabase.from(table).delete().eq("user_id", userId);
            if (error) throw new Error(`${table}: ${error.message}`);
          }

          const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
          if (profileError) throw new Error(`profiles: ${profileError.message}`);

          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
          if (authDeleteError) throw new Error(`auth.deleteUser: ${authDeleteError.message}`);

          purged.push(userId);
        } catch (e) {
          console.error(`purge-deleted-accounts: failed for user ${userId}:`, e);
          failed.push({ id: userId, error: e instanceof Error ? e.message : String(e) });
        }
      }

      return new Response(JSON.stringify({ purged, failed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("purge-deleted-accounts error:", e);
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
  { verifyJWT: false },
);
