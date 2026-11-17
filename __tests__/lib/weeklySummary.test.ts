import { upcomingMondays, weeklyReminderId, weeklySummaryContent } from "@/lib/weeklySummary";

const none = { expenseCount: 0, claimable: 0, tripCount: 0, businessKm: 0 };

describe("weeklySummaryContent", () => {
  it("asks for a first item when nothing is logged", () => {
    const c = weeklySummaryContent(none);
    expect(c.title).toBe("Start your SARS claim");
    expect(c.body).toMatch(/Scan one receipt/);
  });

  it("lists expenses with the claimable amount and trips with km", () => {
    const c = weeklySummaryContent({ expenseCount: 3, claimable: 1240, tripCount: 2, businessKm: 84.4 });
    expect(c.title).toBe("What you've logged so far");
    expect(c.body).toMatch(/^This tax year: 3 expenses \(R .+ you can claim\) and 2 work trips \(84 km\)\./);
  });

  it("uses singular words for one of each", () => {
    const c = weeklySummaryContent({ expenseCount: 1, claimable: 0, tripCount: 1, businessKm: 0 });
    expect(c.body).toMatch(/^This tax year: 1 expense and 1 work trip\./);
  });

  it("leaves out a part with nothing in it", () => {
    expect(weeklySummaryContent({ ...none, tripCount: 4, businessKm: 120 }).body).not.toMatch(/expense/);
    expect(weeklySummaryContent({ ...none, expenseCount: 2, claimable: 50 }).body).not.toMatch(/trip/);
  });

  it("never uses an em dash", () => {
    const dash = String.fromCharCode(0x2014);
    for (const f of [none, { expenseCount: 2, claimable: 10, tripCount: 1, businessKm: 5 }]) {
      const c = weeklySummaryContent(f);
      expect(c.title + c.body).not.toContain(dash);
    }
  });
});

describe("upcomingMondays", () => {
  it("starts on the coming Monday at 09:00 from a Tuesday", () => {
    const [first, second] = upcomingMondays(2, new Date(2026, 10, 17, 14, 0)); // Tue 17 Nov
    expect(first).toEqual(new Date(2026, 10, 23, 9, 0));
    expect(second).toEqual(new Date(2026, 10, 30, 9, 0));
  });

  it("uses today if it's Monday before 09:00", () => {
    expect(upcomingMondays(1, new Date(2026, 10, 23, 8, 59))[0]).toEqual(new Date(2026, 10, 23, 9, 0));
  });

  it("skips to next week from Monday at or after 09:00", () => {
    expect(upcomingMondays(1, new Date(2026, 10, 23, 9, 0))[0]).toEqual(new Date(2026, 10, 30, 9, 0));
  });

  it("starts on the next day from a Sunday", () => {
    expect(upcomingMondays(1, new Date(2026, 10, 22, 20, 0))[0]).toEqual(new Date(2026, 10, 23, 9, 0));
  });

  it("crosses month and year ends", () => {
    const dates = upcomingMondays(2, new Date(2026, 11, 25));
    expect(dates.map(weeklyReminderId)).toEqual(["weekly-summary-2026-12-28", "weekly-summary-2027-01-04"]);
  });
});
