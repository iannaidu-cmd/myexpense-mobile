import { period2Popup } from "@/lib/seasonalPopups";

// ─── period2Popup ─────────────────────────────────────────────────────────────

describe("period2Popup", () => {
  it("uses the v3 storage key so the updated popup shows once", () => {
    expect(period2Popup(new Date(2026, 9, 28))?.key).toBe("@myexpense:seen_period2_popup_v3_2026");
  });

  it("is closed from March to August", () => {
    expect(period2Popup(new Date(2027, 2, 1))).toBeNull();
    expect(period2Popup(new Date(2027, 7, 31))).toBeNull();
  });

  it("opens on 1 Sep and rolls to the next year's key", () => {
    expect(period2Popup(new Date(2027, 8, 1))?.key).toBe("@myexpense:seen_period2_popup_v3_2027");
  });

  it("Jan/Feb still belong to the period that started the previous September", () => {
    expect(period2Popup(new Date(2027, 1, 28))?.key).toBe("@myexpense:seen_period2_popup_v3_2026");
  });

  it("runs to 29 Feb in a leap year", () => {
    expect(period2Popup(new Date(2028, 1, 29, 12))?.key).toBe("@myexpense:seen_period2_popup_v3_2027");
    expect(period2Popup(new Date(2028, 2, 1))).toBeNull();
  });

  it("has the new headline and no period label", () => {
    const c = period2Popup(new Date(2026, 10, 23))!.content;
    expect(c.title).toBe("Your next SARS deadlines");
    expect(c.eyebrow).toBeUndefined();
  });

  it("lists the provisional and trusts deadline as 22 Jan of the following year", () => {
    const row = period2Popup(new Date(2026, 10, 23))!.content.rows.find((r) => r.label === "Provisional & trusts deadline");
    expect(row?.value).toBe(new Date(2027, 0, 22).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }));
  });
});
