import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { supabase } = await import("@/lib/supabase");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "myexpense://",
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned from Supabase");

    // Open Google sign-in in system browser
    await WebBrowser.openBrowserAsync(data.url, {
      showTitle: false,
      enableBarCollapsing: true,
    });

    // Browser closed — poll for session up to 10 seconds
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        return { success: true };
      }
    }

    // Session not found after polling
    return {
      success: false,
      error: "cancelled",
    };
  } catch (e: any) {
    console.error("Google Sign-In error:", e);
    return {
      success: false,
      error: e.message ?? "Google Sign-In failed. Please try again.",
    };
  }
}
