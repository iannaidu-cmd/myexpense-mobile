import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, typography } from "@/tokens";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface AnnouncementModalProps {
  visible: boolean;
  icon?: string;
  iconColour?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose: () => void;
}

export function AnnouncementModal({
  visible,
  icon = "bell.fill",
  iconColour = colour.primary,
  eyebrow,
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}: AnnouncementModalProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.9);
      cardOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 15, 30, 0.5)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            opacity: backdropOpacity,
          }}
        >
          <Animated.View
            onStartShouldSetResponder={() => true}
            style={{
              width: "100%",
              maxWidth: 360,
              maxHeight: "86%",
              backgroundColor: colour.white,
              borderRadius: 26,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            }}
          >
            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colour.bgPage,
                borderWidth: 1,
                borderColor: colour.borderLight,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <IconSymbol name="xmark" size={12} color={colour.textSub} />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={{ padding: 24, paddingTop: 24, paddingBottom: 20, alignItems: "center" }}
              showsVerticalScrollIndicator={false}
            >
              {/* Icon */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  backgroundColor: iconColour,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                  shadowColor: iconColour,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <IconSymbol name={icon as any} size={24} color={colour.white} />
              </View>

              {eyebrow ? (
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: "700",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: colour.accentDeep,
                    marginBottom: 6,
                    textAlign: "center",
                  }}
                >
                  {eyebrow}
                </Text>
              ) : null}

              <Text
                style={{
                  fontSize: 19,
                  fontWeight: "800",
                  color: colour.text,
                  textAlign: "center",
                  letterSpacing: -0.4,
                  marginBottom: 8,
                }}
              >
                {title}
              </Text>

              {subtitle ? (
                <Text
                  style={{
                    fontSize: 12.5,
                    color: colour.textSub,
                    textAlign: "center",
                    lineHeight: 18,
                    marginBottom: 18,
                    paddingHorizontal: 4,
                  }}
                >
                  {subtitle}
                </Text>
              ) : null}

              {children ? <View style={{ width: "100%" }}>{children}</View> : null}

              {primaryLabel && onPrimary ? (
                <TouchableOpacity
                  onPress={onPrimary}
                  activeOpacity={0.85}
                  style={{
                    width: "100%",
                    backgroundColor: colour.primary,
                    borderRadius: radius.pill,
                    height: 50,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 4,
                  }}
                >
                  <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                    {primaryLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {secondaryLabel ? (
                <TouchableOpacity
                  onPress={onSecondary ?? onClose}
                  activeOpacity={0.7}
                  style={{ marginTop: 12, paddingVertical: 4 }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: "600", color: colour.textSub }}>
                    {secondaryLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
