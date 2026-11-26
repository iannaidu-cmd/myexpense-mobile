import { useNavigationContainerRef, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

// Moved out of app/_layout.tsx unchanged so navigation tests can render it.
// ── Auth gate ─────────────────────────────────────────────────────────────────
export function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const navRef = useNavigationContainerRef();
  const [readyRetry, setReadyRetry] = useState(0);
  const { user, isInitialised, pendingEmailVerification, isAccessBlocked, isPendingDeletion } = useAuthStore();

  useEffect(() => {
    // Root navigator hasn't committed its first state yet — calling
    // router.replace() here throws "navigate before mounting the Root
    // Layout" (Sentry: seen on fast cold starts, mostly Android).
    if (!navigationState?.key) return;
    if (!isInitialised) return;
    // navigationState can have a key while the container still isn't ready
    // (Sentry REACT-NATIVE-C). Nothing else in the deps changes when it
    // becomes ready, so retry shortly instead of bailing for good.
    if (!navRef.isReady()) {
      const t = setTimeout(() => setReadyRetry((n) => n + 1), 50);
      return () => clearTimeout(t);
    }

    // Email confirmation pending — route to verification screen. This runs
    // inside AuthGate so there is no race between a screen's router.replace
    // call and segments updating.
    if (
      pendingEmailVerification &&
      !user &&
      segments[0] !== "email-verification" &&
      segments[0] !== "auth"
    ) {
      router.replace(
        `/email-verification?email=${encodeURIComponent(pendingEmailVerification)}` as any
      );
      return;
    }

    // Account deletion requested — block everything except the dedicated
    // screen (Cancel deletion / Export my data), until either 30 days pass
    // (purge-deleted-accounts deletes the account entirely) or the user
    // cancels. Takes priority over isAccessBlocked below — no point telling
    // someone to fix their payment method if they're being deleted anyway.
    const inPendingDeletion = segments[0] === "account-pending-deletion";
    if (isPendingDeletion && user && !inPendingDeletion) {
      router.replace("/account-pending-deletion");
      return;
    }
    if (!isPendingDeletion && inPendingDeletion) {
      router.replace("/(tabs)");
      return;
    }

    // Renewal payment failed 7+ days ago — block everything except the
    // dedicated screen (which offers "update payment" / "sign out"). Dev
    // users and active promo_expires_at grants never set isAccessBlocked
    // (see authStore.fetchPremiumStatus), so this never affects them.
    const inAccessBlocked = segments[0] === "access-blocked";
    if (isAccessBlocked && user && !inAccessBlocked) {
      router.replace("/access-blocked");
      return;
    }
    if (!isAccessBlocked && inAccessBlocked) {
      router.replace("/(tabs)");
      return;
    }

    const inAuthGroup =
      segments[0] === "auth" ||
      segments[0] === "sign-in" ||
      segments[0] === "sign-up" ||
      segments[0] === "forgot-password" ||
      segments[0] === "email-verification";

    const inProfileSetup = segments[0] === "profile-setup";
    const inOnboarding = segments[0] === "onboarding-step-1";
    const inLegal = segments[0] === "terms" || segments[0] === "privacy";
    // Deep-linked from the reset-password email: stays reachable regardless of
    // auth state. Establishing a session there is what proves the recovery
    // link is valid, so it can't require being signed in first — and once
    // that session lands, the screen must NOT get swept into the "user is
    // authenticated, bounce to tabs" branch below like sign-in/sign-up do,
    // or the password form disappears before the user can submit it.
    const inResetPassword = segments[0] === "reset-password";

    if (!user && !inAuthGroup && !inOnboarding && !inLegal && !inProfileSetup && !inResetPassword) {
      router.replace("/onboarding-step-1");
    } else if (user && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [user, isInitialised, segments, pendingEmailVerification, isAccessBlocked, isPendingDeletion, navigationState?.key, readyRetry]);

  return null;
}
