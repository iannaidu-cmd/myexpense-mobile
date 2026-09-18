import type { useRouter } from "expo-router";

// router.back() silently does nothing when there's no navigation history to
// go back to (deep link, push notification, or a screen reached after a
// router.replace()) — the button just appears dead. Fall back to the tabs
// root so "back"/"cancel"/"done" buttons always take the user somewhere.
export function safeBack(router: ReturnType<typeof useRouter>, fallback: string = "/(tabs)") {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}
