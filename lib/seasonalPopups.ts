// Once-off dashboard popup tied to the SA tax calendar. Everything here is
// derived from the date, so the popup rolls forward every year on its own
// instead of needing hand-edited dates and storage keys each cycle.
//
// SARS dates assumed to repeat each year (same as app/itr12-efiling-guide.tsx):
// provisional and trusts filing deadline 22 Jan.
//
// A "Tax season is open" popup used to live here too. It was removed on
// 2026-11-23; its provisional and trusts deadline now shows in period2.

export type SeasonalPopupKind = "period2";

export type SeasonalPopupContent = {
  eyebrow?: string;
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

// Second provisional tax period: 1 Sep until the tax year ends on the last
// day of February. The provisional and trusts filing deadline (22 Jan) falls
// inside it, so it's listed here.
export function period2Popup(now: Date = new Date()): SeasonalPopup | null {
  // Jan/Feb belong to the period that started the previous September.
  const s = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  const starts = new Date(s, 8, 1);
  const provisional = new Date(s + 1, 0, 22);
  const ends = lastDayOfFeb(s + 1);
  if (now < starts || now > endOfDay(ends)) return null;

  return {
    // v3: content changed on 2026-11-23 (deadline added), so people who
    // dismissed the v2 popup see the new dates once.
    key: `@myexpense:seen_period2_popup_v3_${s}`,
    content: {
      title: "Your next SARS deadlines",
      subtitle: "Halfway through the tax year. Keep logging so your next estimate stays accurate.",
      rows: [
        { label: "Track expenses from", value: fmt(starts) },
        { label: "Provisional & trusts deadline", value: fmt(provisional) },
        { label: "Track expenses until", value: fmt(ends) },
        { label: "Pay your estimate by", value: fmt(ends) },
      ],
    },
  };
}

export function seasonalPopup(kind: SeasonalPopupKind, now: Date = new Date()): SeasonalPopup | null {
  return period2Popup(now);
}
