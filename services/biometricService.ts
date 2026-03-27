// ─── Biometric Service ────────────────────────────────────────────────────────
// Handles Face ID / Fingerprint authentication and secure session storage.
// Uses expo-local-authentication for biometrics and expo-secure-store for
// storing the encrypted session tokens.

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "myexpense_biometric_session";
const BIOMETRIC_ENABLED_KEY = "myexpense_biometric_enabled";

// ─── Check if device supports biometrics ─────────────────────────────────────
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch {
    return false;
  }
}

// ─── Get biometric type label for UI ─────────────────────────────────────────
export async function getBiometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "Face ID";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "Fingerprint";
    }
    return "Biometrics";
  } catch {
    return "Biometrics";
  }
}

// ─── Check if user has enabled biometrics in settings ────────────────────────
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

// ─── Enable / disable biometrics ─────────────────────────────────────────────
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? "true" : "false");
  if (!enabled) {
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
  }
}

// ─── Save full session for biometric unlock ───────────────────────────────────
// Stores BOTH access_token and refresh_token so we can fully restore the
// Supabase session without needing the user's password again.
export async function saveBiometricSession(
  email: string,
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const session = JSON.stringify({
    email,
    accessToken,
    refreshToken,
    savedAt: Date.now(),
  });
  await SecureStore.setItemAsync(SESSION_KEY, session);
}

// ─── Retrieve stored session ──────────────────────────────────────────────────
export async function getBiometricSession(): Promise<{
  email: string;
  accessToken: string;
  refreshToken: string;
  savedAt: number;
} | null> {
  try {
    const val = await SecureStore.getItemAsync(SESSION_KEY);
    if (!val) return null;
    const parsed = JSON.parse(val);
    // Guard against old sessions that only stored accessToken
    if (!parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Clear stored session ─────────────────────────────────────────────────────
export async function clearBiometricSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
}

// ─── Prompt biometric authentication ─────────────────────────────────────────
export async function authenticateWithBiometrics(
  promptMessage = "Authenticate to access MyExpense"
): Promise<boolean> {
  try {
    const available = await isBiometricAvailable();
    if (!available) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });

    return result.success;
  } catch {
    return false;
  }
}
