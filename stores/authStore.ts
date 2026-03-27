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

  initialise: () => Promise<void>;
  completeOnboarding: () => void;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialised: false,
  hasCompletedOnboarding: false,

  // ── Initialise: restore session on app launch ─────────────────────────────
  initialise: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: { id: session.user.id, email: session.user.email ?? "" },
          isAuthenticated: true,
          isInitialised: true,
        });
      } else {
        set({ isInitialised: true });
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: { id: session.user.id, email: session.user.email ?? "" },
            isAuthenticated: true,
          });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      });
      return () => subscription.unsubscribe();
    } catch {
      set({ isInitialised: true });
    }
  },

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),

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
      set({
        user: { id: data.user.id, email: data.user.email ?? "" },
        isAuthenticated: true,
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
      set({
        user: { id: data.user.id, email: data.user.email ?? "" },
        isAuthenticated: true,
      });
    }
  },

  // ── Sign Out ──────────────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
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
