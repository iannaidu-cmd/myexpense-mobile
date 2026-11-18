// ─── Weekly summary reminder ──────────────────────────────────────────────────
// The Monday reminder shows what the user has logged so far this tax year, so
// it gives a reason to come back instead of a generic nudge. The figures come
// from the Home screen's last load (see notificationService.updateWeeklySummary)
// and are only ever the user's own; before Home has loaded once, the generic
// copy below is used instead.
// ─────────────────────────────────────────────────────────────────────────────

export interface WeeklySummaryFigures {
  expenseCount: number;
  /** Rand value of the logged expenses that can be claimed. */
  claimable: number;
  tripCount: number;
  businessKm: number;
}

export interface WeeklySummaryContent {
  title: string;
  body: string;
}

export const GENERIC_WEEKLY_CONTENT: WeeklySummaryContent = {
  title: "Don't forget your expenses",
  body: "Add this week's business expenses so your tax return is ready when you need it.",
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const rands = (amount: number) =>
  `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function weeklySummaryContent(f: WeeklySummaryFigures): WeeklySummaryContent {
  if (f.expenseCount === 0 && f.tripCount === 0) {
    return {
      title: "Start your SARS claim",
      body: "You haven't logged any expenses or work trips yet this tax year. Scan one receipt to get started.",
    };
  }

  const parts: string[] = [];
  if (f.expenseCount > 0) {
    const expenses = plural(f.expenseCount, "expense", "expenses");
    parts.push(f.claimable > 0 ? `${expenses} (${rands(f.claimable)} you can claim)` : expenses);
  }
  if (f.tripCount > 0) {
    const trips = plural(f.tripCount, "work trip", "work trips");
    const km = Math.round(f.businessKm);
    parts.push(km > 0 ? `${trips} (${km.toLocaleString("en-ZA")} km)` : trips);
  }

  return {
    title: "What you've logged so far",
    body: `This tax year: ${parts.join(" and ")}. Add this week's so nothing is missed at tax time.`,
  };
}

/** The next `count` Mondays at 09:00 local time, the first strictly after `from`. */
export function upcomingMondays(count: number, from: Date = new Date()): Date[] {
  const first = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 9, 0, 0, 0);
  first.setDate(first.getDate() + ((1 - first.getDay() + 7) % 7));
  if (first <= from) first.setDate(first.getDate() + 7);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    return d;
  });
}

/** One identifier per Monday, so rescheduling a week replaces it in place. */
export function weeklyReminderId(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `weekly-summary-${date.getFullYear()}-${mm}-${dd}`;
}
