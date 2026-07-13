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
  title: string;
  children?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  onClose: () => void;
}

export function AnnouncementModal({
  visible,
  icon = "bell.fill",
  title,
  children,
  primaryLabel,
  onPrimary,
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
            backgroundColor: "rgba(8, 8, 18, 0.58)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            opacity: backdropOpacity,
          }}
        >
          <Animated.View
            onStartShouldSetResponder={() => true}
            style={{
              width: "100%",
              maxWidth: 360,
              maxHeight: "82%",
              backgroundColor: colour.white,
              borderRadius: 28,
              overflow: "hidden",
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            }}
          >
            {/* Top accent strip */}
            <View style={{ width: "100%", height: 4, backgroundColor: colour.primary }} />

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colour.bgPage,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <IconSymbol name="xmark" size={16} color={colour.textSecondary} />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={{ padding: 24, paddingTop: 28, alignItems: "center" }}
              showsVerticalScrollIndicator={false}
            >
              {/* Icon circle */}
              <View style={{ marginBottom: 16, alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    position: "absolute",
                    width: 88,
                    height: 88,
                    borderRadius: 44,
                    backgroundColor: colour.primary,
                    opacity: 0.08,
                  }}
                />
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colour.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name={icon as any} size={26} color={colour.onPrimary} />
                </View>
              </View>

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colour.text,
                  textAlign: "center",
                  letterSpacing: -0.4,
                  marginBottom: 12,
                }}
              >
                {title}
              </Text>

              {children ? <View style={{ width: "100%" }}>{children}</View> : null}

              {primaryLabel && onPrimary ? (
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
                    marginTop: 20,
                  }}
                >
                  <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                    {primaryLabel}
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
