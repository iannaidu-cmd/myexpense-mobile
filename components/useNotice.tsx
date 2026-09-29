// ─── useNotice ────────────────────────────────────────────────────────────────
// The app's in-app notice popup (ConfirmModal) in place of the phone's native
// Alert.alert, so errors, limits and info messages look like the rest of
// MyExpense. Render `notice` once in the screen and call `showNotice(...)`.
//
//   const { notice, showNotice } = useNotice();
//   showNotice({ title: "Couldn't save this trip", message: "Please try again." });
//   ...
//   {notice}
// ─────────────────────────────────────────────────────────────────────────────

import { ConfirmModal } from "@/components/ConfirmModal";
import React, { useState } from "react";

export interface Notice {
  title: string;
  message?: string;
  /** SF Symbol. Defaults to an info icon for info notices, a warning icon otherwise. */
  icon?: string;
  tone?: "info" | "problem";
  /** Main button. Defaults to "Got it". */
  confirmLabel?: string;
  onConfirm?: () => void;
  /** Set to show a second button (e.g. "Not now"). Single-button otherwise. */
  cancelLabel?: string;
}

export function useNotice() {
  const [current, setCurrent] = useState<Notice | null>(null);
  const close = () => setCurrent(null);

  const notice = (
    <ConfirmModal
      visible={!!current}
      title={current?.title ?? ""}
      message={current?.message}
      confirmLabel={current?.confirmLabel ?? "Got it"}
      cancelLabel={current?.cancelLabel ?? "Cancel"}
      hideCancel={!current?.cancelLabel}
      destructive={false}
      icon={current?.icon ?? (current?.tone === "info" ? "info.circle.fill" : "exclamationmark.triangle.fill")}
      onConfirm={() => {
        const next = current?.onConfirm;
        close();
        next?.();
      }}
      onCancel={close}
    />
  );

  return { notice, showNotice: setCurrent };
}
