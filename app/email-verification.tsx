import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { useLocalSearchParams } from "expo-router";

export default function EmailVerificationRoute() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return <VerifyEmailScreen email={email} />;
}
