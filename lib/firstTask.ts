// ─── First task screen (app/first-task.tsx) ───────────────────────────────────
// A once-off screen over Home for a user who hasn't logged anything yet: scan
// a first receipt, or start another way. Home itself is never replaced.
// Shown at most once per account per device, whichever way it's left.
// ─────────────────────────────────────────────────────────────────────────────

import { countFreeUses } from "@/services/freeUsageService";
import { incomeService } from "@/services/incomeService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const shownKey = (userId: string) => `@myexpense:first_task_shown:${userId}`;

/** True (and marks it shown) only the first time, and only if nothing at all
 *  is logged: no receipt, expense, trip, import, export or income. Any error
 *  means false, so it never shows to someone who has already started. */
export async function claimFirstTaskScreen(userId: string): Promise<boolean> {
  try {
    if (await AsyncStorage.getItem(shownKey(userId))) return false;
    const [uses, income] = await Promise.all([
      countFreeUses(userId),
      incomeService.getRecentIncome(userId, 1),
    ]);
    if (uses > 0 || income.length > 0) {
      // Already started: never needed on this device.
      await AsyncStorage.setItem(shownKey(userId), "skipped");
      return false;
    }
    await AsyncStorage.setItem(shownKey(userId), new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
