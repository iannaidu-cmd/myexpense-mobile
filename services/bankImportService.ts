// ─── Bank Import Service ──────────────────────────────────────────────────────
// Parses CSV and OFX/QFX bank statement files exported from SA banks (FNB,
// ABSA, Standard Bank, Nedbank, Capitec) and maps each debit transaction to
// a MyExpense category using keyword matching.
// ─────────────────────────────────────────────────────────────────────────────

import { NON_DEDUCTIBLE_LABEL } from "@/constants/categories";
import { maskCardNumbers } from "@/lib/itr12Summary";
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
  // Grocery shops are household shopping, not business entertainment.
  [/\b(woolworths\s*food|pick\s*n\s*pay|pnp\b|checkers\b|spar\b|kwik\s*spar|food\s*lovers|trader\s*joes|mr\s*d\s*food)\b/i, "Personal / Other"],
  // Medical aid schemes and medical providers: claimed as a medical tax credit.
  [/\b(medical\s*aid|discovery\s*health|bonitas|momentum\s*health|medshield|fedhealth|bestmed|gems|medihelp|keyhealth|profmed|polmed|bankmed)\b/i, "Medical"],
  [/\b(clicks|dischem|dis-chem|pharmacy|apteek|doctor|dentist|dental|optometr\w*|spec-?savers|pathcare|lancet|ampath|netcare|mediclinic|life\s*healthcare)\b/i, "Medical"],
  [/\b(sanlam|old\s*mutual|discovery\s*(life|health)?|momentum\s*(life|health)?|liberty\s*life|hollard|santam|outsurance|miway|absa\s*insur)\b/i, "Insurance"],
  [/\b(eskom|city\s*power|joburg\s*water|rand\s*water|municipality|local\s*council|rates\s*and\s*taxes|prepaid\s*electricity|electricity)\b/i, "Utilities"],
  [/\b(postnet|dhl\b|courier\s*guy|fedex|ups\b|aramex|dawn\s*wing|skynet|meili\s*logist)\b/i, "Professional Fees"],
  [/\b(service\s*fee|monthly\s*fee|account\s*fee|admin\s*fee|bank\s*charge|transaction\s*fee|facility\s*fee|maintenance\s*fee|notification\s*fee|monthly\s*credit\s*fee|bundle\s*fee)\b/i, "Bank Charges"],
  // Streaming is personal, not business software.
  [/\b(netflix|spotify|showmax|dstv)\b/i,                                  "Personal / Other"],
  // Domains and hosting are listed under Software & Subscriptions.
  [/\b(register\s*domai|domain)\b/i,                                       "Software & Subscriptions"],
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

function validDate(y: string, m: string, d: string): string | null {
  const mi = Number(m), di = Number(d), yi = Number(y);
  if (!(mi >= 1 && mi <= 12 && di >= 1 && di <= 31 && yi >= 1990 && yi <= 2100)) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function fullYear(y: string): string {
  return y.length === 2 ? `20${y}` : y;
}

function parseDate(raw: string): string | null {
  raw = (raw ?? "").trim().replace(/['"]/g, "");
  // Drop a trailing time ("2026-11-20 10:15:00", "2026-11-20T10:15", "20/11/2026 9:05 AM").
  raw = raw.replace(/(?:T|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\s*(?:am|pm)?(?:Z|[+-]\d{2}:?\d{2})?$/i, "").trim();
  if (!raw) return null;

  // DDMmmYYYY — Nedbank: "02Mar2026"
  const dMmmY = raw.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
  if (dMmmY) {
    const m = MONTH[dMmmY[2].toLowerCase()];
    if (m) return validDate(dMmmY[3], m, dMmmY[1]);
  }

  // YYYYMMDD — FNB / Standard Bank: "20260302"
  if (/^\d{8}$/.test(raw)) {
    return validDate(raw.slice(0, 4), raw.slice(4, 6), raw.slice(6, 8));
  }

  // YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD
  const ymd = raw.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymd) return validDate(ymd[1], ymd[2], ymd[3]);

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, and 2-digit-year variants (SA = day first)
  const dmy = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/);
  if (dmy) return validDate(fullYear(dmy[3]), dmy[2], dmy[1]);

  // DD Mon YYYY / DD-Mon-YY / DD Month YYYY — "15 Nov 2023", "2-Mar-26", "15 November 2023"
  const dMonY = raw.match(/^(\d{1,2})[\s\-]+([A-Za-z]{3,9})[\s\-,]+(\d{2}|\d{4})$/);
  if (dMonY) {
    const m = MONTH[dMonY[2].slice(0, 3).toLowerCase()];
    if (m) return validDate(fullYear(dMonY[3]), m, dMonY[1]);
  }

  // Mon DD, YYYY — "Nov 15, 2023"
  const monDY = raw.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monDY) {
    const m = MONTH[monDY[1].slice(0, 3).toLowerCase()];
    if (m) return validDate(monDY[3], m, monDY[2]);
  }

  return null;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function splitCSVLine(line: string, delim = ","): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  // Some banks wrap fields in single quotes ('20 Nov 2026'); strip them.
  return fields.map((f) => f.replace(/^'(.*)'$/, "$1").trim());
}

/** Comma unless the file is clearly semicolon- or tab-separated. */
function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 30);
  const count = (d: string) => sample.reduce((n, l) => n + (splitCSVLine(l, d).length >= 3 ? 1 : 0), 0);
  const scores: Array<[string, number]> = [[",", count(",")], [";", count(";")], ["\t", count("\t")]];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : ",";
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

