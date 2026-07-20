import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space } from "@/tokens";
import React from "react";
import { Text, View, ViewStyle } from "react-native";

interface InfoBannerProps {
  /** SF Symbol name. Defaults to "info.circle". */
  icon?: string;
  /** Optional bold heading above the body text. */
  title?: string;
  /** Main message text. */
  body: string;
  /** Style overrides for the outer container — use for margins. */
  style?: ViewStyle;
}

export function InfoBanner({ icon = "info.circle", title, body, style }: InfoBannerProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colour.noir,
          borderRadius: radius.md,
          padding: space.md,
          flexDirection: "row",
          gap: space.md,
          alignItems: "flex-start",
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: colour.primary,
          borderRadius: radius.sm,
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconSymbol name={icon as any} size={16} color={colour.onPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        {title ? (
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colour.onNoir,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
        ) : null}
        <Text style={{ fontSize: 12, color: colour.onNoir2, lineHeight: 18 }}>
          {body}
        </Text>
      </View>
    </View>
  );
}
