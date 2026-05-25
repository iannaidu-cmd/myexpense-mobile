import * as WebBrowser from "expo-web-browser";
import { generateAndStorePkce } from "@/lib/pkce";
import { useAuthStore } from "@/stores/authStore";
import { Linking } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URL = "https://myexpense.co.za/auth/callback";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function signInWithFacebook(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { challenge } = await generateAndStorePkce();

    const params = new URLSearchParams({
      provider: "facebook",
      redirect_to: REDIRECT_URL,
      code_challenge: challenge,
      code_challenge_method: "s256",
    });
    const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(oauthUrl, REDIRECT_URL);
    WebBrowser.dismissBrowser();

    // openAuthSessionAsync on Android captures the HTTPS redirect URL but the
    // app doesn't navigate automatically. Extract the code and re-route via the
    // custom scheme so auth/callback.tsx receives the code param correctly.
    if (result.type === "success" && result.url) {
      const codeMatch = result.url.match(/[?&]code=([^&#]+)/);
      if (codeMatch) {
        await Linking.openURL(`myexpense://auth/callback?code=${codeMatch[1]}`);
      }
    }

    // Poll for auth completion — set by auth/callback.tsx after PKCE exchange.
    // On Android the OS may route the App Link separately, so we poll regardless.
    for (let i = 0; i < 120; i++) {
      await sleep(500);
      if (useAuthStore.getState().isAuthenticated) return { success: true };
    }

    return {
      success: false,
      error:
        result.type !== "success"
          ? "cancelled"
          : "Sign-in failed. Please try again.",
    };
  } catch (e: any) {
    console.error("Facebook Sign-In error:", e);
    return {
      success: false,
      error: e.message ?? "Facebook Sign-In failed. Please try again.",
    };
  }
}
