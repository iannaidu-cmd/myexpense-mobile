import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  await supabase.from("profiles").update({ push_token: token }).eq("id", userId);
}

// Cancel-then-reschedule with the same identifier races on Android: this app
// relaunches its JS often (OEM battery managers kill it), and each relaunch
// re-runs the scheduling calls in _layout.tsx. If the cancel of a recurring
// (WEEKLY/MONTHLY) trigger hasn't fully cleared the underlying system alarm
// before the reschedule lands, both the old and new alarm can end up firing,
// producing duplicate notifications with identical content. Checking whether
// the identifier is already scheduled — instead of always cancel+reschedule —
// sidesteps that race entirely: repeat calls become no-ops once it's set.
async function isAlreadyScheduled(identifier: string): Promise<boolean> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  return existing.some((n) => n.identifier === identifier);
}

// One-time cleanup for installs that hit the cancel/reschedule race above
// before isAlreadyScheduled existed. When that race fires, the OS ends up
// with two live alarms for the same identifier, but getAllScheduledNotificationsAsync
// (and therefore isAlreadyScheduled) only ever surfaces the most recently
// registered one — so the orphaned duplicate is invisible to the guard above
// and fires forever alongside the tracked one. cancelAllScheduledNotificationsAsync
// clears every OS-level alarm regardless of whether Expo still knows about
// it, which actually removes the orphan. Gated to run once per install so it
// doesn't itself re-trigger the same race on every relaunch.
const DEDUP_RESET_KEY = "@myexpense:notif_dedup_reset_v1";

export async function resetDuplicateNotificationsOnce(): Promise<void> {
  const alreadyReset = await AsyncStorage.getItem(DEDUP_RESET_KEY);
  if (alreadyReset) return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await AsyncStorage.setItem(DEDUP_RESET_KEY, "1");
}

export async function scheduleWeeklyExpenseReminder(): Promise<void> {
  if (await isAlreadyScheduled("weekly-expense-reminder")) return;
  await Notifications.scheduleNotificationAsync({
    identifier: "weekly-expense-reminder",
    content: {
      title: "Don't forget your expenses",
      body: "Track this week's business expenses to keep your ITR12 ready.",
      data: { route: "/(tabs)" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Monday (1 = Sunday)
      hour: 9,
      minute: 0,
    },
  });
}

export async function scheduleMonthlyReportReminder(): Promise<void> {
  if (await isAlreadyScheduled("monthly-report-reminder")) return;
  await Notifications.scheduleNotificationAsync({
    identifier: "monthly-report-reminder",
    content: {
      title: "Your monthly expense report is ready",
      body: "Review last month's deductions and tax savings.",
      data: { route: "/reports-dashboard" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: 1,
      hour: 8,
      minute: 0,
    },
  });
}

export async function scheduleSARSDeadlineReminders(): Promise<void> {
  const year = new Date().getFullYear();
  const now = new Date();

  // eFiling open fires ON the day (1 Jul) — not early, since the message says "opens today".
  const efilingOpenDate = new Date(year, 6, 1, 8, 0, 0);
  if (efilingOpenDate > now && !(await isAlreadyScheduled("sars-efiling-open"))) {
    await Notifications.scheduleNotificationAsync({
      identifier: "sars-efiling-open",
      content: {
        title: "SARS Deadline Reminder",
        body: "SARS eFiling opens today. Start preparing your ITR12.",
        data: { route: "/itr12-export-setup" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: efilingOpenDate,
      },
    });
  }

  // Deadline reminders fire 1 week before the actual deadline at 08:00.
  const deadlines = [
    {
      id: "sars-nonprovisional-deadline",
      date: new Date(year, 9, 23, 8, 0, 0),
      body: "SARS non-provisional taxpayer deadline is approaching (23 Oct).",
    },
    {
      // Provisional/trust filing deadline is 22 Jan — the *next* occurrence:
      // if we're still in Jan on/before the 22nd, that's this year; otherwise
      // it's next year's 22 Jan. (Always using year+1 is wrong for the window
      // between 1 Jan and the deadline itself, since that miscomputes a full
      // year ahead of the actual upcoming deadline.)
      id: "sars-provisional-deadline",
      date: new Date(
        now.getMonth() === 0 && now.getDate() <= 22 ? year : year + 1,
        0,
        22,
        8, 0, 0,
      ),
      body: "SARS provisional taxpayer deadline is approaching (22 Jan).",
    },
  ];

  for (const { id, date, body } of deadlines) {
    const reminderDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (reminderDate > now && !(await isAlreadyScheduled(id))) {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: "SARS Deadline Reminder",
          body,
          data: { route: "/itr12-export-setup" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });
    }
  }
}

export async function cancelWeeklyExpenseReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("weekly-expense-reminder").catch(() => {});
}

export async function cancelMonthlyReportReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("monthly-report-reminder").catch(() => {});
}

export async function cancelSARSDeadlineReminders(): Promise<void> {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync("sars-efiling-open"),
    Notifications.cancelScheduledNotificationAsync("sars-nonprovisional-deadline"),
    Notifications.cancelScheduledNotificationAsync("sars-provisional-deadline"),
  ]).catch(() => {});
}

export async function scheduleReceiptReminder(
  expenseId: string,
  vendorName: string,
  amount: number,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `receipt-${expenseId}`,
    content: {
      title: "Receipt still missing",
      body: `Add a receipt for ${vendorName} (R${amount.toFixed(2)}) to support your deduction.`,
      data: { route: "/(tabs)" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60, // 24 hours
      repeats: false,
    },
  });
}

export async function cancelReceiptReminder(expenseId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`receipt-${expenseId}`);
}

export async function scheduleSubscriptionReminder(renewalDate: Date): Promise<void> {
  const reminderDate = new Date(renewalDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before
  if (reminderDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "MyExpense subscription renewing soon",
        body: "Your premium subscription renews in 3 days.",
        data: { route: "/(tabs)/settings" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
  }
}

export function setupNotificationResponseHandler(
  onNavigate: (route: string) => void,
): { remove: () => void } {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = response.notification.request.content.data?.route as string | undefined;
    if (route) onNavigate(route);
  });
  return { remove: () => sub.remove() };
}
