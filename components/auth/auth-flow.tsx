import { ForgotPasswordScreen } from "@/components/auth/forgot-password-screen";
import { SigninScreen } from "@/components/auth/signin-screen";
import { SignupScreen } from "@/components/auth/signup-screen";
import type { AuthScreen } from "@/components/auth/types";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { useState } from "react";

export default function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>("signup");
  const [verifyEmail, setVerifyEmail] = useState("");

  const handleNavigate = (newScreen: AuthScreen, email?: string) => {
    setScreen(newScreen);
    if (email) setVerifyEmail(email);
  };

  const renderScreen = () => {
    switch (screen) {
      case "signup":
        return (
          <SignupScreen onNavigate={(s) => handleNavigate(s as AuthScreen)} />
        );
      case "signin":
        return (
          <SigninScreen onNavigate={(s) => handleNavigate(s as AuthScreen)} />
        );
      case "forgot":
        return (
          <ForgotPasswordScreen
            onNavigate={(s) => handleNavigate(s as AuthScreen)}
          />
        );
      case "verify":
        return (
          <VerifyEmailScreen
            email={verifyEmail || "your@email.com"}
            onNavigate={(s) => handleNavigate(s as AuthScreen)}
          />
        );
      default:
        return (
          <SignupScreen onNavigate={(s) => handleNavigate(s as AuthScreen)} />
        );
    }
  };

  return renderScreen();
}
