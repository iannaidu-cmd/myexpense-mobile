// ─── ITR12 purpose categories for mileage trips ──────────────────────────────
// The category of a business trip. The SARS "reason for the trip" itself is
// the free-text note stored alongside it (mileage_trips.notes).
export const TRIP_PURPOSES = [
  { key: "client_visit", label: "Client Visit", itr12: "S11(a)" },
  { key: "supplier", label: "Supplier / Procurement", itr12: "S11(a)" },
  { key: "business_errand", label: "Business Errand", itr12: "S11(a)" },
  { key: "site_inspection", label: "Site Inspection", itr12: "S11(a)" },
  { key: "conference", label: "Conference / Event", itr12: "S11(a)" },
  { key: "office_supplies", label: "Office Supplies Run", itr12: "S11(a)" },
  { key: "other_business", label: "Other Business Travel", itr12: "S11(a)" },
];

export type TripPurpose = (typeof TRIP_PURPOSES)[number];
