import { generateAndStorePkce } from "@/lib/pkce";
import { useAuthStore } from "@/stores/authStore";
import { useFacebookOAuthStore } from "@/stores/facebookOAuthStore";

// Facebook's native Android app hijacks this flow when it runs inside a
// Chrome Custom Tab (the previous WebBrowser.openAuthSessionAsync
// implementation) — it intercepts the consent step and never hands back to
// this app, because MyExpense has no native Facebook SDK integration for it
// to resolve against. Confirmed root cause via a controlled uninstall/
// reinstall test against Supabase auth logs: FB app installed → authorize
// fires, zero callback; FB app uninstalled → full successful round-trip.
// Two parameter-level attempts (an HTTPS App Link redirect_to, then
// display=popup) were both proven ineffective — the interception happens at
// the Android intent level, before Supabase's authorize response is ever
// reached, so no parameter Supabase forwards can prevent it.
//
// The actual fix: run the flow in components/auth/FacebookOAuthModal.tsx, an
// in-app WebView this app fully owns, which can block every non-http(s)
// navigation via onShouldStartLoadWithRequest and deny the native app the
// app-switch it needs. That modal is rendered once, globally, from
// app/_layout.tsx; useFacebookOAuthStore is the bridge that lets this
// function await its result without either screen that calls
// signInWithFacebook() needing to change.
const REDIRECT_URL = "https://www.myexpense.co.za/auth/callback";
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

    const { codeReceived } = await useFacebookOAuthStore.getState().request(oauthUrl);
    if (!codeReceived) {
      return { success: false, error: "Sign-in was cancelled." };
    }

    // The modal already handed the code off to app/auth/callback.tsx, which
    // performs the token exchange asynchronously. Poll for the resulting
    // session rather than duplicating that exchange logic here.
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
