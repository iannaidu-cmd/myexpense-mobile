import { ReactNode } from "react";
import { View } from "react-native";

// ─── Shell ────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
