import { supabase } from "@/lib/supabase";
import { create } from "zustand";

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

  initialise: () => Promise<void>;
  completeOnboarding: () => void;
  refreshPremiumStatus: () => Promise<void>;
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
}> {
  const { data } = await supabase
    .from("profiles")
    .select("is_dev_user, subscription_status")
    .eq("id", userId)
    .single();

  const isDevUser = data?.is_dev_user === true;
  const isPremium = isDevUser || data?.subscription_status === "active";
  return { isDevUser, isPremium };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialised: false,
  hasCompletedOnboarding: false,
  isDevUser: false,
  isPremium: false,

  // ── Initialise: restore session on app launch ─────────────────────────────
  initialise: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { isDevUser, isPremium } = await fetchPremiumStatus(
          session.user.id
        );
        set({
          user: { id: session.user.id, email: session.user.email ?? "" },
          isAuthenticated: true,
          isInitialised: true,
          isDevUser,
          isPremium,
        });
      } else {
        set({ isInitialised: true });
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { isDevUser, isPremium } = await fetchPremiumStatus(
            session.user.id
          );
          set({
            user: { id: session.user.id, email: session.user.email ?? "" },
            isAuthenticated: true,
            isDevUser,
            isPremium,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isDevUser: false,
            isPremium: false,
          });
        }
      });
      subscription.unsubscribe; // subscription lives for app lifetime
    } catch {
      set({ isInitialised: true });
    }
  },

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),

  // ── Refresh premium status (call after PayFast payment completes) ─────────
  refreshPremiumStatus: async () => {
    const { user } = get();
    if (!user) return;
    const { isDevUser, isPremium } = await fetchPremiumStatus(user.id);
    set({ isDevUser, isPremium });
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

    if (data.user) {
      const { isDevUser, isPremium } = await fetchPremiumStatus(data.user.id);
      set({
        user: { id: data.user.id, email: data.user.email ?? "" },
        isAuthenticated: true,
        isDevUser,
        isPremium,
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
      const { isDevUser, isPremium } = await fetchPremiumStatus(data.user.id);
      set({
        user: { id: data.user.id, email: data.user.email ?? "" },
        isAuthenticated: true,
        isDevUser,
        isPremium,
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
