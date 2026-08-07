import { useFacebookOAuthStore } from "@/stores/facebookOAuthStore";
import { colour } from "@/tokens";
import { useRouter } from "expo-router";
import { Modal, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import WebView, { type WebViewNavigation } from "react-native-webview";

const REDIRECT_PREFIXES = [
  "myexpense://auth/callback",
  "https://www.myexpense.co.za/auth/callback",
];

// Renders once, globally, from app/_layout.tsx. Facebook's Android app hijacks
// the OAuth flow when it's launched inside a Chrome Custom Tab
// (WebBrowser.openAuthSessionAsync) — it intercepts the consent step and never
// hands back to this app. A Custom Tab is an OS-level browser session, so this
// app has no way to stop that hand-off from inside it. An embedded WebView is
// fully owned by this app instead, so onShouldStartLoadWithRequest can inspect
// and block every navigation attempt before it happens, denying the native
// Facebook app the app-switch it needs to take over. Confirmed root cause via
// a controlled uninstall/reinstall test against Supabase auth logs.
export function FacebookOAuthModal() {
  const router = useRouter();
  const pending = useFacebookOAuthStore((s) => s.pending);
  const resolve = useFacebookOAuthStore((s) => s.resolve);

  const handleCancel = () => resolve({ codeReceived: false });

  const handleShouldStartLoad = (request: WebViewNavigation): boolean => {
    const { url } = request;
    const matchedRedirect = REDIRECT_PREFIXES.find((prefix) => url.startsWith(prefix));
    if (matchedRedirect) {
      const queryIdx = url.indexOf("?");
      const query = queryIdx >= 0 ? url.slice(queryIdx) : "";
      resolve({ codeReceived: /[?&]code=/.test(url) });
      router.push(`/auth/callback${query}` as any);
      return false;
    }
    // Block every non-http(s) scheme outright (intent://, fb://, market://,
    // ...) — this is what stops the native Facebook app from taking over.
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return false;
    }
    return true;
  };

  if (!pending) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={handleCancel}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colour.borderLight,
            backgroundColor: colour.white,
          }}
        >
          <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colour.primary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: pending.authUrl }}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          startInLoadingState
        />
      </SafeAreaView>
    </Modal>
  );
}
