import AsyncStorage from "@react-native-async-storage/async-storage";
import { expenseService } from "@/services/expenseService";
import { incomeService } from "@/services/incomeService";
import { profileService } from "@/services/profileService";
import { supabase, setVerifierWriteHook } from "@/lib/supabase";
import { ACTIVE_TAX_YEAR } from "@/types/database";
import { create } from "zustand";

// @supabase/supabase-js derives the storage key from the project URL:
// sb-{project-ref}-auth-token  →  sb-{project-ref}-auth-token-code-verifier
const _projectRef = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
const SUPABASE_CV_KEY = `sb-${_projectRef}-auth-token-code-verifier`;
// Backup key outside Supabase's namespace. In auth-js v2.105+, _removeSession()
// deletes the verifier when the temporary unconfirmed session expires. We save
// a copy here so auth/callback can restore it before the PKCE exchange.
export const SUPABASE_CV_BACKUP_KEY = `myexpense-pkce-verifier-backup`;

// In-memory verifier — survives _removeSession() and initialise() restoring
// stale values from previous sessions into SUPABASE_CV_KEY.
// Cleared after a successful exchange or sign-out.
let _memPkceVerifier: string | null = null;
export function getMemPkceVerifier() { return _memPkceVerifier; }
export function clearMemPkceVerifier() { _memPkceVerifier = null; }

// auth-js's setItemAsync wraps values in JSON.stringify before calling
// storage.setItem, so the raw bytes in AsyncStorage are '"verifierXxx"' (with
// surrounding double-quotes). We must JSON.parse to get the actual verifier
// string. Without this, every code_verifier sent to Supabase included extra
// quotes and never matched the stored challenge → permanent bad_code_verifier.
function parseStoredVerifier(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}

// Register a storage-level hook so we capture the verifier the instant auth-js
// writes it — covers signUp(), resend(), and any future PKCE flow. More
// reliable than reading CV_KEY after-the-fact (no timing or ordering concerns).
setVerifierWriteHook((rawValue) => {
  const verifier = parseStoredVerifier(rawValue);
  _memPkceVerifier = verifier;
  // Store the already-parsed value so AsyncStorage.getItem reads it back cleanly
  // (no extra JSON layer).
  AsyncStorage.setItem(SUPABASE_CV_BACKUP_KEY, verifier).catch(() => {});
});

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
  pendingEmailVerification: string | null;

  initialise: () => Promise<void>;
  completeOnboarding: () => void;
  refreshPremiumStatus: () => Promise<void>;
  acceptTerms: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  clearPendingEmailVerification: () => void;
  resendVerification: (email: string) => Promise<void>;
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
  pendingEmailVerification: null,

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
          // Guard: only authenticate if the email is confirmed (or there is no
          // email — e.g. anonymous / OAuth without email). When email
          // confirmation is required, Supabase fires SIGNED_IN with a
          // temporary session before the user confirms, then fires SIGNED_OUT
          // moments later. Without this check that cycle sends the user to
          // /(tabs) then immediately back to onboarding.
          const emailConfirmed =
            !session.user.email || !!session.user.email_confirmed_at;

          if (emailConfirmed) {
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
              pendingEmailVerification: null,
            });
          } else {
            // Email not yet confirmed — keep as pending, don't authenticate.
            set({ pendingEmailVerification: session.user.email ?? null });
          }
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
      options: {
        ...(fullName ? { data: { full_name: fullName } } : {}),
        emailRedirectTo: "https://www.myexpense.co.za/auth/callback",
      },
    });
    if (error) throw new Error(error.message);

    if (data.user && fullName) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, full_name: fullName })
        .eq("id", data.user.id);
    }

    // Belt-and-suspenders: the storage proxy hook already captured the verifier
    // the instant auth-js wrote it, but we also read it here in case the hook
    // fired for a different key or timing edge-case.
    const _rawVerifier = await AsyncStorage.getItem(SUPABASE_CV_KEY).catch(() => null);
    if (_rawVerifier) {
      const _verifier = parseStoredVerifier(_rawVerifier);
      _memPkceVerifier = _verifier;
      await AsyncStorage.setItem(SUPABASE_CV_BACKUP_KEY, _verifier).catch(() => {});
    }

    // When email confirmation is required, session is null. Set
    // pendingEmailVerification so AuthGate routes to the verification screen.
    if (data.user && data.session) {
      const { isDevUser, isPremium, termsAccepted } = await fetchPremiumStatus(data.user.id);
      set({
        user: { id: data.user.id, email: data.user.email ?? "" },
        isAuthenticated: true,
        isDevUser,
        isPremium,
        termsAccepted,
        pendingEmailVerification: null,
      });
    } else if (data.user) {
      set({ pendingEmailVerification: email });
    }
  },

  clearPendingEmailVerification: () => set({ pendingEmailVerification: null }),

  // ── Resend verification email ─────────────────────────────────────────────
  resendVerification: async (email) => {
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: "https://www.myexpense.co.za/auth/callback" },
    });
    // resend() generates a NEW PKCE verifier and stores it in CV_KEY.
    // The storage proxy hook captures it immediately, but also read manually
    // here as a belt-and-suspenders fallback (must JSON.parse the raw value).
    const _rawVerifier = await AsyncStorage.getItem(SUPABASE_CV_KEY).catch(() => null);
    if (_rawVerifier) {
      const _verifier = parseStoredVerifier(_rawVerifier);
      _memPkceVerifier = _verifier;
      await AsyncStorage.setItem(SUPABASE_CV_BACKUP_KEY, _verifier).catch(() => {});
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
    _memPkceVerifier = null;
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
