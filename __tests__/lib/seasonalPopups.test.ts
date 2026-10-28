import { period2Popup, taxSeasonPopup } from "@/lib/seasonalPopups";

// ─── taxSeasonPopup ───────────────────────────────────────────────────────────

describe("taxSeasonPopup", () => {
  it("keeps the exact storage key the old hardcoded 2026 popup used", () => {
    expect(taxSeasonPopup(new Date(2026, 9, 28))?.key).toBe("@myexpense:seen_tax_season_popup_v3_2026");
  });

  it("is closed before eFiling opens on 13 Jul", () => {
    expect(taxSeasonPopup(new Date(2027, 6, 12, 23, 59))).toBeNull();
  });

  it("opens on 13 Jul for the tax year that just ended", () => {
    const popup = taxSeasonPopup(new Date(2027, 6, 13));
    expect(popup?.key).toBe("@myexpense:seen_tax_season_popup_v3_2027");
    expect(popup?.content.eyebrow).toBe("Tax season 2026/27");
  });

  it("stays open through 22 Jan of the following year, then closes", () => {
    expect(taxSeasonPopup(new Date(2027, 0, 22, 18))?.key).toBe("@myexpense:seen_tax_season_popup_v3_2026");
    expect(taxSeasonPopup(new Date(2027, 0, 23))).toBeNull();
  });

  it("switches to provisional-taxpayer wording after the 23 Oct deadline", () => {
    expect(taxSeasonPopup(new Date(2026, 9, 23, 12))?.content.subtitle).toMatch(/October/);
    expect(taxSeasonPopup(new Date(2026, 9, 24))?.content.subtitle).toMatch(/provisional taxpayer/);
  });
});

// ─── period2Popup ─────────────────────────────────────────────────────────────

describe("period2Popup", () => {
  it("keeps the exact storage key the old hardcoded 2026 popup used", () => {
    expect(period2Popup(new Date(2026, 9, 28))?.key).toBe("@myexpense:seen_period2_popup_v2_2026");
  });

  it("is closed from March to August", () => {
    expect(period2Popup(new Date(2027, 2, 1))).toBeNull();
    expect(period2Popup(new Date(2027, 7, 31))).toBeNull();
  });

  it("opens on 1 Sep and rolls to the next year's key", () => {
    expect(period2Popup(new Date(2027, 8, 1))?.key).toBe("@myexpense:seen_period2_popup_v2_2027");
  });

  it("Jan/Feb still belong to the period that started the previous September", () => {
    expect(period2Popup(new Date(2027, 1, 28))?.key).toBe("@myexpense:seen_period2_popup_v2_2026");
  });

  it("runs to 29 Feb in a leap year", () => {
    expect(period2Popup(new Date(2028, 1, 29, 12))?.key).toBe("@myexpense:seen_period2_popup_v2_2027");
    expect(period2Popup(new Date(2028, 2, 1))).toBeNull();
  });
});
