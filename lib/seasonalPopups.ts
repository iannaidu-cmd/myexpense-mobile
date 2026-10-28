// Once-off dashboard popups tied to the SA tax calendar. Everything here is
// derived from the date, so the popups roll forward every year on their own
// instead of needing hand-edited dates and storage keys each cycle.
//
// Storage keys keep the exact format the old hardcoded keys used
// ("..._v3_2026", "..._v2_2026"), so anyone who already dismissed the 2026
// popups won't see them again.
//
// SARS dates assumed to repeat each year (same as app/itr12-efiling-guide.tsx):
// eFiling opens 13 Jul, non-provisional deadline 23 Oct, provisional 22 Jan.

export type SeasonalPopupKind = "taxSeasonOpen" | "period2";

export type SeasonalPopupContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
};

export type SeasonalPopup = {
  key: string;
  content: SeasonalPopupContent;
};

const fmt = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const lastDayOfFeb = (year: number) => new Date(year, 2, 0); // leap-safe
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// Tax season for the year that just ended: open from 13 Jul until the
// provisional deadline (22 Jan next year). Most freelancers are provisional
// taxpayers, so the popup stays relevant after the 23 Oct deadline — only
// the subtitle changes once that has passed.
export function taxSeasonPopup(now: Date = new Date()): SeasonalPopup | null {
  // The season that opened most recently: this year's if 13 Jul has passed,
  // otherwise last year's (which may still be open until 22 Jan).
  const y = now >= new Date(now.getFullYear(), 6, 13) ? now.getFullYear() : now.getFullYear() - 1;
  const opens = new Date(y, 6, 13);
  const nonProvisional = new Date(y, 9, 23);
  const provisional = new Date(y + 1, 0, 22);
  if (now < opens || now > endOfDay(provisional)) return null;

  const subtitle =
    now <= endOfDay(nonProvisional)
      ? "SARS eFiling is open for manual submissions. Start on your ITR12 now, so October doesn't sneak up on you."
      : `If you're a provisional taxpayer (most freelancers are), you still have until ${fmt(provisional)} to submit your ITR12.`;

  return {
    key: `@myexpense:seen_tax_season_popup_v3_${y}`,
    content: {
      eyebrow: `Tax season ${y - 1}/${String(y).slice(-2)}`,
      title: "Tax season is open",
      subtitle,
      rows: [
        { label: "eFiling opened", value: fmt(opens) },
        { label: "Non-provisional deadline", value: fmt(nonProvisional) },
        { label: "Provisional & trusts deadline", value: fmt(provisional) },
      ],
    },
  };
}

// Second provisional tax period: 1 Sep until the tax year ends on the last
// day of February.
export function period2Popup(now: Date = new Date()): SeasonalPopup | null {
  // Jan/Feb belong to the period that started the previous September.
  const s = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  const starts = new Date(s, 8, 1);
  const ends = lastDayOfFeb(s + 1);
  if (now < starts || now > endOfDay(ends)) return null;

  return {
    key: `@myexpense:seen_period2_popup_v2_${s}`,
    content: {
      eyebrow: "Period 2 of 2",
      title: "Your second period has started",
      subtitle: "Halfway through the tax year. Keep logging so your next estimate stays accurate.",
      rows: [
        { label: "Track expenses from", value: fmt(starts) },
        { label: "Track expenses until", value: fmt(ends) },
        { label: "Pay your estimate by", value: fmt(ends) },
      ],
    },
  };
}

export function seasonalPopup(kind: SeasonalPopupKind, now: Date = new Date()): SeasonalPopup | null {
  return kind === "period2" ? period2Popup(now) : taxSeasonPopup(now);
}
