import { isoToDisplayDate } from "@/lib/dateInput";
import { supabase } from "@/lib/supabase";
import { workTypeLabel } from "@/lib/workType";
import { mileageService, missingLogbookFields, type MileageTrip } from "@/services/mileageService";
import { profileService } from "@/services/profileService";
import {
  odometerTotalKm,
  vehicleService,
  type OdometerReading,
  type Vehicle,
} from "@/services/vehicleService";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { colour } from "@/tokens";

// ─── Logbook Export Service ───────────────────────────────────────────────────
// The SARS travel logbook for a tax year, one section per vehicle ("a separate
// logbook must be kept for each vehicle"), laid out like SARS's own eLogbook:
// opening/closing odometer for the year, then per trip Date · Opening km* ·
// Closing km* · Business km · From · To · Reason (* not compulsory per SARS).
// SARS accepts electronic logbooks and may ask for it for 5 years.
// ─────────────────────────────────────────────────────────────────────────────

interface VehicleLogbook {
  vehicle: Vehicle | null; // null = trips not yet assigned to a vehicle
  reading: OdometerReading | undefined;
  trips: MileageTrip[];
  businessKm: number;
  totalKm: number | null;
}

interface Logbook {
  taxYear: string;
  taxpayerName: string;
  taxNumber: string;
  workType: string;
  sections: VehicleLogbook[];
  incompleteTrips: number;
}

async function buildLogbook(userId: string, taxYear: string): Promise<Logbook> {
  const [profile, vehicles, readings, trips] = await Promise.all([
    profileService.getProfile(userId),
    vehicleService.getVehicles(userId),
    vehicleService.getOdometerReadings(userId, taxYear),
    mileageService.getTrips(userId, taxYear),
  ]);
  const readingByVehicle = Object.fromEntries(readings.map((r) => [r.vehicleId, r]));
  const byDate = (a: MileageTrip, b: MileageTrip) => a.trip_date.localeCompare(b.trip_date);
  const section = (vehicle: Vehicle | null, vTrips: MileageTrip[]): VehicleLogbook => {
    const reading = vehicle ? readingByVehicle[vehicle.id] : undefined;
    return {
      vehicle,
      reading,
      trips: [...vTrips].sort(byDate),
      businessKm: vTrips.reduce((s, t) => s + Number(t.distance_km), 0),
      totalKm: odometerTotalKm(reading),
    };
  };

  const sections = vehicles
    .map((v) => section(v, trips.filter((t) => t.vehicle_id === v.id)))
    // Every vehicle with trips or readings this year — even an archived one.
    .filter((s) => s.trips.length > 0 || s.reading);
  const unassigned = trips.filter((t) => !t.vehicle_id);
  if (unassigned.length) sections.push(section(null, unassigned));

  return {
    taxYear,
    taxpayerName: profile?.full_name ?? "",
    taxNumber: profile?.tax_number ?? "",
    workType: workTypeLabel(profile?.work_type),
    sections,
    incompleteTrips: trips.filter((t) => missingLogbookFields(t).length > 0).length,
  };
}

const km = (n: number | null | undefined) =>
  n == null ? "" : Number(n).toLocaleString("en-ZA", { maximumFractionDigits: 1 });
const pct = (s: VehicleLogbook) =>
  s.totalKm && s.totalKm > 0 ? `${Math.min((s.businessKm / s.totalKm) * 100, 100).toFixed(1)}%` : "";
const vehicleTitle = (v: Vehicle | null) =>
  v ? `${v.year} ${v.make} ${v.model}` : "Trips not yet assigned to a vehicle";

