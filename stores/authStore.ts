import AsyncStorage from "@react-native-async-storage/async-storage";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { supabase } from "@/lib/supabase";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { create } from "zustand";

// @supabase/supabase-js derives the storage key from the project URL:
// sb-{project-ref}-auth-token  →  sb-{project-ref}-auth-token-code-verifier
const _projectRef = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
const SUPABASE_CV_KEY = `sb-${_projectRef}-auth-token-code-verifier`;

// Fire-and-forget: populate the query cache in parallel with auth so screens
// load instantly once the splash fades.
function prefetchUserData(userId: string): void {
  expenseService.getTotals(userId, ACTIVE_TAX_YEAR).catch(() => {});
  expenseService.getExpenses(userId, ACTIVE_TAX_YEAR).catch(() => {});
  expenseService.getRecentExpenses(userId, 5).catch(() => {});
  incomeService.getTotals(userId).catch(() => {});
  incomeService.getIncome(userId).catch(() => {});
  profileService.getProfile(userId).catch(() => {});
}

// ─── Auth Store ───────────────────────────────────────────────────────────────
// Wired to Supabase Auth. Import and use in any screen with:
//   const { user, isAuthenticated, signIn, signUp, signOut } = useAuthStore();
// ─────────────────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialised: boolean;
  hasCompletedOnboarding: boolean;
  isDevUser: boolean;
  isPremium: boolean;
  termsAccepted: boolean;

  initialise: () => Promise<void>;
  completeOnboarding: () => void;
  refreshPremiumStatus: () => Promise<void>;
  acceptTerms: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

// ─── Helper: fetch premium status from profiles ───────────────────────────────
async function fetchPremiumStatus(userId: string): Promise<{
  isDevUser: boolean;
  isPremium: boolean;
  termsAccepted: boolean;
}> {
  const { data } = await supabase
    .from("profiles")
    .select("is_dev_user, subscription, terms_accepted_at, promo_expires_at")
    .eq("id", userId)
    .single();

  const isDevUser = data?.is_dev_user === true;
  const promoActive = data?.promo_expires_at
    ? new Date(data.promo_expires_at) > new Date()
    : false;
  const isPremium =
    isDevUser ||
    promoActive ||
    data?.subscription === "pro" ||
    data?.subscription === "business";
  const termsAccepted = !!data?.terms_accepted_at;
  return { isDevUser, isPremium, termsAccepted };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialised: false,
  hasCompletedOnboarding: false,
  isDevUser: false,
  isPremium: false,
  termsAccepted: false,

  // ── Initialise: restore session on app launch ─────────────────────────────
  initialise: async () => {
    try {
      // Snapshot the PKCE verifier BEFORE getSession() runs. getSession() may
      // call _removeSession() internally if the stored refresh token is stale,
      // which deletes the verifier key before we can read it.
      const savedVerifier = await AsyncStorage.getItem(SUPABASE_CV_KEY).catch(() => null);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // Restore verifier if getSession() wiped it during a refresh failure.
      if (savedVerifier) {
        const stillPresent = await AsyncStorage.getItem(SUPABASE_CV_KEY).catch(() => null);
        if (!stillPresent) {
          await AsyncStorage.setItem(SUPABASE_CV_KEY, savedVerifier).catch(() => {});
        }
      }

      if (error) {
        // Stale or rotated refresh token — wipe local storage so the next
        // launch starts clean, but restore the verifier so an in-progress
        // OAuth flow (app killed mid-flow, relaunched from deep link) can
        // still complete its exchange.
        await supabase.auth.signOut({ scope: "local" });
        if (savedVerifier) {
          await AsyncStorage.setItem(SUPABASE_CV_KEY, savedVerifier).catch(() => {});
        }
        set({ isInitialised: true });
      } else if (session?.user) {
        // Start pre-fetching data in parallel with fetchPremiumStatus so the
        // query cache is warm by the time the splash fades.
        prefetchUserData(session.user.id);
        const { isDevUser, isPremium, termsAccepted } = await fetchPremiumStatus(
          session.user.id
        );
        set({
          user: { id: session.user.id, email: session.user.email ?? "" },
          isAuthenticated: true,
          isInitialised: true,
          isDevUser,
          isPremium,
          termsAccepted,
        });
      } else {
        set({ isInitialised: true });
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        // INITIAL_SESSION fires immediately on registration and duplicates the
        // getSession() call above — skip it to avoid a double state update.
        if (event === 'INITIAL_SESSION') return;
        if (session?.user) {
          prefetchUserData(session.user.id);
          const { isDevUser, isPremium, termsAccepted } = await fetchPremiumStatus(
            session.user.id
          );
          set({
            user: { id: session.user.id, email: session.user.email ?? "" },
            isAuthenticated: true,
            isDevUser,
            isPremium,
            termsAccepted,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isDevUser: false,
            isPremium: false,
            termsAccepted: false,
          });
        }
      });
      // subscription intentionally kept alive for app lifetime
    } catch {
      set({ isInitialised: true });
    }
  },

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),

  // ── Refresh premium status (call after PayFast payment completes) ─────────
  refreshPremiumStatus: async () => {
    const { user } = get();
    if (!user) return;
    const { isDevUser, isPremium, termsAccepted } = await fetchPremiumStatus(user.id);
    set({ isDevUser, isPremium, termsAccepted });
  },

  acceptTerms: async () => {
    const { user } = get();
    if (!user) return;
    const now = new Date().toISOString();
    // Plain update without .select().single() — avoids PGRST116 when the profile
    // row doesn't exist yet (new OAuth users whose trigger hasn't run).
    // 0 rows affected = no error; the in-memory flag is enough to ungate the UI.
    const { error } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: now })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
    set({ termsAccepted: true });
  },

  // ── Sign Up ───────────────────────────────────────────────────────────────
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: fullName ? { data: { full_name: fullName } } : undefined,
    });
    if (error) throw new Error(error.message);

    if (data.user && fullName) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, full_name: fullName })
        .eq("id", data.user.id);
    }

    // Only mark as authenticated if Supabase returned a live session.
    // When email confirmation is required, session is null — the user must
    // verify their email before they can access the app.
    if (data.user && data.session) {
      const { isDevUser, isPremium, termsAccepted } = await fetchPremiumStatus(data.user.id);
      set({
        user: { id: data.user.id, email: data.user.email ?? "" },
        isAuthenticated: true,
        isDevUser,
        isPremium,
        termsAccepted,
      });
    }
  },

  // ── Sign In ───────────────────────────────────────────────────────────────
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      const { isDevUser, isPremium, termsAccepted } = await fetchPremiumStatus(data.user.id);
      set({
        user: { id: data.user.id, email: data.user.email ?? "" },
        isAuthenticated: true,
        isDevUser,
        isPremium,
        termsAccepted,
      });
    }
  },

  // ── Sign Out ──────────────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      isAuthenticated: false,
      isDevUser: false,
      isPremium: false,
      termsAccepted: false,
    });
  },

  // ── Reset Password (sends email) ──────────────────────────────────────────
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "myexpense://reset-password",
    });
    if (error) throw new Error(error.message);
  },

  // ── Update Password (after reset) ────────────────────────────────────────
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },
}));
