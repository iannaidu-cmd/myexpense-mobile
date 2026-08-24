import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour, radius, space } from "@/tokens";
import { Linking, Text, TouchableOpacity, View } from "react-native";

export function UpdateAvailableBanner({
  version,
  storeUrl,
  onDismiss,
}: {
  version: string;
  storeUrl: string;
  onDismiss: () => void;
}) {
  return (
    <View
      style={{
        marginBottom: space.md,
        backgroundColor: colour.primary,
        borderRadius: radius.md,
        padding: space.md,
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
      }}
    >
      <TouchableOpacity
        onPress={() => Linking.openURL(storeUrl)}
        activeOpacity={0.8}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <IconSymbol name="arrow.down.circle.fill" size={22} color={colour.onPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colour.onPrimary }}>
            Update available
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
            Version {version} is ready — tap to update
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconSymbol name="xmark" size={12} color={colour.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
