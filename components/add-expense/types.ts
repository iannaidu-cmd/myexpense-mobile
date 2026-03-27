export type ExpenseStage = "form" | "confirm" | "done";

export interface Category {
  label: string;
  icon: string;
  code: string;
  color: string;
}

export interface PaymentMethod {
  label: string;
  icon: string;
}

export interface ExpenseData {
  amountRaw: string;
  vendor: string;
  dateStr: string;
  note: string;
  categoryIdx: number | null;
  paymentMethodIdx: number;
  isDeductible: boolean;
}

/** Alias used by external consumers */
export type AddExpenseFormData = ExpenseData;

export interface CategoryPickerProps {
  visible: boolean;
  categories: Category[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onClose: () => void;
}
