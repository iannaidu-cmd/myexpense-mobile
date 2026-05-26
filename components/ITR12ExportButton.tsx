// components/ITR12ExportButton.tsx
// Drop this into reports.tsx or itr12-export-setup.tsx.
// Usage: <ITR12ExportButton taxYear="2024/25" />

import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";
import { exportITR12 } from "@/services/itr12ExportService";
import { colour, radius, space, typography } from "@/tokens";

interface Props {
  taxYear: string;
}

export function ITR12ExportButton({ taxYear }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const result = await exportITR12({ taxYear });
    setLoading(false);

    if (!result.success) {
      Alert.alert(
        "Export Failed",
        result.error ?? "Something went wrong. Please try again.",
        [{ text: "OK" }],
      );
    }
    // On success the share sheet opens automatically — no alert needed
  }

  return (
    <TouchableOpacity
      onPress={handleExport}
      disabled={loading}
      activeOpacity={0.8}
      style={{
        backgroundColor:   loading ? colour.primary100 : colour.primary,
        borderRadius:      radius.pill,
        paddingVertical:   space.md,
        paddingHorizontal: space.lg,
        flexDirection:     "row",
        alignItems:        "center",
        justifyContent:    "center",
        gap:               space.sm,
        opacity:           loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <>
          <ActivityIndicator color={colour.onPrimary} size="small" />
          <Text style={{ ...typography.actionM, color: colour.onPrimary }}>
            Generating ITR12...
          </Text>
        </>
      ) : (
        <Text style={{ ...typography.actionM, color: colour.onPrimary }}>
          Export ITR12 eFiling Reference
        </Text>
      )}
    </TouchableOpacity>
  );
}
