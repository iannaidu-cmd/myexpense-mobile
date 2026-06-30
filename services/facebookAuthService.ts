import * as WebBrowser from "expo-web-browser";
import { generateAndStorePkce } from "@/lib/pkce";
import { useAuthStore } from "@/stores/authStore";
import { Linking } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URL = "myexpense://auth/callback";
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

    const result = await WebBrowser.openAuthSessionAsync(oauthUrl, REDIRECT_URL, {
      dismissButtonStyle: "close",
      createTask: false, // Android: keep Custom Tab in the same task as the app
    });

    // Always dismiss — on Android the Custom Tab can linger after the redirect.
    try { WebBrowser.dismissBrowser(); } catch {}

    if (result.type === "cancel" || result.type === "dismiss") {
      return { success: false, error: "Sign-in was cancelled." };
    }

    if (result.type !== "success") {
      return { success: false, error: "Sign-in failed. Please try again." };
    }

    // openAuthSessionAsync intercepts the custom-scheme redirect and returns it
    // as result.url, which means the system deep-link event may not fire.
    // Manually re-fire it so auth/callback.tsx receives the code param.
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

    return { success: false, error: "Sign-in timed out. Please try again." };
  } catch (e: any) {
    console.error("Facebook Sign-In error:", e);
    return {
      success: false,
      error: e.message ?? "Facebook Sign-In failed. Please try again.",
    };
  }
}
