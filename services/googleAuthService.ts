import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { supabase } = await import("@/lib/supabase");

    // Build the redirect URI that matches this app's deep-link scheme
    const redirectUrl = Linking.createURL("auth/callback");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned from Supabase");

    // Open Google sign-in in an in-app auth session.
    // openAuthSessionAsync captures the redirect URL instead of navigating away,
    // which lets us complete the PKCE code exchange right here.
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type !== "success") {
      return { success: false, error: "cancelled" };
    }

    // Exchange the PKCE authorisation code for a Supabase session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      result.url,
    );
    if (exchangeError) throw exchangeError;

    return { success: true };
  } catch (e: any) {
    console.error("Google Sign-In error:", e);
    return {
      success: false,
      error: e.message ?? "Google Sign-In failed. Please try again.",
    };
  }
}
