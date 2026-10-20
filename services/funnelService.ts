import * as Application from "expo-application";
import { Platform } from "react-native";
import { MMKV } from "react-native-mmkv";
import { supabase } from "@/lib/supabase";

// ─── Sign-up funnel tracking ──────────────────────────────────────────────────
// Fire-and-forget events written to public.funnel_events so we can see where
// new users stop between installing and creating an account. Events carry a
// random per-install device ID (never the email) and, once signed in, the
// user ID. Failures are swallowed: tracking must never break the app.
// ─────────────────────────────────────────────────────────────────────────────

const storage = new MMKV({ id: "myexpense-funnel" });
const DEVICE_ID_KEY = "device_id";

function uuidV4(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

let _deviceId: string | null = null;
let _isFirstOpen = false;

function deviceId(): string {
  if (_deviceId) return _deviceId;
  let id = storage.getString(DEVICE_ID_KEY);
  if (!id) {
    id = uuidV4();
    storage.set(DEVICE_ID_KEY, id);
    _isFirstOpen = true;
  }
  _deviceId = id;
  return id;
}

let _userId: string | null = null;

/** Links later events to the signed-in account (null when signed out). */
export function setFunnelUser(userId: string | null) {
  _userId = userId;
}

/** True on the first launch after install (the device ID was just created). */
export function isFirstOpen(): boolean {
  deviceId();
  return _isFirstOpen;
}

/** Short, PII-free error text for props. */
export function errorText(e: unknown): string {
  const msg = (e as any)?.message ?? String(e ?? "unknown");
  return String(msg).slice(0, 200);
}

/** Logs the outcome of a Google / Apple / Facebook sign-in attempt. */
export function trackOAuthResult(
  provider: string,
  from: string,
  result: { success: boolean; error?: string },
) {
  const outcome = result.success ? "ok" : result.error === "cancelled" ? "cancelled" : "failed";
  trackFunnel("oauth_result", {
    provider,
    from,
    outcome,
    ...(outcome === "failed" ? { error: errorText(result.error) } : {}),
  });
}

export function trackFunnel(event: string, props: Record<string, unknown> = {}) {
  if (__DEV__) return;
  try {
    const row = {
      device_id: deviceId(),
      user_id: _userId,
      platform: Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web",
      app_version: Application.nativeApplicationVersion ?? null,
      build: Application.nativeBuildVersion ?? null,
      event,
      props,
    };
    Promise.resolve(supabase.from("funnel_events").insert(row)).catch(() => {});
  } catch {
    // never let tracking throw
  }
}
