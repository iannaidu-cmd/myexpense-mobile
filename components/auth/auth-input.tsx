import { colour, typography } from "@/tokens";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "decimal-pad";
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

  const borderColorValue = error
    ? colour.danger
    : focused
      ? colour.primary
      : colour.border;

  return (
    <View style={{ marginBottom: error ? 6 : 14 }}>
      {label && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: colour.primary,
            marginBottom: 7,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: borderColorValue,
          paddingHorizontal: 14,
          backgroundColor: colour.white,
          gap: 10,
        }}
      >
        {icon && <Text style={{ fontSize: 18, flexShrink: 0 }}>{icon}</Text>}

        <TextInput
          style={{
            ...typography.bodyM,
            flex: 1,
            paddingVertical: 13,
            color: colour.primary,
          }}
          placeholder={placeholder}
          placeholderTextColor={colour.textHint}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
        />

        {showSecureToggle && onToggleSecure && (
          <TouchableOpacity onPress={onToggleSecure} style={{ padding: 8, flexShrink: 0 }}>
            <Text style={{ fontSize: 18 }}>{secureTextEntry ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={{ fontSize: 11, color: colour.danger, marginTop: 4, paddingLeft: 4 }}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 4, paddingLeft: 4 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}
