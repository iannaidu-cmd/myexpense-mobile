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

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function SuccessModal({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SuccessModalProps) {
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
        // Backdrop + card fade in together
        Animated.parallel([
          Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
        ]),
        // Icon springs in
        Animated.spring(iconScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        // Content fades in
        Animated.timing(contentOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onPrimary}>
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
          <TouchableWithoutFeedback>
            <Animated.View
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
              <View
                style={{
                  width: "100%",
                  height: 4,
                  backgroundColor: colour.primary,
                  marginBottom: 32,
                }}
              />

              {/* Icon circle */}
              <Animated.View
                style={{
                  transform: [{ scale: iconScale }],
                  marginBottom: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Outer ring */}
                <View
                  style={{
                    position: "absolute",
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: colour.primary,
                    opacity: 0.08,
                  }}
                />
                {/* Inner circle */}
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: colour.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name="checkmark" size={30} color={colour.onPrimary} />
                </View>
              </Animated.View>

              {/* Text content */}
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

                {/* Primary button */}
                <TouchableOpacity
                  onPress={onPrimary}
                  activeOpacity={0.85}
                  style={{
                    width: "100%",
                    backgroundColor: colour.primary,
                    borderRadius: radius.pill,
                    height: 52,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: secondaryLabel ? 8 : 0,
                  }}
                >
                  <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                    {primaryLabel}
                  </Text>
                </TouchableOpacity>

                {/* Secondary button */}
                {secondaryLabel && onSecondary ? (
                  <TouchableOpacity
                    onPress={onSecondary}
                    activeOpacity={0.7}
                    style={{
                      width: "100%",
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ ...typography.btnL, color: colour.primary }}>
                      {secondaryLabel}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
