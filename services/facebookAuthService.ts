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

    // Listen for the deep-link callback BEFORE opening the browser so we never
    // miss the event. When myexpense://auth/callback fires, dismiss the tab and
    // let Expo Router deliver the code to auth/callback.tsx.
    let timeoutId: ReturnType<typeof setTimeout>;
    let subscription: ReturnType<typeof Linking.addEventListener>;

    const callbackReceived = new Promise<void>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        subscription.remove();
        reject(new Error("Sign-in timed out. Please try again."));
      }, 60_000);

      subscription = Linking.addEventListener("url", ({ url }) => {
        if (url.includes("myexpense://auth/callback")) {
          clearTimeout(timeoutId);
          subscription.remove();
          WebBrowser.dismissBrowser();
          resolve();
        }
      });
    });

    // Open the browser without awaiting — it stays open until dismissBrowser()
    // is called from the Linking listener above.
    WebBrowser.openBrowserAsync(oauthUrl, { dismissButtonStyle: "close" }).catch(() => {});

    try {
      await callbackReceived;
    } catch (e: any) {
      return { success: false, error: e.message ?? "Sign-in failed. Please try again." };
    }

    // auth/callback.tsx is opened by Expo Router when the deep link fires and
    // handles the PKCE exchange. Poll until it marks the session as active.
    for (let i = 0; i < 120; i++) {
      await sleep(500);
      if (useAuthStore.getState().isAuthenticated) return { success: true };
    }

    return { success: false, error: "Sign-in failed. Please try again." };
  } catch (e: any) {
    console.error("Facebook Sign-In error:", e);
    return {
      success: false,
      error: e.message ?? "Facebook Sign-In failed. Please try again.",
    };
  }
}
