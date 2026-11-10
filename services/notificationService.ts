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
//
// v2 also clears reminders scheduled with the old wording, since the
// isAlreadyScheduled guard would otherwise keep them forever.
const DEDUP_RESET_KEY = "@myexpense:notif_dedup_reset_v2";

export async function resetDuplicateNotificationsOnce(): Promise<void> {
  const alreadyReset = await AsyncStorage.getItem(DEDUP_RESET_KEY);
  if (alreadyReset) return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await AsyncStorage.setItem(DEDUP_RESET_KEY, "1");
}

// ─── User preferences (Me > Notifications) ───────────────────────────────────
// Stored on the device. Every scheduling path reads these, so a reminder the
// user switched off is never put back on the next app open.
export const NOTIFICATION_PREFS_KEY = "mx_notification_prefs";

export interface NotificationPrefs {
  weeklyReminder: boolean;
  sarsDeadlines: boolean;
  receiptReminders: boolean;
  monthlyReport: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  weeklyReminder: true,
  sarsDeadlines: true,
  receiptReminders: true,
  monthlyReport: true,
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) } : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

/** Schedules the reminders the user has switched on and cancels the rest.
 *  Safe to call on every app open: scheduling is a no-op once set. */
export async function syncScheduledReminders(): Promise<void> {
  const prefs = await getNotificationPrefs();
  await (prefs.weeklyReminder ? scheduleWeeklyExpenseReminder() : cancelWeeklyExpenseReminder());
  await (prefs.monthlyReport ? scheduleMonthlyReportReminder() : cancelMonthlyReportReminder());
  await (prefs.sarsDeadlines ? scheduleSARSDeadlineReminders() : cancelSARSDeadlineReminders());
  if (!prefs.receiptReminders) await cancelAllReceiptReminders();
}

export async function scheduleWeeklyExpenseReminder(): Promise<void> {
  if (await isAlreadyScheduled("weekly-expense-reminder")) return;
  await Notifications.scheduleNotificationAsync({
    identifier: "weekly-expense-reminder",
    content: {
      title: "Don't forget your expenses",
      body: "Add this week's business expenses so your tax return is ready when you need it.",
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
      title: "Time to check last month",
      body: "Look over last month's expenses and see what you can claim back from SARS.",
      data: { route: "/(tabs)/reports" },
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

  // Auto-assessment notices go out 1–12 Jul; eFiling opens for everyone else
  // (manual submission, non-provisional and provisional) on 13 Jul. Both
  // fire ON the day, not early, since the message says "opens/starts today".
  const autoAssessmentStartDate = new Date(year, 6, 1, 8, 0, 0);
  if (autoAssessmentStartDate > now && !(await isAlreadyScheduled("sars-auto-assessment-start"))) {
    await Notifications.scheduleNotificationAsync({
      identifier: "sars-auto-assessment-start",
      content: {
        title: "SARS filing season starts today",
        body: "SARS starts sending auto-assessments today. Check your SMS and email in case you get one.",
        data: { route: "/itr12-export-setup" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: autoAssessmentStartDate,
      },
    });
  }

  const efilingOpenDate = new Date(year, 6, 13, 8, 0, 0);
  if (efilingOpenDate > now && !(await isAlreadyScheduled("sars-efiling-open"))) {
    await Notifications.scheduleNotificationAsync({
      identifier: "sars-efiling-open",
      content: {
        title: "SARS eFiling opens today",
        body: "You can now file your tax return. Start getting your expenses ready.",
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
      body: "The last day to file your tax return is 23 October. Get your expenses ready now.",
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
      body: "If you pay provisional tax, the last day to file your tax return is 22 January.",
    },
  ];

  for (const { id, date, body } of deadlines) {
    const reminderDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (reminderDate > now && !(await isAlreadyScheduled(id))) {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: "SARS deadline in one week",
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
    Notifications.cancelScheduledNotificationAsync("sars-auto-assessment-start"),
    Notifications.cancelScheduledNotificationAsync("sars-efiling-open"),
    Notifications.cancelScheduledNotificationAsync("sars-nonprovisional-deadline"),
    Notifications.cancelScheduledNotificationAsync("sars-provisional-deadline"),
  ]).catch(() => {});
}

// ─── Receipt reminders ───────────────────────────────────────────────────────
// One nudge 24 hours after a business expense is saved without a receipt.
// Never throws: a reminder failing must not fail the save that triggered it.
const RECEIPT_REMINDER_DELAY_SECONDS = 24 * 60 * 60;
const RECEIPT_PREFIX = "receipt-";
const BANK_IMPORT_RECEIPT_ID = `${RECEIPT_PREFIX}bank-import`;

export async function scheduleReceiptReminder(
  expenseId: string,
  vendorName: string,
  amount: number,
): Promise<void> {
  try {
    if (!(await getNotificationPrefs()).receiptReminders) return;
    const rands = amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    await Notifications.scheduleNotificationAsync({
      identifier: `${RECEIPT_PREFIX}${expenseId}`,
      content: {
        title: "Add your receipt",
        body: `Add the receipt for ${vendorName} (R ${rands}). Keeping it helps if SARS asks for proof.`,
        data: { route: `/expense-detail?id=${expenseId}` },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: RECEIPT_REMINDER_DELAY_SECONDS,
        repeats: false,
      },
    });
  } catch (e) {
    console.warn("Receipt reminder not scheduled:", e);
  }
}

/** One grouped reminder for a bank import, instead of one per row. A later
 *  import replaces it, with that import's count. */
export async function scheduleBankImportReceiptReminder(count: number): Promise<void> {
  if (count <= 0) return;
  try {
    if (!(await getNotificationPrefs()).receiptReminders) return;
    await Notifications.cancelScheduledNotificationAsync(BANK_IMPORT_RECEIPT_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: BANK_IMPORT_RECEIPT_ID,
      content: {
        title: "Add receipts for your imported expenses",
        body: `You imported ${count} business ${count === 1 ? "expense" : "expenses"} from your bank statement. Add the receipts in case SARS asks for proof.`,
        data: { route: "/expense-history" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: RECEIPT_REMINDER_DELAY_SECONDS,
        repeats: false,
      },
    });
  } catch (e) {
    console.warn("Bank import receipt reminder not scheduled:", e);
  }
}

export async function cancelReceiptReminder(expenseId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`${RECEIPT_PREFIX}${expenseId}`);
}

/** For deletes. Never throws. */
export async function cancelReceiptReminders(expenseIds: string[]): Promise<void> {
  await Promise.all(expenseIds.map((id) => cancelReceiptReminder(id).catch(() => {})));
}

export async function cancelAllReceiptReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(RECEIPT_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

/** "granted", "denied" (must go to phone settings) or "undetermined" (we can ask). */
export async function getNotificationPermission(): Promise<"granted" | "denied" | "undetermined"> {
  if (Platform.OS === "web") return "denied";
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  return canAskAgain ? "undetermined" : "denied";
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
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
