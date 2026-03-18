import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface AuthInputProps {
  label?: string;
  placeholder: string;
  icon?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  showSecureToggle?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "decimal-pad";
  editable?: boolean;
}

export function AuthInput({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  error,
  hint,
  secureTextEntry = false,
  onToggleSecure,
  showSecureToggle = false,
  keyboardType = "default",
  editable = true,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const colorScheme = useColorScheme();
  const borderColor = useThemeColor({}, "text");

  const borderColorValue = error ? "#E05555" : focused ? "#1565C0" : "#E0E0E0";

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: error ? 6 : 14,
        },
      ]}
    >
      {label && (
        <ThemedText
          style={[
            styles.label,
            {
              color: "#1565C0",
            },
          ]}
        >
          {label}
        </ThemedText>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: borderColorValue,
            backgroundColor: "#fff",
          },
        ]}
      >
        {icon && (
          <ThemedText style={styles.icon} numberOfLines={1}>
            {icon}
          </ThemedText>
        )}

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#757575"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
        />

        {showSecureToggle && onToggleSecure && (
          <TouchableOpacity onPress={onToggleSecure} style={styles.toggleBtn}>
            <ThemedText style={styles.toggleIcon}>
              {secureTextEntry ? "🙈" : "👁️"}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      {hint && !error && <ThemedText style={styles.hint}>{hint}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    gap: 10,
  },
  icon: {
    fontSize: 18,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: "#0D47A1",
  },
  toggleBtn: {
    padding: 8,
    flexShrink: 0,
  },
  toggleIcon: {
    fontSize: 18,
  },
  error: {
    fontSize: 11,
    color: "#E05555",
    marginTop: 4,
    paddingLeft: 4,
  },
  hint: {
    fontSize: 11,
    color: "#757575",
    marginTop: 4,
    paddingLeft: 4,
  },
});
