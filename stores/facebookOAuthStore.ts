import { create } from "zustand";

// Bridges facebookAuthService.ts (which needs to await a result) and
// components/auth/FacebookOAuthModal.tsx (rendered once, globally, from
// app/_layout.tsx — see that file for why: it lets both signin-screen.tsx
// and signup-screen.tsx keep calling signInWithFacebook() exactly as
// before, with zero changes to either screen).

export interface FacebookOAuthResult {
  /** True once the WebView captured a redirect containing a code — NOT the
   *  same as the sign-in actually succeeding, which still depends on the
   *  async token exchange in app/auth/callback.tsx completing afterwards. */
  codeReceived: boolean;
}

interface PendingRequest {
  authUrl: string;
  resolve: (result: FacebookOAuthResult) => void;
}

interface FacebookOAuthState {
  pending: PendingRequest | null;
  request: (authUrl: string) => Promise<FacebookOAuthResult>;
  resolve: (result: FacebookOAuthResult) => void;
}

export const useFacebookOAuthStore = create<FacebookOAuthState>((set, get) => ({
  pending: null,
  request: (authUrl) =>
    new Promise<FacebookOAuthResult>((resolve) => {
      set({ pending: { authUrl, resolve } });
    }),
  resolve: (result) => {
    get().pending?.resolve(result);
    set({ pending: null });
  },
}));
