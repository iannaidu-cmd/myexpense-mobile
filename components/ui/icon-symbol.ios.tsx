// components/ui/icon-symbol.tsx
// Cross-platform icon component:
//   iOS  → expo-symbols (SF Symbols, native)
//   Android/Web → @expo/vector-icons MaterialIcons (fallback)

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, Platform, StyleProp, ViewStyle } from "react-native";

// ─── SF Symbol → MaterialIcons name mapping ───────────────────────────────────
// Add any new SF Symbol names used in the app here.
const SF_TO_MATERIAL: Record<
  string,
  React.ComponentProps<typeof MaterialIcons>["name"]
> = {
  "house.fill": "home",
  "camera.fill": "photo-camera",
  "plus.circle.fill": "add-circle",
  "chart.bar": "bar-chart",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  "person.fill": "person",
  "bell.fill": "notifications",
  "doc.text.fill": "description",
  "folder.fill": "folder",
  magnifyingglass: "search",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  xmark: "close",
  checkmark: "check",
  plus: "add",
  "trash.fill": "delete",
  pencil: "edit",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "info.circle": "info",
  "exclamationmark.circle": "error",
  "checkmark.circle.fill": "check-circle",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "creditcard.fill": "credit-card",
  "cart.fill": "shopping-cart",
  "tag.fill": "label",
  calendar: "calendar-today",
  "clock.fill": "access-time",
  mappin: "location-on",
  paperclip: "attach-file",
  "square.and.arrow.up": "share",
  "arrow.clockwise": "refresh",
  "line.3.horizontal": "menu",
  "car.fill": "directions-car",
  "list.bullet": "format-list-bulleted",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "photo.fill": "photo",
  "dollarsign.circle": "attach-money",
  "key.fill": "vpn-key",
  "envelope.fill": "email",
  "shield.fill": "security",
  "globe": "public",
  "flag.fill": "flag",
  "bolt.fill": "bolt",
  "building.columns.fill": "account-balance",
  "arrow.right.square.fill": "exit-to-app",
  "exclamationmark.triangle.fill": "warning",
  "chart.pie.fill": "pie-chart",
  "star.fill": "star",
  "lightbulb.fill": "lightbulb",
  "megaphone.fill": "campaign",
  "fork.knife": "restaurant",
  "wrench.fill": "build",
  "dollarsign.circle.fill": "payments",
  "tray.and.arrow.up.fill": "upload",
  "flashlight.on.fill": "flash-on",
  "person.badge.fill": "badge",
  "phone.fill": "phone",
  "map.fill": "map",
  "building.2.fill": "business",
  "books.vertical.fill": "menu-book",
  "briefcase.fill": "work",
};

type IconSymbolProps = {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: IconSymbolProps) {
  // iOS — use native SF Symbols
  if (Platform.OS === "ios") {
    const { SymbolView } = require("expo-symbols");
    return (
      <SymbolView
        weight={weight}
        tintColor={color as string}
        resizeMode="scaleAspectFit"
        name={name}
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  // Android / Web — map to MaterialIcons
  const materialName = SF_TO_MATERIAL[name] ?? "help-outline";
  return (
    <MaterialIcons
      name={materialName}
      size={size}
      color={color as string}
      style={style as any}
    />
  );
}
