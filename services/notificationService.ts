// -- Notification Service (Expo Go safe stubs) ----------------------------
// expo-notifications cannot run in Expo Go from SDK 53+.
// These stubs keep the app working in Expo Go during development.
// The real scheduling implementation lives in notificationService.real.ts
// and is swapped in at EAS build time.
// All preference toggles still persist to AsyncStorage so settings work.
// -------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "mx_notification_prefs";

export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function savePushToken(
  userId: string,
  token: string,
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);
}

export async function scheduleWeeklyExpenseReminder(): Promise<void> {
  // Activates in EAS build
}

export async function scheduleMonthlyReportReminder(): Promise<void> {
  // Activates in EAS build
}

export async function scheduleSARSDeadlineReminders(): Promise<void> {
  // Activates in EAS build
}

export async function scheduleReceiptReminder(
  _expenseId: string,
  _vendorName: string,
  _amount: number,
): Promise<void> {
  // Activates in EAS build
}

export async function cancelReceiptReminder(_expenseId: string): Promise<void> {
  // Activates in EAS build
}

export async function scheduleSubscriptionReminder(
  _renewalDate: Date,
): Promise<void> {
  // Activates in EAS build
}

export function setupNotificationResponseHandler(
  _onNavigate: (route: string) => void,
): { remove: () => void } {
  return { remove: () => {} };
}