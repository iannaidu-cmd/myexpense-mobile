import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRef, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthHeader } from "./auth-header";
import type { FormErrors } from "./types";

interface VerifyEmailScreenProps {
  email?: string;
  onNavigate: (screen: string) => void;
}

export function VerifyEmailScreen({
  email = "your@email.com",
  onNavigate,
}: VerifyEmailScreenProps) {
  const [code, setCode] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const codeInputs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, idx: number) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 1);

    const newCode = code.split("");
    newCode[idx] = cleaned;
    const fullCode = newCode.join("");

    // Max 6 digits
    if (fullCode.length <= 6) {
      setCode(fullCode);

      // Auto-focus next input
      if (cleaned && idx < 5) {
        setTimeout(() => {
          codeInputs.current[idx + 1]?.focus();
        }, 0);
      }
    }
  };

  const handleCodeBackspace = (idx: number) => {
    if (idx > 0 && !code[idx]) {
      setTimeout(() => {
        codeInputs.current[idx - 1]?.focus();
      }, 0);
    }
  };

  const validate = () => {
    const e: FormErrors = {};
    if (code.length !== 6) e.code = "Verification code must be 6 digits";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // TODO: verify with backend and navigate to home
      onNavigate("signin");
    }, 1400);
  };

  return (
    <ThemedView style={styles.container}>
      <AuthHeader
        title="Verify your email"
        subtitle="We've sent a 6-digit code to your email. Enter it below to continue."
      />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Email display */}
        <View style={styles.emailBox}>
          <ThemedText style={styles.emailLabel}>Sent to</ThemedText>
          <ThemedText style={styles.emailValue}>{email}</ThemedText>
        </View>

        {/* Code input grid */}
        <View style={styles.codeContainer}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                if (ref) codeInputs.current[i] = ref;
              }}
              style={[
                styles.codeInput,
                focusedIdx === i && styles.codeInputFocused,
                code[i] && styles.codeInputFilled,
              ]}
              placeholder="0"
              placeholderTextColor="#E0E0E0"
              value={code[i] || ""}
              onChangeText={(text) => handleCodeChange(text, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace") {
                  handleCodeBackspace(i);
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              onFocus={() => setFocusedIdx(i)}
              onBlur={() => setFocusedIdx(-1)}
            />
          ))}
        </View>

        {/* Error message */}
        {errors.code && (
          <ThemedText style={styles.error}>{errors.code}</ThemedText>
        )}

        {/* Resend info */}
        <View style={styles.resendBox}>
          <ThemedText style={styles.resendText}>
            Didn't receive the code?{" "}
            <ThemedText style={styles.resendLink}>Resend</ThemedText>
          </ThemedText>
          <ThemedText style={styles.resendHint}>
            Code expires in 10 minutes
          </ThemedText>
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <ThemedText style={styles.tipsTitle}>
            💡 Can't find the code?
          </ThemedText>
          <ThemedText style={styles.tip}>
            • Check your spam or junk folder
          </ThemedText>
          <ThemedText style={styles.tip}>
            • Code expires in 10 minutes
          </ThemedText>
          <ThemedText style={styles.tip}>
            • Sent from noreply@myexpense.co.za
          </ThemedText>
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (loading || code.length !== 6) && styles.primaryBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || code.length !== 6}
        >
          <ThemedText style={styles.primaryBtnText}>
            {loading ? "Verifying…" : "Verify Email"}
          </ThemedText>
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => onNavigate("signup")}
        >
          <ThemedText style={styles.secondaryBtnText}>
            Create different account
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  emailBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 28,
  },
  emailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#757575",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  emailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0D47A1",
  },
  codeContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    justifyContent: "center",
  },
  codeInput: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#0D47A1",
  },
  codeInputFocused: {
    borderColor: "#1565C0",
    backgroundColor: "#F5F5F5",
  },
  codeInputFilled: {
    borderColor: "#0288D1",
    backgroundColor: "rgba(2,136,209,0.05)",
  },
  error: {
    fontSize: 11,
    color: "#E05555",
    textAlign: "center",
    marginBottom: 16,
  },
  resendBox: {
    backgroundColor: "rgba(2,136,209,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  resendText: {
    fontSize: 13,
    color: "#0D47A1",
    marginBottom: 4,
  },
  resendLink: {
    color: "#0288D1",
    fontWeight: "600",
  },
  resendHint: {
    fontSize: 11,
    color: "#757575",
  },
  tipsBox: {
    backgroundColor: "rgba(2,136,209,0.08)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D47A1",
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
    lineHeight: 1.5,
  },
  primaryBtn: {
    backgroundColor: "#0288D1",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
