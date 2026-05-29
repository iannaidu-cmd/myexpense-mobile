import * as WebBrowser from "expo-web-browser";
import { generateAndStorePkce } from "@/lib/pkce";
import { useAuthStore } from "@/stores/authStore";

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

    // openAuthSessionAsync monitors for REDIRECT_URL and auto-closes the browser
    // tab the moment the redirect fires — no manual dismissBrowser() needed.
    const result = await WebBrowser.openAuthSessionAsync(oauthUrl, REDIRECT_URL, {
      dismissButtonStyle: "close",
      createTask: false, // Android: keep Custom Tab in the same task as the app
    });

    if (result.type === "cancel" || result.type === "dismiss") {
      return { success: false, error: "Sign-in was cancelled." };
    }

    if (result.type !== "success") {
      return { success: false, error: "Sign-in failed. Please try again." };
    }

    // Browser is already closed. Expo Router routes auth/callback.tsx via the
    // deep link that openAuthSessionAsync detected. Poll until it completes.
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
