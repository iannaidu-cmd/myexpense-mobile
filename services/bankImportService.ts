// ─── Bank Import Service ──────────────────────────────────────────────────────
// Parses CSV and OFX/QFX bank statement files exported from SA banks (FNB,
// ABSA, Standard Bank, Nedbank, Capitec) and maps each debit transaction to
// a MyExpense category using keyword matching.
// ─────────────────────────────────────────────────────────────────────────────

import { NON_DEDUCTIBLE_LABEL } from "@/constants/categories";
import { supabase } from "@/lib/supabase";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  id: string;
  date: string;               // ISO YYYY-MM-DD
  vendor: string;
  amount: number;             // always positive
  rawDescription: string;
  suggestedCategory: string;
  isDeductible: boolean;
  type: 'expense' | 'income';
}

// ─── Keyword -> Category map ──────────────────────────────────────────────────

const KEYWORD_MAP: Array<[RegExp, string]> = [
  [/\b(xero|quickbooks|sage|pastel|simplepay|payspace)\b/i,                "Software & Subscriptions"],
  [/\b(google\s*(workspace|play|ads?)?|microsoft|apple\s*(music|tv|dev)?|adobe|dropbox|slack|zoom|github|aws|netlify|vercel|figma|notion|openai|anthropic|chatgpt|supabase|paddle|wetransfer)\b/i, "Software & Subscriptions"],
  [/\b(facebook\s*ads?|google\s*ads?|instagram\s*ads?|meta\s*ads?|linkedin\s*ads?|tiktok\s*ads?)\b/i, "Marketing & Advertising"],
  [/\b(shell|engen|bp\b|caltex|sasol|total\s*energies|astron\s*energy)\b/i, "Vehicle Expenses"],
  [/\b(uber|lyft|bolt\s*(za)?|taxify|indriver|gautrain)\b/i,               "Travel & Transport"],
  [/\b(telkom|mtn|vodacom|cell\s*c\b|rain\b|afrihost|webafrica|vox\s*telecom)\b/i, "Telephone & Internet"],
  [/\b(steers|kfc|mcdonald|nando|wimpy|chicken\s*licken|debonairs|spur\b|ocean\s*basket|pizza\s*hut|panarottis|fishaways|vida\s*e\s*caffe|bootlegger|barristers|hog\s*house|brassbel|cape\s*to\s*cuba)\b/i, "Meals & Entertainment"],
  [/\b(woolworths\s*food|pick\s*n\s*pay|pnp\b|checkers\b|spar\b|kwik\s*spar|food\s*lovers|trader\s*joes|mr\s*d\s*food)\b/i, "Meals & Entertainment"],
  [/\b(sanlam|old\s*mutual|discovery\s*(life|health)?|momentum\s*(life|health)?|liberty\s*life|hollard|santam|outsurance|miway|absa\s*insur)\b/i, "Insurance"],
  [/\b(eskom|city\s*power|joburg\s*water|rand\s*water|municipality|local\s*council|rates\s*and\s*taxes|prepaid\s*electricity)\b/i, "Utilities"],
  [/\b(postnet|dhl\b|courier\s*guy|fedex|ups\b|aramex|dawn\s*wing|skynet|meili\s*logist)\b/i, "Professional Fees"],
  [/\b(service\s*fee|monthly\s*fee|account\s*fee|admin\s*fee|bank\s*charge|transaction\s*fee|facility\s*fee|maintenance\s*fee|notification\s*fee)\b/i, "Bank Charges"],
  [/\b(netflix|spotify|showmax|dstv)\b/i,                                  "Software & Subscriptions"],
  [/\b(register\s*domai|domain)\b/i,                                       "Professional Fees"],
  [/\b(clicks|dischem|dis-chem)\b/i,                                       "Professional Fees"],
  [/\b(mica|hardware|pinelands\s*hard)\b/i,                                "Equipment & Tools"],
];

function autoCategory(description: string): string {
  for (const [pattern, category] of KEYWORD_MAP) {
    if (pattern.test(description)) return category;
  }
  return NON_DEDUCTIBLE_LABEL;
}

// Investment/inter-account transfers — neither an expense nor income, skip entirely.
const SKIP_PATTERNS: RegExp[] = [
  /\bjustinvest\b/i,
  /\bown\s*transfer\b/i,
  /\binteraccount\b/i,
  /\binteracc\b/i,
];

function shouldSkip(description: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(description));
}

