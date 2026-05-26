import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, typography } from "@/tokens";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  icon?: string;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = true,
  icon,
}: ConfirmModalProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.9);
      cardOpacity.setValue(0);
      iconScale.setValue(0);
      contentOpacity.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
        ]),
        Animated.spring(iconScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const accentColour = destructive ? colour.danger : colour.primary;
  const resolvedIcon = icon ?? (destructive ? "trash.fill" : "exclamationmark.triangle.fill");

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(8, 8, 18, 0.58)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
            opacity: backdropOpacity,
          }}
        >
          <Animated.View
              onStartShouldSetResponder={() => true}
              style={{
                width: "100%",
                maxWidth: 328,
                backgroundColor: colour.white,
                borderRadius: 28,
                paddingBottom: 24,
                alignItems: "center",
                overflow: "hidden",
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              }}
            >
              {/* Top accent strip */}
              <View style={{ width: "100%", height: 4, backgroundColor: accentColour, marginBottom: 32 }} />

              {/* Icon circle */}
              <Animated.View
                style={{
                  transform: [{ scale: iconScale }],
                  marginBottom: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: accentColour,
                    opacity: 0.08,
                  }}
                />
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: accentColour,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name={resolvedIcon as any} size={28} color={colour.white} />
                </View>
              </Animated.View>

              {/* Text + buttons */}
              <Animated.View
                style={{
                  opacity: contentOpacity,
                  alignItems: "center",
                  paddingHorizontal: 24,
                  width: "100%",
                }}
              >
                <Text
                  style={{
                    fontSize: 21,
                    fontWeight: "700",
                    color: colour.text,
                    textAlign: "center",
                    letterSpacing: -0.5,
                    marginBottom: message ? 8 : 28,
                  }}
                >
                  {title}
                </Text>

                {message ? (
                  <Text
                    style={{
                      ...typography.bodyS,
                      color: colour.textSub,
                      textAlign: "center",
                      lineHeight: 21,
                      marginBottom: 28,
                    }}
                  >
                    {message}
                  </Text>
                ) : null}

                {/* Confirm button */}
                <TouchableOpacity
                  onPress={onConfirm}
                  activeOpacity={0.85}
                  style={{
                    width: "100%",
                    backgroundColor: accentColour,
                    borderRadius: radius.pill,
                    height: 52,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ ...typography.btnL, color: colour.white }}>
                    {confirmLabel}
                  </Text>
                </TouchableOpacity>

                {/* Cancel button */}
                <TouchableOpacity
                  onPress={onCancel}
                  activeOpacity={0.7}
                  style={{
                    width: "100%",
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ ...typography.btnL, color: colour.textSecondary }}>
                    {cancelLabel}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
