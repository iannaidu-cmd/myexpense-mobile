import { supabase } from "@/lib/supabase";
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

export async function scheduleWeeklyExpenseReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't forget your expenses",
      body: "Track this week's business expenses to keep your ITR12 ready.",
      data: { route: "/(tabs)" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Monday
      hour: 9,
      minute: 0,
    },
  });
}

export async function scheduleMonthlyReportReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
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
  const deadlines = [
    { date: new Date(year, 6, 1),  body: "SARS eFiling opens today. Start preparing your ITR12." },
    { date: new Date(year, 9, 23), body: "SARS non-provisional taxpayer deadline is approaching (23 Oct)." },
    { date: new Date(year, 0, 31), body: "SARS provisional taxpayer deadline is approaching (31 Jan)." },
  ];

  for (const { date, body } of deadlines) {
    const reminderDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week before
    if (reminderDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
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
