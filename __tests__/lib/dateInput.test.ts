import { displayDateToISO, formatDateInputDDMMYYYY, isoToDisplayDate } from "@/lib/dateInput";

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
