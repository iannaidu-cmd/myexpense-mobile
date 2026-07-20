import * as WebBrowser from "expo-web-browser";
import { generateAndStorePkce } from "@/lib/pkce";
import { useAuthStore } from "@/stores/authStore";
import { Linking } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URL = "myexpense://auth/callback";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function signInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { challenge } = await generateAndStorePkce();

    const params = new URLSearchParams({
      provider: "google",
      redirect_to: REDIRECT_URL,
      code_challenge: challenge,
      code_challenge_method: "s256",
      access_type: "offline",
      prompt: "consent",
    });
    const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(oauthUrl, REDIRECT_URL);
    // dismissBrowser() is async and rejects if no session is open, but on
    // Android the native module doesn't implement it at all — it returns
    // undefined (not a Promise), so a bare .catch() throws. Promise.resolve()
    // normalises both cases.
    Promise.resolve(WebBrowser.dismissBrowser()).catch(() => {});

    if (result.type === "cancel" || result.type === "dismiss") {
      return { success: false, error: "cancelled" };
    }

    if (result.type !== "success") {
      return { success: false, error: "Sign-in failed. Please try again." };
    }

    // Extract code from the captured HTTPS callback URL and re-route via the
    // custom scheme so auth/callback.tsx receives the code param correctly.
    if (result.url) {
      const codeMatch = result.url.match(/[?&]code=([^&#]+)/);
      if (codeMatch) {
        await Linking.openURL(`myexpense://auth/callback?code=${codeMatch[1]}`);
      }
    }

    for (let i = 0; i < 120; i++) {
      await sleep(500);
      if (useAuthStore.getState().isAuthenticated) return { success: true };
    }

    return { success: false, error: "Sign-in failed. Please try again." };
  } catch (e: any) {
    console.error("Google Sign-In error:", e);
    return {
      success: false,
      error: e.message ?? "Google Sign-In failed. Please try again.",
    };
  }
}
