// ─── NoticeHost ───────────────────────────────────────────────────────────────
// App-wide in-app notices, replacing the phone's native Alert.alert. MyExpense
// messages must look like MyExpense, not like system dialogs.
//
// <NoticeHost /> is mounted once in app/_layout.tsx. Anywhere in the app,
// including outside React components, call:
//
//   showNotice({ title: "Couldn't save this expense", message: "Please try again." });
//   showNotice({
//     title: "Delete this?", message: "…", confirmLabel: "Delete", destructive: true,
//     cancelLabel: "Cancel", onConfirm: () => doIt(),
//   });
//
// One notice shows at a time; a new one queues behind the current one.
// (Screens can still use the local useNotice() hook; this is the same popup.)
// ─────────────────────────────────────────────────────────────────────────────

import { ConfirmModal } from "@/components/ConfirmModal";
import React from "react";
import { create } from "zustand";

export interface AppNotice {
  title: string;
  message?: string;
  /** SF Symbol. Defaults: info icon for tone "info", tick for "success", warning otherwise. */
  icon?: string;
  tone?: "info" | "problem" | "success";
  /** Main button. Defaults to "Got it". */
  confirmLabel?: string;
  onConfirm?: () => void;
  /** Adds a second button (e.g. "Not now"). Single-button otherwise. */
  cancelLabel?: string;
  onCancel?: () => void;
  /** Red styling for destructive confirmations (delete, sign out…). */
  destructive?: boolean;
}

interface NoticeState {
  queue: AppNotice[];
  push: (n: AppNotice) => void;
  shift: () => void;
}

const useNoticeStore = create<NoticeState>((set, get) => ({
  queue: [],
  push: (n) => set({ queue: [...get().queue, n] }),
  shift: () => set({ queue: get().queue.slice(1) }),
}));

export function showNotice(n: AppNotice) {
  useNoticeStore.getState().push(n);
}

const ICONS = {
  info: "info.circle.fill",
  success: "checkmark.circle.fill",
  problem: "exclamationmark.triangle.fill",
} as const;

export function NoticeHost() {
  const current = useNoticeStore((s) => s.queue[0] ?? null);
  const shift = useNoticeStore((s) => s.shift);

  const confirm = () => {
    const fn = current?.onConfirm;
    shift();
    fn?.();
  };
  // Single-button notices: tapping outside counts as the button, so an action
  // like "Done → go back" still happens.
  const cancel = () => {
    if (!current?.cancelLabel) return confirm();
    const fn = current?.onCancel;
    shift();
    fn?.();
  };

  return (
    <ConfirmModal
      visible={!!current}
      title={current?.title ?? ""}
      message={current?.message}
      confirmLabel={current?.confirmLabel ?? "Got it"}
      cancelLabel={current?.cancelLabel ?? "Cancel"}
      hideCancel={!current?.cancelLabel}
      destructive={!!current?.destructive}
      icon={current?.icon ?? ICONS[current?.tone ?? "problem"]}
      onConfirm={confirm}
      onCancel={cancel}
    />
  );
}
