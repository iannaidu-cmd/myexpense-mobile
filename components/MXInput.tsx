// ─── MXInput ──────────────────────────────────────────────────────────────────
// Rounded border input — focus (#006FFD), error (#ED3241), label + hint text

import { colour, radius, space, typography } from "@/tokens";
import React, { useState } from "react";
import {
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface MXInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode; // leading icon
  trailingIcon?: React.ReactNode; // trailing icon (e.g. eye toggle)
  onTrailingPress?: () => void;
}

export function MXInput({
  label,
  hint,
  error,
  icon,
  trailingIcon,
  onTrailingPress,
  ...inputProps
}: MXInputProps) {
  const [focused, setFocused] = useState(false);

  const hasError = Boolean(error);

  const borderColor = hasError
    ? colour.danger
    : focused
      ? colour.primary
      : colour.surface2;

  const borderWidth = focused || hasError ? 1.5 : 1;

  return (
    <View style={{ gap: space.xs }}>
      {/* Label */}
      {label && (
        <Text
          style={{
            ...typography.actionS,
            color: hasError ? colour.danger : colour.text,
          }}
        >
          {label}
        </Text>
      )}

      {/* Input row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth,
          borderColor,
          borderRadius: radius.md,
          backgroundColor: colour.white,
          paddingHorizontal: space.md,
          paddingVertical: 8,
          gap: 8,
        }}
      >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <TextInput
          style={{
            flex: 1,
            ...typography.bodyL,
            color: colour.text,
            minHeight: 32,
          }}
          placeholderTextColor={colour.textHint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
        {trailingIcon && (
          <TouchableOpacity
            onPress={onTrailingPress}
            style={{
              minWidth: 44,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {trailingIcon}
          </TouchableOpacity>
        )}
      </View>

      {/* Hint or error */}
      {error ? (
        <Text style={{ ...typography.captionM, color: colour.danger }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ ...typography.captionM, color: colour.textHint }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
