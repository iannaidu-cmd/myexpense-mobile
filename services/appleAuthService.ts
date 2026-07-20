import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";

// crypto-polyfill is registered as a side effect in lib/supabase.ts,
// which is always imported before this service runs, so globalThis.crypto
// is guaranteed to have getRandomValues and subtle.digest available here.

function generateRawNonce(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, "0")).join("");
}

export async function signInWithApple(): Promise<{ success: boolean; error?: string }> {
  try {
    const rawNonce = generateRawNonce();
    const hashedNonce = await sha256Hex(rawNonce);

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { success: false, error: "Apple Sign-In failed. Please try again." };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) return { success: false, error: error.message };

    // Apple only provides fullName on the very first sign-in — store it immediately.
    if (data.user && credential.fullName) {
      const fullName = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(" ");
      if (fullName) {
        await supabase
          .from("profiles")
          .upsert({ id: data.user.id, full_name: fullName })
          .eq("id", data.user.id);
      }
    }

    return { success: true };
  } catch (e: any) {
    if (e.code === "ERR_REQUEST_CANCELED") return { success: false, error: "cancelled" };
    return { success: false, error: e.message ?? "Apple Sign-In failed. Please try again." };
  }
}
