import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
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
          backgroundColor: colour.primary + "17",
          borderWidth: 1,
          borderColor: colour.primary + "29",
          borderRadius: radius.note,
          padding: space.md,
          flexDirection: "row",
          gap: space.sm,
          alignItems: "flex-start",
        },
        style,
      ]}
    >
      <IconSymbol name={icon as any} size={15} color={colour.primary} style={{ marginTop: 1 } as any} />
      <View style={{ flex: 1 }}>
        {title ? (
          <Text style={{ ...typography.rowValue, color: colour.text, marginBottom: 2 }}>
            {title}
          </Text>
        ) : null}
        <Text style={{ ...typography.noteText, color: colour.text }}>
          {body}
        </Text>
      </View>
    </View>
  );
}