// ─── Date parsing ─────────────────────────────────────────────────────────────
// Handles all date formats used by SA banks:
//   02Mar2026       -- Nedbank (DDMmmYYYY, no spaces)
//   YYYYMMDD        -- FNB
//   DD/MM/YYYY      -- Standard Bank, ABSA, Capitec
//   YYYY/MM/DD      -- Nedbank OFX
//   DD Mon YYYY     -- some variants ("15 Nov 2023")

const MONTH: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function parseDate(raw: string): string | null {
  raw = raw.trim().replace(/['"]/g, "");
  if (!raw) return null;

  // DDMmmYYYY — Nedbank: "02Mar2026"
  const dMmmY = raw.match(/^(\d{2})([A-Za-z]{3})(\d{4})$/);
  if (dMmmY) {
    const m = MONTH[dMmmY[2].toLowerCase()];
    if (m) return `${dMmmY[3]}-${m}-${dMmmY[1]}`;
  }

  // YYYYMMDD — FNB: "20260302"
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = raw.match(/^(\d{1,2})[/\-.:](\d{1,2})[/\-.:](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;

  // YYYY/MM/DD or YYYY-MM-DD
  const ymd = raw.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  // DD Mon YYYY — "15 Nov 2023"
  const dMonY = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dMonY) {
    const m = MONTH[dMonY[2].toLowerCase()];
    if (m) return `${dMonY[3]}-${m}-${dMonY[1].padStart(2, "0")}`;
  }

  // D-Mon-YY or D-Mon-YYYY — Nedbank: "2-Mar-26", "02-Mar-2026"
  const dDashMonY = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (dDashMonY) {
    const m = MONTH[dDashMonY[2].toLowerCase()];
    if (m) {
      const yr = dDashMonY[3].length === 2 ? `20${dDashMonY[3]}` : dDashMonY[3];
      return `${yr}-${m}-${dDashMonY[1].padStart(2, "0")}`;
    }
  }

  return null;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function findCol(headers: string[], candidates: string[]): number {
  const normalised = headers.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  for (const c of candidates) {
    const idx = normalised.indexOf(c.toLowerCase().replace(/[^a-z]/g, ""));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[R\s,]/g, "")) || 0;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
// Handles two layouts:
//   1. Headered CSV  — first row has column names (FNB, Standard Bank, ABSA)
//   2. Headerless CSV — data rows start directly, metadata may precede them (Nedbank)

export function parseCSV(content: string): ParsedTransaction[] {
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 1) return [];

  // ── Detect whether the file has column headers ───────────────────────────
  const firstCols = splitCSVLine(lines[0]);
  const firstLower = firstCols.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const hasHeaders =
    firstLower.some((h) => ["date", "transactiondate", "postingdate", "valuedate"].includes(h)) ||
    firstLower.some((h) => ["amount", "debit", "credit", "description", "narrative", "reference"].includes(h));

  let dataStart: number;
  let dateIdx: number;
  let amtIdx: number;
  let debitIdx: number;
  let creditIdx: number;
  let descIdx: number;

  if (hasHeaders) {
    dataStart = 1;
    dateIdx   = findCol(firstCols, ["date", "transactiondate", "postingdate", "valuedate", "datum"]);
    amtIdx    = findCol(firstCols, ["amount", "transactionamount"]);
    debitIdx  = findCol(firstCols, ["debit", "debitamount"]);
    creditIdx = findCol(firstCols, ["credit", "creditamount", "credits", "deposit", "deposits"]);
    descIdx   = findCol(firstCols, ["description", "narrative", "reference", "memo", "details", "transactiondetails", "payee", "merchant"]);
  } else {
    // Headerless: scan up to 20 lines to find the first row where col 0 is a date.
    // Nedbank format: Date, Description, Amount, Balance (no header row).
    dataStart = -1;
    dateIdx = 0;
    descIdx = 1;
    amtIdx  = 2;
    debitIdx = -1;
    creditIdx = -1;

    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const cols = splitCSVLine(lines[i]);
      if (cols.length >= 3 && parseDate(cols[0] ?? "")) {
        dataStart = i;
        break;
      }
    }

    if (dataStart < 0) {
      // File has content but no row looked like a date-led transaction row —
      // distinct from an empty file, so the caller can show an accurate message
      // instead of the generic "no transactions found".
      throw new Error(
        "Could not recognise this file's column layout. Make sure it's an unedited CSV export from your bank statement.",
      );
    }
  }

  // ── Parse data rows ───────────────────────────────────────────────────────
  const transactions: ParsedTransaction[] = [];
  let seq = 0;

  for (let i = dataStart; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const dateStr = cols[dateIdx >= 0 ? dateIdx : 0] ?? "";
    const date = parseDate(dateStr);
    if (!date) continue;

    let amount = 0;
    let txType: 'expense' | 'income' = 'expense';

    if (amtIdx >= 0) {
      // Single amount column — negative = debit (expense), positive = credit (income).
      const parsed = parseAmount(cols[amtIdx] ?? "");
      if (parsed === 0) continue;
      if (parsed < 0) {
        amount = Math.abs(parsed);
        txType = 'expense';
      } else {
        amount = parsed;
        txType = 'income';
      }
    } else if (debitIdx >= 0) {
      // Separate debit/credit columns — import debits as expenses, credits as income.
      const debit = parseAmount(cols[debitIdx] ?? "");
      if (debit > 0) {
        amount = debit;
        txType = 'expense';
      } else if (creditIdx >= 0) {
        const credit = parseAmount(cols[creditIdx] ?? "");
        if (credit > 0) {
          amount = credit;
          txType = 'income';
        }
      }
      if (amount <= 0) continue;
    } else {
      continue;
    }

    if (amount <= 0) continue;

    const rawDesc =
      descIdx >= 0
        ? (cols[descIdx] ?? "")
        : cols.filter((_, idx) => idx !== dateIdx && idx !== amtIdx && idx !== debitIdx).join(" ");
    const vendor = rawDesc.trim() || "Unknown";

    if (shouldSkip(vendor)) continue;

    const suggested = autoCategory(vendor);

    transactions.push({
      id: String(seq++),
      date,
      vendor,
      amount,
      rawDescription: vendor,
      suggestedCategory: txType === 'income' ? 'Income' : suggested,
      isDeductible: txType === 'income' ? false : suggested !== NON_DEDUCTIBLE_LABEL,
      type: txType,
    });
  }

  return transactions;
}

// ─── OFX / QFX parser ────────────────────────────────────────────────────────

export function parseOFX(content: string): ParsedTransaction[] {
  if (content.trim().length === 0) return [];

  const transactions: ParsedTransaction[] = [];
  let seq = 0;

  let blocks = [...content.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)].map((m) => m[0]);
  if (blocks.length === 0) {
    blocks = content.split(/(?=<STMTTRN>)/i).filter((b) => /<STMTTRN>/i.test(b));
  }

  if (blocks.length === 0) {
    // Non-empty content but no <STMTTRN> blocks at all — this isn't a
    // recognisable OFX/QFX statement, distinct from an empty file.
    throw new Error(
      "Could not find any transactions in this OFX/QFX file. Make sure it's an unedited export from your bank.",
    );
  }

  for (const block of blocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\\n\\r]*)`, "i"));
      return m ? m[1].trim() : "";
    };

    const dtPosted = get("DTPOSTED");
    const trnAmt   = get("TRNAMT");
    const name     = get("NAME");
    const memo     = get("MEMO");

    if (!dtPosted || !trnAmt) continue;

    const amount = parseFloat(trnAmt.replace(",", "."));
    if (isNaN(amount) || amount >= 0) continue;

    const date = parseDate(dtPosted.slice(0, 8));
    if (!date) continue;

    const vendor = (name || memo || "Unknown").trim();
    if (shouldSkip(vendor)) continue;
    const suggested = autoCategory(vendor);

    transactions.push({
      id: String(seq++),
      date,
      vendor,
      amount: Math.abs(amount),
      rawDescription: memo || name,
      suggestedCategory: suggested,
      isDeductible: suggested !== NON_DEDUCTIBLE_LABEL,
      type: 'expense',
    });
  }

  return transactions;
}

// ─── File picker entry point ──────────────────────────────────────────────────

export async function pickAndParseStatement(): Promise<ParsedTransaction[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "text/plain", "application/octet-stream", "*/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const { uri, name } = result.assets[0];
  const file = new File(uri);
  const content = await file.text();

  const lower = (name ?? "").toLowerCase();
  if (lower.endsWith(".ofx") || lower.endsWith(".qfx")) {
    return parseOFX(content);
  }
  return parseCSV(content);
}

// ─── Free-tier usage tracking ─────────────────────────────────────────────────
// One row per completed import session (not per imported transaction — a
// single statement can add many expenses at once, and the free-tier cap
// counts sessions, matching how the user actually experiences the limit).
// bank_import_log has no other purpose; see the migration that created it.

export async function logBankImport(userId: string): Promise<void> {
  const { error } = await supabase.from("bank_import_log").insert({ user_id: userId });
  if (error) throw new Error(error.message);
}

// Deliberately NOT cached — gates entry to the whole screen, so it must
// always reflect the true current count.
export async function countBankImportsThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("bank_import_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) throw new Error(error.message);
  return count ?? 0;
}
