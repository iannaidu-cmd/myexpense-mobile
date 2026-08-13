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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(400);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
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
            justifyContent: "flex-end",
            opacity: backdropOpacity,
          }}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={{
                backgroundColor: colour.noir,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY: sheetTranslateY }],
              }}
            >
              <View>
                {/* Grabber */}
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 100,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignSelf: "center",
                    marginBottom: 18,
                  }}
                />

                {/* Header: icon + eyebrow/title */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: iconColour,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconSymbol name={icon as any} size={20} color={colour.onNoir} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {eyebrow ? (
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          letterSpacing: 0.7,
                          textTransform: "uppercase",
                          color: colour.primary300,
                          marginBottom: 3,
                        }}
                      >
                        {eyebrow}
                      </Text>
                    ) : null}
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "800",
                        color: colour.onNoir,
                        letterSpacing: -0.3,
                      }}
                    >
                      {title}
                    </Text>
                  </View>
                </View>

                {subtitle ? (
                  <Text
                    style={{
                      fontSize: 12.5,
                      color: colour.onNoir2,
                      lineHeight: 19,
                      marginBottom: 18,
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
                      shadowColor: colour.primary,
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.5,
                      shadowRadius: 12,
                      elevation: 6,
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
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: "600",
                        color: colour.onNoir2,
                        textAlign: "center",
                      }}
                    >
                      {secondaryLabel}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