function findCol(headers: string[], candidates: string[]): number {
  const normalised = headers.map(norm);
  for (const c of candidates) {
    const idx = normalised.indexOf(norm(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Parses SA bank amount formats: "-1,234.56", "R 1 234.56", "1234,56",
 * "1.234,56", "150.00 Dr", "150.00Cr", "150.00-", "(150.00)".
 * Dr / trailing minus / brackets mean money out (negative).
 */
function parseAmount(raw: string): number {
  let s = (raw ?? "").replace(/['"]/g, "").trim();
  if (!s) return 0;
  let sign = 1;
  if (/\s*(dr|debit)\.?$/i.test(s)) { sign = -1; s = s.replace(/\s*(dr|debit)\.?$/i, ""); }
  else if (/\s*(cr|credit)\.?$/i.test(s)) { s = s.replace(/\s*(cr|credit)\.?$/i, ""); }
  s = s.replace(/zar/i, "").replace(/[R\s]/g, "");
  if (/^\(.*\)$/.test(s)) { sign = -sign; s = s.slice(1, -1); }
  if (/^-?[\d.,]+-$/.test(s)) { sign = -sign; s = s.slice(0, -1); }
  // Decimal comma ("1234,56" / "1.234,56") vs thousands comma ("1,234.56").
  if (/,\d{1,2}$/.test(s) && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : sign * n;
}

/** True if the cell is an amount-like number (not text, not empty). */
function looksNumeric(v: string): boolean {
  const s = (v ?? "").replace(/['"]/g, "").replace(/zar/i, "").replace(/\s*(dr|cr|debit|credit)\.?$/i, "").replace(/[R\s]/g, "");
  return /^[-(]?\d[\d.,]*\)?-?$/.test(s);
}

function hasDecimals(v: string): boolean {
  return /\d[.,]\d{2}\b/.test(v);
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
// Handles:
//   1. Headered CSV — header row on line 0 OR below a title/metadata block
//      (FNB "ACCOUNT TRANSACTION HISTORY", FNB numbered rows, Capitec, ABSA,
//      Discovery, TymeBank, Investec). Single Amount column, Debit/Credit or
//      Money In/Money Out columns, optional Fee column, optional Dr/Cr column.
//   2. Headerless CSV — columns inferred from the data, so any order works
//      (Nedbank: Date, Description, Amount, Balance; FNB: Date, Amount,
//      Balance, Description; Standard Bank: HIST, Date, , Amount, Description,
//      Reference, Balance).

const DATE_HEADERS = ["date", "transactiondate", "postingdate", "valuedate", "datum", "transdate", "txndate", "effectivedate", "processdate", "processeddate"];
const AMOUNT_HEADERS = ["amount", "transactionamount", "amountr", "amountzar", "amountinzar", "value"];
const DEBIT_HEADERS = ["debit", "debitamount", "debits", "debitr", "moneyout", "moneyoutr", "withdrawal", "withdrawals", "paidout", "out", "amountout"];
const CREDIT_HEADERS = ["credit", "creditamount", "credits", "creditr", "deposit", "deposits", "moneyin", "moneyinr", "paidin", "in", "amountin"];
const FEE_HEADERS = ["fee", "fees", "feer", "charges", "bankcharges", "servicefee", "servicefees"];
const BALANCE_HEADERS = ["balance", "runningbalance", "closingbalance", "availablebalance", "balancer"];
const DRCR_HEADERS = ["drcr", "crdr", "debitcredit", "creditdebit", "sign"];
const DESC_HEADERS = ["description", "narrative", "transactiondescription", "details", "transactiondetails", "particulars", "memo", "payee", "merchant", "beneficiary", "reference"];
const ALL_HEADER_WORDS = [...AMOUNT_HEADERS, ...DEBIT_HEADERS, ...CREDIT_HEADERS, ...DESC_HEADERS].filter((h) => h.length > 3);

// Opening/closing balance rows are not transactions.
const BALANCE_ROW = /^(opening|closing)\s*balance|^balance\s*(brought|carried)\s*(forward|fwd)|^bal\s*(b\/?f|c\/?f)$/i;

export function parseCSV(content: string): ParsedTransaction[] {
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 1) return [];

  const delim = detectDelimiter(lines);
  const split = (l: string) => splitCSVLine(l, delim);

  // ── Find the column header row ───────────────────────────────────────────
  // Many exports put a title and Name/Account/Balance lines above the real
  // header, so scan the top of the file rather than only line 0. A header row
  // must name a date column AND an amount/description column, so metadata
  // lines like "Balance:, -16200.11" can't be mistaken for one.
  let headerRow = -1;
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const cols = split(lines[i]);
    const lower = cols.map(norm);
    const hasDate = lower.some((h) => DATE_HEADERS.includes(h));
    const hasOther = lower.some((h) => ALL_HEADER_WORDS.includes(h) || /^description\d*$/.test(h) || h.startsWith("description"));
    if (hasDate && hasOther) { headerRow = i; break; }
  }

  let dataStart: number;
  let dateIdx: number;
  let amtIdx = -1;
  let debitIdx = -1;
  let creditIdx = -1;
  let feeIdx = -1;
  let drcrIdx = -1;
  let descIdxs: number[] = [];
  let rowTag: string | null = null; // e.g. Standard Bank "HIST"

  if (headerRow >= 0) {
    const headerCols = split(lines[headerRow]);
    const lower = headerCols.map(norm);
    dataStart = headerRow + 1;
    dateIdx   = findCol(headerCols, DATE_HEADERS);
    amtIdx    = findCol(headerCols, AMOUNT_HEADERS);
    debitIdx  = findCol(headerCols, DEBIT_HEADERS);
    creditIdx = findCol(headerCols, CREDIT_HEADERS);
    feeIdx    = findCol(headerCols, FEE_HEADERS);
    drcrIdx   = findCol(headerCols, DRCR_HEADERS);
    const balIdx = findCol(headerCols, BALANCE_HEADERS);

    // Description: every description-like column, in order (FNB has
    // Description1/2/3; others have Description + Reference).
    descIdxs = lower
      .map((h, idx) => ({ h, idx }))
      .filter(({ h }) => h.startsWith("description") || DESC_HEADERS.includes(h))
      .map(({ idx }) => idx);
    if (descIdxs.length === 0) {
      const used = new Set([dateIdx, amtIdx, debitIdx, creditIdx, feeIdx, drcrIdx, balIdx]);
      descIdxs = headerCols.map((_, idx) => idx).filter((idx) => !used.has(idx));
    }

    // A "Type" column only counts as Dr/Cr if its values really are Dr/Cr.
    if (drcrIdx < 0) {
      const typeIdx = findCol(headerCols, ["type", "transactiontype", "debitcreditindicator", "indicator"]);
      if (typeIdx >= 0) {
        const vals = lines.slice(dataStart, dataStart + 30).map((l) => split(l)[typeIdx] ?? "").filter(Boolean);
        if (vals.length > 0 && vals.every((v) => /^(dr|cr|d|c|debit|credit)$/i.test(v))) drcrIdx = typeIdx;
      }
    }
    if (amtIdx < 0 && debitIdx < 0 && creditIdx < 0) {
      throw new Error(
        "Could not find the amount column in this file. Make sure it's an unedited CSV export from your bank statement.",
      );
    }
  } else {
    // Headerless: find the first transaction-looking row — a date in one of
    // the first 3 columns followed by a decimal amount. (A metadata line such
    // as "Statement period, 2026/09/18, 2026/11/20" has no decimal amount.)
    dataStart = -1;
    dateIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 25); i++) {
      const cols = split(lines[i]);
      if (cols.length < 3) continue;
      const di = cols.slice(0, 3).findIndex((c) => parseDate(c));
      if (di >= 0 && cols.slice(di + 1).some((c) => looksNumeric(c) && hasDecimals(c))) {
        dataStart = i; dateIdx = di; break;
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

    // Rows like Standard Bank's "HIST,20260302,..." carry a record-type tag
    // before the date; metadata rows ("OPEN", "CLOSE") use other tags.
    const sample = lines.slice(dataStart, dataStart + 60).map(split).filter((c) => parseDate(c[dateIdx] ?? ""));
    if (dateIdx > 0) {
      const tally = new Map<string, number>();
      for (const c of sample) tally.set(c[0], (tally.get(c[0]) ?? 0) + 1);
      rowTag = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }
    const rows = rowTag === null ? sample : sample.filter((c) => c[0] === rowTag);

    // Work out which column is which from the data, not one bank's layout.
    //   amount      = first column after the date that is numeric with decimals
    //                 (balance always comes after it; reference numbers have no decimals)
    //   description = every mostly-text column after the date, joined
    const width = Math.max(...rows.map((c) => c.length));
    const numericCols: number[] = [];
    const decimalCols: number[] = [];
    for (let c = dateIdx + 1; c < width; c++) {
      const vals = rows.map((r) => r[c] ?? "").filter(Boolean);
      if (vals.length === 0) continue;
      const nums = vals.filter(looksNumeric);
      if (nums.length / vals.length >= 0.8) {
        numericCols.push(c);
        if (nums.filter(hasDecimals).length / nums.length >= 0.8) decimalCols.push(c);
      } else {
        descIdxs.push(c);
      }
    }
    amtIdx = decimalCols[0] ?? numericCols[0] ?? -1;
    if (amtIdx < 0) {
      throw new Error(
        "Could not find the amount column in this file. Make sure it's an unedited CSV export from your bank statement.",
      );
    }
  }

  // ── Parse data rows ───────────────────────────────────────────────────────
  const transactions: ParsedTransaction[] = [];
  let seq = 0;

  const push = (date: string, desc: string, amount: number, txType: "expense" | "income", forceCategory?: string) => {
    const vendor = desc.trim() || "Unknown";
    if (shouldSkip(vendor) || BALANCE_ROW.test(vendor)) return;
    const suggested = forceCategory ?? autoCategory(vendor);
    transactions.push({
      id: String(seq++),
      date,
      // Statement lines often carry the full card number; keep the last four.
      vendor: maskCardNumbers(vendor),
      amount: Math.round(amount * 100) / 100,
      rawDescription: maskCardNumbers(vendor),
      suggestedCategory: txType === "income" ? "Income" : suggested,
      isDeductible: txType === "income" ? false : suggested !== NON_DEDUCTIBLE_LABEL,
      type: txType,
    });
  };

  for (let i = dataStart; i < lines.length; i++) {
    const cols = split(lines[i]);
    if (cols.length < 2) continue;
    if (rowTag !== null && cols[0] !== rowTag) continue;

    const date = parseDate(cols[dateIdx] ?? "");
    if (!date) continue;

    const desc = descIdxs
      .map((idx) => cols[idx] ?? "")
      .filter((v) => v && !looksNumeric(v))
      .join(" ")
      .replace(/\s{2,}/g, "  ");

    let signed = 0; // negative = money out
    if (amtIdx >= 0 && (cols[amtIdx] ?? "") !== "") {
      signed = parseAmount(cols[amtIdx] ?? "");
      if (drcrIdx >= 0) {
        const flag = (cols[drcrIdx] ?? "").toLowerCase();
        if (/^(dr|d|debit)$/.test(flag)) signed = -Math.abs(signed);
        else if (/^(cr|c|credit)$/.test(flag)) signed = Math.abs(signed);
      }
    } else {
      // Separate money-out / money-in columns. Banks differ on whether the
      // out column is shown as positive or negative, so use the magnitude.
      const out = debitIdx >= 0 ? Math.abs(parseAmount(cols[debitIdx] ?? "")) : 0;
      const inn = creditIdx >= 0 ? Math.abs(parseAmount(cols[creditIdx] ?? "")) : 0;
      if (out > 0) signed = -out;
      else if (inn > 0) signed = inn;
    }

    if (signed < 0) push(date, desc, Math.abs(signed), "expense");
    else if (signed > 0) push(date, desc, signed, "income");

    // A separate Fee column (Capitec, TymeBank) is a bank charge in its own right.
    if (feeIdx >= 0) {
      const fee = Math.abs(parseAmount(cols[feeIdx] ?? ""));
      if (fee > 0) push(date, `${desc || "Bank"} fee`, fee, "expense", "Bank Charges");
    }
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
      vendor: maskCardNumbers(vendor),
      amount: Math.abs(amount),
      rawDescription: maskCardNumbers(memo || name),
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
