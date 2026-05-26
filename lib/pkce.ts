import AsyncStorage from "@react-native-async-storage/async-storage";
import "./crypto-polyfill";

const _projectRef = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
export const PKCE_CV_KEY = `sb-${_projectRef}-auth-token-code-verifier`;

// Mirror gotrue-js dec2hex exactly (only the last byte of each uint32)
function dec2hex(dec: number): string {
  return ("0" + dec.toString(16)).slice(-2);
}

// Generate and store a PKCE verifier+challenge, bypassing gotrue-js entirely.
// Storing under the same key gotrue-js uses means auth/callback.tsx reads
// correctly without any changes.
export async function generateAndStorePkce(): Promise<{ challenge: string }> {
  // Match gotrue-js generatePKCEVerifier exactly
  const randomValues = new Uint32Array(56);
  crypto.getRandomValues(randomValues);
  const verifier = Array.from(randomValues, dec2hex).join("").slice(0, 128);

  // Match gotrue-js generatePKCEChallenge: sha256 → base64url
  // Use charCodeAt instead of TextEncoder to avoid Hermes compatibility issues
  const verifierBytes = new Uint8Array(verifier.length);
  for (let i = 0; i < verifier.length; i++) {
    verifierBytes[i] = verifier.charCodeAt(i);
  }
  const buffer = await crypto.subtle.digest("SHA-256", verifierBytes);
  const hashBytes = Array.from(new Uint8Array(buffer));
  const binaryString = hashBytes.map((b) => String.fromCharCode(b)).join("");
  const challenge = btoa(binaryString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Store in gotrue-js format so auth/callback.tsx can read it
  await AsyncStorage.setItem(PKCE_CV_KEY, `${verifier}/s256`);

  return { challenge };
}