// ── PDF ─────────────────────────────────────────────────────────────────────
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function buildHTML(lb: Logbook): string {
  const sections = lb.sections.map((s) => {
    const v = s.vehicle;
    const rows = s.trips.map((t) => {
      const missing = missingLogbookFields(t);
      return `<tr${missing.length ? ' class="incomplete"' : ""}>
        <td>${esc(isoToDisplayDate(t.trip_date))}</td>
        <td class="num">${esc(km(t.odometer_start))}</td>
        <td class="num">${esc(km(t.odometer_end))}</td>
        <td class="num">${esc(km(Number(t.distance_km)))}</td>
        <td>${esc(t.start_address)}</td>
        <td>${esc(t.end_address)}</td>
        <td>${esc(t.notes)}${t.purpose ? `<div class="cat">${esc(t.purpose)}</div>` : ""}${missing.length ? `<div class="miss">Missing: ${esc(missing.join(", "))}</div>` : ""}</td>
      </tr>`;
    }).join("");
    return `
      <h2>${esc(vehicleTitle(v))}</h2>
      ${v ? `<table class="meta">
        <tr><th>Make</th><td>${esc(v.make)}</td><th>Model</th><td>${esc(v.model)}</td></tr>
        <tr><th>Year</th><td>${esc(v.year)}</td><th>Registration</th><td>${esc(v.registration)}</td></tr>
        <tr><th>Opening km (start of tax year)</th><td>${esc(km(s.reading?.openingKm)) || "<span class=\"miss\">Not recorded</span>"}</td>
            <th>Closing km (end of tax year)</th><td>${esc(km(s.reading?.closingKm)) || "<span class=\"miss\">Not recorded</span>"}</td></tr>
        <tr><th>Total km for the year</th><td>${esc(km(s.totalKm))}</td><th>Work km</th><td>${esc(km(s.businessKm))}</td></tr>
        <tr><th>Work use</th><td>${esc(pct(s))}</td><th>${v.soldDate ? "Sold" : ""}</th><td>${v.soldDate ? esc(isoToDisplayDate(v.soldDate)) : ""}</td></tr>
      </table>` : ""}
      <table class="trips">
        <thead><tr><th>Date</th><th>Opening km*</th><th>Closing km*</th><th>Work km</th><th>From</th><th>To</th><th>Reason</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">No work trips logged.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="3">TOTAL</td><td class="num">${esc(km(s.businessKm))}</td><td colspan="3"></td></tr></tfoot>
      </table>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 10px; color: ${colour.noir}; margin: 24px; }
    h1 { font-size: 18px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 22px 0 6px; }
    .sub { color: ${colour.textSub}; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid ${colour.border}; padding: 4px 6px; text-align: left; vertical-align: top; }
    th { background: ${colour.primary50}; }
    .meta th { width: 22%; } .num { text-align: right; white-space: nowrap; }
    tfoot td { font-weight: 700; background: ${colour.bgPage}; }
    .cat { color: ${colour.textSub}; font-size: 9px; } .miss { color: ${colour.danger}; font-size: 9px; }
    tr.incomplete td { background: ${colour.warningBg}; }
    .note { color: ${colour.textSub}; font-size: 9px; margin-top: 16px; line-height: 1.4; }
  </style></head><body>
    <h1>Travel logbook · ${esc(lb.taxYear)}</h1>
    <div class="sub">${esc(lb.taxpayerName)}${lb.taxNumber ? ` · Tax number ${esc(lb.taxNumber)}` : ""} · ${esc(lb.workType)}</div>
    ${lb.incompleteTrips ? `<div class="miss">${lb.incompleteTrips} trip(s) are missing details SARS needs. They're highlighted below.</div>` : ""}
    ${sections || "<p>No trips logged for this tax year.</p>"}
    <div class="note">
      * Optional on SARS's logbook.<br/>
      For each work trip, SARS needs the date, the km, where you went and why. For each vehicle, it needs the km
      reading at the start and end of the tax year, with a separate logbook for each vehicle. Driving between home
      and your usual workplace doesn't count as work travel. Keep this logbook for at least five years.<br/>
      Generated by MyExpense on ${esc(isoToDisplayDate(new Date().toISOString().slice(0, 10)))}.
    </div>
  </body></html>`;
}

// ── CSV ─────────────────────────────────────────────────────────────────────
const csvField = (val: unknown) => {
  const str = String(val ?? "");
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

function buildCSV(lb: Logbook): string {
  const header = [
    "Tax year", "Vehicle", "Registration", "Year opening km", "Year closing km",
    "Date", "Opening km", "Closing km", "Business km", "From", "To", "Reason", "Category", "Source", "Missing",
  ];
  const lines = [header.map(csvField).join(",")];
  for (const s of lb.sections) {
    for (const t of s.trips) {
      lines.push([
        lb.taxYear,
        vehicleTitle(s.vehicle),
        s.vehicle?.registration ?? "",
        s.reading?.openingKm ?? "",
        s.reading?.closingKm ?? "",
        t.trip_date,
        t.odometer_start ?? "",
        t.odometer_end ?? "",
        Number(t.distance_km).toFixed(1),
        t.start_address ?? "",
        t.end_address ?? "",
        t.notes ?? "",
        t.purpose,
        t.source,
        missingLogbookFields(t).join("; "),
      ].map(csvField).join(","));
    }
  }
  return lines.join("\n");
}

export const logbookExportService = {
  exportPDF: async (userId: string, taxYear: string): Promise<void> => {
    const lb = await buildLogbook(userId, taxYear);
    const { uri } = await Print.printToFileAsync({ html: buildHTML(lb), base64: false });
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error("Sharing is not available on this device. Please use a physical device.");
    }
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `MyExpense travel logbook ${taxYear}`,
      UTI: "com.adobe.pdf",
    });
  },

  exportCSV: async (userId: string, taxYear: string): Promise<void> => {
    const lb = await buildLogbook(userId, taxYear);
    const file = new File(Paths.cache, `MyExpense_Logbook_${taxYear.replace("/", "-")}_${Date.now()}.csv`);
    file.write(buildCSV(lb), { encoding: "utf8" });
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error("Sharing is not available on this device. Please use a physical device.");
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: `MyExpense travel logbook ${taxYear}`,
      UTI: "public.comma-separated-values-text",
    });
  },

  // ── Free-tier usage (mirrors itr12ExportService) ─────────────────────────
  logExport: async (userId: string): Promise<void> => {
    const { error } = await supabase.from("logbook_export_log").insert({ user_id: userId });
    if (error) throw new Error(error.message);
  },

  // Deliberately NOT cached — gates a free-tier action.
  countThisMonth: async (userId: string): Promise<number> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from("logbook_export_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};
