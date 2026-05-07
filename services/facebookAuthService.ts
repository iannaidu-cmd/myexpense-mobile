import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithFacebook(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { supabase } = await import("@/lib/supabase");

    const redirectUrl = Linking.createURL("auth/callback");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned from Supabase");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type !== "success") {
      return { success: false, error: "cancelled" };
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      result.url,
    );
    if (exchangeError) throw exchangeError;

    return { success: true };
  } catch (e: any) {
    console.error("Facebook Sign-In error:", e);
    return {
      success: false,
      error: e.message ?? "Facebook Sign-In failed. Please try again.",
    };
  }
}
