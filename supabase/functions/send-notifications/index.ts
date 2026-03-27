// supabase/functions/send-notifications/index.ts
// Sends push notifications via Expo Push API
// Called by pg_cron daily and can be triggered manually

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

async function sendExpoPushNotifications(
  messages: PushMessage[],
): Promise<void> {
  if (messages.length === 0) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  console.log("Expo push result:", JSON.stringify(result));
}

Deno.serve(
  async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const { type } = await req.json();
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const { createClient } = await import("npm:@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, serviceKey);

      const messages: PushMessage[] = [];
      const today = new Date();

      if (type === "daily" || type === "sars") {
        // ── SARS deadline reminders ──────────────────────────────────────────
        const SARS_DATES = [
          {
            date: "2025-07-01",
            daysWarning: 7,
            title: "📅 SARS eFiling opens in 1 week",
            body: "eFiling opens 1 July 2025. Start preparing your ITR12 export in MyExpense.",
          },
          {
            date: "2025-07-01",
            daysWarning: 0,
            title: "🟢 SARS eFiling is now open",
            body: "Tax season is open! Generate your ITR12 export and submit via eFiling.",
          },
          {
            date: "2025-10-21",
            daysWarning: 30,
            title: "⏳ 30 days to ITR12 deadline",
            body: "Non-provisional deadline is 21 Oct. Capture all expenses in MyExpense now.",
          },
          {
            date: "2025-10-21",
            daysWarning: 7,
            title: "🚨 7 days to file your ITR12",
            body: "Deadline: 21 October 2025. Generate your ITR12 export in MyExpense today.",
          },
          {
            date: "2026-01-20",
            daysWarning: 30,
            title: "⏳ 30 days to provisional tax deadline",
            body: "IRP6 deadline is 20 January 2026. Review your tax summary in MyExpense.",
          },
          {
            date: "2026-01-20",
            daysWarning: 7,
            title: "🚨 7 days to provisional tax deadline",
            body: "IRP6 deadline: 20 January 2026. Check your MyExpense tax summary now.",
          },
        ];

        for (const sars of SARS_DATES) {
          const targetDate = new Date(sars.date);
          targetDate.setDate(targetDate.getDate() - sars.daysWarning);
          const isToday =
            targetDate.getFullYear() === today.getFullYear() &&
            targetDate.getMonth() === today.getMonth() &&
            targetDate.getDate() === today.getDate();

          if (isToday) {
            // Send to all users with push tokens
            const { data: profiles } = await supabase
              .from("profiles")
              .select("push_token")
              .not("push_token", "is", null);

            for (const profile of profiles ?? []) {
              if (profile.push_token) {
                messages.push({
                  to: profile.push_token,
                  title: sars.title,
                  body: sars.body,
                  data: { type: "sars_deadline", route: "/tax-summary" },
                  sound: "default",
                  channelId: "sars",
                });
              }
            }
          }
        }
      }

      if (type === "daily" || type === "receipts") {
        // ── Receipt reminders — expenses without receipts older than 24h ──────
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: expenses } = await supabase
          .from("expenses")
          .select("id, user_id, vendor, amount, expense_date")
          .is("receipt_url", null)
          .eq("is_deductible", true)
          .lt("created_at", yesterday.toISOString());

        if (expenses && expenses.length > 0) {
          // Group by user
          const byUser: Record<string, typeof expenses> = {};
          for (const exp of expenses) {
            if (!byUser[exp.user_id]) byUser[exp.user_id] = [];
            byUser[exp.user_id].push(exp);
          }

          for (const [userId, userExpenses] of Object.entries(byUser)) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("push_token")
              .eq("id", userId)
              .single();

            if (profile?.push_token) {
              const count = userExpenses.length;
              messages.push({
                to: profile.push_token,
                title: `🧾 ${count} expense${count > 1 ? "s" : ""} missing receipts`,
                body:
                  count === 1
                    ? `Add a receipt to "${userExpenses[0].vendor}" to maximise your ITR12 deduction.`
                    : `${count} deductible expenses are missing receipts. Add them to maximise your ITR12 claim.`,
                data: { type: "receipt_reminder", route: "/expense-history" },
                sound: "default",
                channelId: "receipts",
              });
            }
          }
        }
      }

      if (type === "weekly") {
        // ── Weekly expense capture reminder — runs on Mondays ─────────────────
        const dayOfWeek = today.getDay(); // 1 = Monday
        if (dayOfWeek === 1) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, push_token, full_name")
            .not("push_token", "is", null);

          for (const profile of profiles ?? []) {
            if (profile.push_token) {
              // Check if they added any expenses this week
              const weekAgo = new Date(today);
              weekAgo.setDate(weekAgo.getDate() - 7);

              const { count } = await supabase
                .from("expenses")
                .select("id", { count: "exact" })
                .eq("user_id", profile.id)
                .gte("created_at", weekAgo.toISOString());

              const firstName =
                (profile.full_name ?? "").split(" ")[0] || "there";

              messages.push({
                to: profile.push_token,
                title: "📊 Weekly expense check-in",
                body:
                  count && count > 0
                    ? `Great work ${firstName}! You captured ${count} expense${count > 1 ? "s" : ""} this week. Keep it up for a smooth ITR12.`
                    : `Hey ${firstName}, don't forget to capture this week's business expenses for your ITR12.`,
                data: { type: "weekly", route: "/(tabs)/add-expense" },
                sound: "default",
                channelId: "default",
              });
            }
          }
        }
      }

      // Send all queued messages in batches of 100 (Expo limit)
      const BATCH_SIZE = 100;
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        await sendExpoPushNotifications(messages.slice(i, i + BATCH_SIZE));
      }

      return new Response(JSON.stringify({ sent: messages.length, type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
  { verifyJWT: false },
);
