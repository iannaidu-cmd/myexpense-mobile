export interface ReceiptItem {
  description: string;
  quantity: number;
}

export interface Receipt {
  id: string;
  vendor: string;
  date: string;
  total: number;
  vat: number;
  items: ReceiptItem[];
  categoryCode: string;
  categoryLabel: string;
  confidence: number;
  deductible: boolean;
}

export interface Category {
  code: string;
  label: string;
  icon: string;
  color: string;
}

export type ScanStage = "scan" | "processing" | "review" | "done";
