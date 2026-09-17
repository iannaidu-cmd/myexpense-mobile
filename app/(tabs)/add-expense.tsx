import { Redirect } from "expo-router";

export default function AddExpenseTab() {
  return <Redirect href={"/add-expense-manual" as any} />;
}
