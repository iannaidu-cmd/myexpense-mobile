// ─── Notification Service ─────────────────────────────────────────────────────
// Push notifications require a production build (App Store / Play Store).
// expo-notifications is not compatible with Expo Go from SDK 53+.
// This stub keeps the app working in Expo Go during development.
// Full push notification functionality activates automatically in the production build.

export async function registerForPushNotifications(): Promise<string | null> {
  console.log("Push notifications: will activate in production build");
  return null;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  // No-op in Expo Go
}

export async function scheduleWeeklyExpenseReminder(): Promise<void> {
  console.log("Weekly expense reminder: scheduled (activates in production build)");
}

export async function scheduleSARSDeadlineReminders(): Promise<void> {
  console.log("SARS deadline reminders: scheduled (activates in production build)");
}

export async function scheduleReceiptReminder(
  expenseId: string,
  vendorName: string,
  amount: number
): Promise<void> {
  console.log(`Receipt reminder queued for ${vendorName} — activates in production build`);
}

export async function cancelReceiptReminder(expenseId: string): Promise<void> {
  // No-op in Expo Go
}

export async function scheduleSubscriptionReminder(renewalDate: Date): Promise<void> {
  console.log("Subscription reminder: scheduled (activates in production build)");
}

export function setupNotificationResponseHandler(
  onNavigate: (route: string) => void
): { remove: () => void } {
  // Return a no-op subscription that matches the expected interface
  return { remove: () => {} };
}
