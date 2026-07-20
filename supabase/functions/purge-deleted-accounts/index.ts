// Deploy: npx supabase functions deploy purge-deleted-accounts --no-verify-jwt
//
// Called daily by pg_cron (see supabase/migrations/20260715000000_add_account_deletion.sql)
// via pg_net, never by a user directly. Finds every profile whose 30-day
// account-deletion grace period (profiles.deletion_requested_at) has
// elapsed and permanently removes that user's identity and non-financial
// data.
//
// Per the published Account & Data Deletion Policy and the Privacy Policy's
// retention clause: transaction/expense records tied to tax filings
// (expenses, income) are RETAINED 5 years (Tax Administration Act
// record-keeping), not deleted here — only their receipt/OCR references are
// stripped. Everything else (receipts/photos, mileage, bank accounts, home
// office settings, computed tax summaries, profile PII, login) is fully
// removed within 30 days.
//
// IMPORTANT: profiles.id has `FOREIGN KEY (id) REFERENCES auth.users(id) ON
// DELETE CASCADE` (confirmed via pg_constraint/pg_get_constraintdef —
// information_schema's cross-schema join missed this FK entirely, don't
// trust it alone for this kind of check again). That means calling
// auth.admin.deleteUser() ALWAYS cascades away profiles and, through its own
// CASCADE, every retained row too — there is no way to keep expenses/income
// alive after a real deleteUser() call. So instead of deleting the auth
// user here, we anonymise + permanently ban it (email replaced, password
// rotated to a random value, banned for longer than the retention window) —
// this satisfies "email/password deleted within 30 days" and "can't sign
// back in" without breaking the FK chain the retained records depend on.
// The actual auth.users row (and cascade) is only deleted by a FUTURE job,
// once the 5-year retention period itself has elapsed — not built yet, see
// the TODO below.
//
// Five of the eight user-owned tables (expenses, income, profiles, receipts,
// tax_summary) predate migration tracking and have no CREATE TABLE in this
// repo, so cascade behavior was verified directly against the live schema
// rather than assumed.
//
// TODO(follow-up, not urgent — 5 years out at the earliest): a second
// scheduled job that finds profiles where purged_at <= now() - interval
// '5 years' and calls auth.admin.deleteUser() on them, completing the
// lifecycle by finally cascading away the retained expenses/income.

import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 30;
const RECEIPTS_BUCKET = "receipts";

// Fully deleted — not part of the "transaction/expense record" retained per policy.
const FULLY_DELETED_TABLES = ["mileage_trips", "bank_accounts", "home_office_settings", "tax_summary"] as const;

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
        .is("purged_at", null)
        .lte("deletion_requested_at", cutoff);

      if (queryError) throw new Error(queryError.message);

      for (const { id: userId } of dueProfiles ?? []) {
        try {
          // Storage cleanup — receipt photos/OCR scans are fully deleted,
          // only the underlying expense record (vendor, amount, category,
          // date) is retained.
          const { data: files } = await supabase.storage.from(RECEIPTS_BUCKET).list(userId, {
            limit: 1000,
          });
          if (files && files.length > 0) {
            const paths = files.map((f) => `${userId}/${f.name}`);
            await supabase.storage.from(RECEIPTS_BUCKET).remove(paths);
          }

          const { error: receiptsError } = await supabase.from("receipts").delete().eq("user_id", userId);
          if (receiptsError) throw new Error(`receipts: ${receiptsError.message}`);

          for (const table of FULLY_DELETED_TABLES) {
            const { error } = await supabase.from(table).delete().eq("user_id", userId);
            if (error) throw new Error(`${table}: ${error.message}`);
          }

          // Retain expenses — strip only the receipt/OCR references, which
          // point at files just deleted above.
          const { error: expensesError } = await supabase
            .from("expenses")
            .update({ receipt_url: null, storage_path: null, ocr_raw: null })
            .eq("user_id", userId);
          if (expensesError) throw new Error(`expenses: ${expensesError.message}`);

          // income is retained as-is — no receipt/OCR fields on that table.

          // Strip PII from the profile but keep the row alive: expenses/
          // income/receipts/tax_summary all CASCADE from profiles.id, so
          // deleting it would take the retained records down with it.
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              full_name: null,
              business_name: null,
              phone: null,
              tax_number: null,
              work_type: null,
              push_token: null,
              purged_at: new Date().toISOString(),
            })
            .eq("id", userId);
          if (profileError) throw new Error(`profiles: ${profileError.message}`);

          // Anonymise + permanently ban rather than delete — deleting the
          // auth user would CASCADE away profiles and, through it, the
          // expenses/income rows we just retained. Email and password are
          // gone (satisfies the 30-day promise); the account can never sign
          // in again (ban_duration comfortably outlasts the 5-year
          // retention window this function itself enforces).
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
            email: `deleted-${userId}@myexpense.co.za`,
            password: crypto.randomUUID() + crypto.randomUUID(),
            ban_duration: "87600h", // 10 years — the eventual 5-year final-purge job deletes the row long before this would ever expire
          });
          if (authUpdateError) throw new Error(`auth.updateUserById: ${authUpdateError.message}`);

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
