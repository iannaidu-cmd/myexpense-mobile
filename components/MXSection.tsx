// ─── MXSection ────────────────────────────────────────────────────────────────
// Layout pieces from the "MyExpense Screens Redesign" mockup, as already used
// inline on the newer screens (tax-liability-inputs, expense-detail,
// expense-history). Shared here so the vehicle and logbook screens match them
// exactly instead of re-deriving the values.
//
// • SectionCard: white card, title inside (mockup ".card" + ".h2")
// • GroupRow / GroupTotal: key/value lines (mockup ".group .grow / .tot")
// • NoteCard: dark callout (mockup ".note" on heroDark, like "SARS compliance")
// • SectionEyebrow: small upper-case label above a list (mockup ".eyebrow")
// ─────────────────────────────────────────────────────────────────────────────

import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space, typography } from "@/tokens";
import React from "react";
import { Text, View, ViewStyle } from "react-native";

export function SectionCard({
  title,
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={{
        backgroundColor: colour.white,
        borderRadius: radius.card,
        padding: space.md,
        borderWidth: 1,
        borderColor: colour.borderLight,
        marginBottom: space.md,
        gap: space.sm,
        ...style,
      }}
    >
      {title ? (
        <View>
          <Text style={{ ...typography.cardTitle, color: colour.text }}>{title}</Text>
          {subtitle ? (
            <Text style={{ ...typography.hintText, color: colour.textSub, marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function GroupRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: space.sm,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colour.borderLight,
        gap: space.md,
      }}
    >
      <Text style={{ ...typography.groupKey, color: colour.textSub, flex: 1 }}>{label}</Text>
      <Text style={{ ...typography.groupValue, color: colour.text }}>{value}</Text>
    </View>
  );
}

export function GroupTotal({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: space.sm,
        gap: space.md,
      }}
    >
      <Text style={{ ...typography.totalKey, color: colour.text, flex: 1 }}>{label}</Text>
      <Text style={{ ...typography.totalValue, color: accent ? colour.accentDeep : colour.text }}>{value}</Text>
    </View>
  );
}

export function NoteCard({
  icon = "info.circle.fill",
  title,
  body,
  style,
}: {
  icon?: string;
  title: string;
  body: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={{
        backgroundColor: colour.heroDark,
        borderRadius: radius.card,
        padding: space.md,
        marginBottom: space.md,
        ...style,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.xs }}>
        <IconSymbol name={icon as any} size={14} color={colour.primary200} />
        <Text style={{ ...typography.labelS, color: colour.onNoir }}>{title}</Text>
      </View>
      <Text style={{ ...typography.noteText, color: colour.onNoir2 }}>{body}</Text>
    </View>
  );
}

export function SectionEyebrow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <Text
      style={{
        ...typography.eyebrow,
        color: colour.textSecondary,
        textTransform: "uppercase",
        marginBottom: space.sm,
        ...(style as any),
      }}
    >
      {children}
    </Text>
  );
}
