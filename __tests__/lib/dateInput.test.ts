import { displayDateToISO, formatDateInputDDMMYYYY, isoToDisplayDate, isValidISODate, localISODate } from "@/lib/dateInput";

describe("formatDateInputDDMMYYYY", () => {
  it("auto-inserts a slash after the day", () => {
    expect(formatDateInputDDMMYYYY("14")).toBe("14");
    expect(formatDateInputDDMMYYYY("141")).toBe("14/1");
  });

  it("auto-inserts a slash after the month", () => {
    expect(formatDateInputDDMMYYYY("1410")).toBe("14/10");
    expect(formatDateInputDDMMYYYY("14101")).toBe("14/10/1");
  });

  it("builds a full DD/MM/YYYY string from raw digits", () => {
    expect(formatDateInputDDMMYYYY("14101977")).toBe("14/10/1977");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatDateInputDDMMYYYY("14/10/1977")).toBe("14/10/1977");
  });

  it("caps input at 8 digits (DDMMYYYY)", () => {
    expect(formatDateInputDDMMYYYY("141019779999")).toBe("14/10/1977");
  });
});

describe("displayDateToISO / isoToDisplayDate", () => {
  it("converts DD/MM/YYYY to ISO", () => {
    expect(displayDateToISO("14/10/1977")).toBe("1977-10-14");
  });

  it("converts ISO to DD/MM/YYYY", () => {
    expect(isoToDisplayDate("1977-10-14")).toBe("14/10/1977");
  });

  it("round-trips", () => {
    expect(displayDateToISO(isoToDisplayDate("1977-10-14"))).toBe("1977-10-14");
  });

  it("returns malformed input unchanged rather than throwing", () => {
    expect(displayDateToISO("14101977")).toBe("14101977");
    expect(isoToDisplayDate("")).toBe("");
  });
});

describe("isValidISODate", () => {
  it("accepts real dates", () => {
    expect(isValidISODate("2026-11-18")).toBe(true);
    expect(isValidISODate("2028-02-29")).toBe(true);
  });

  it("rejects the day-first string the old en-ZA default produced", () => {
    // toLocaleDateString("en-ZA") gives "2026/11/18"; parsing that as
    // DD/MM/YYYY made "18-11-2026", which Postgres rejected on every save.
    expect(isValidISODate(displayDateToISO("2026/11/18"))).toBe(false);
  });

  it("rejects impossible or partial dates", () => {
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate(displayDateToISO("18/11"))).toBe(false);
  });
});

describe("default date for manual entry", () => {
  it("round-trips today's date to a valid ISO date", () => {
    const shown = isoToDisplayDate(localISODate(new Date(2026, 10, 18)));
    expect(shown).toBe("18/11/2026");
    expect(displayDateToISO(shown)).toBe("2026-11-18");
    expect(isValidISODate(displayDateToISO(shown))).toBe(true);
  });
});
