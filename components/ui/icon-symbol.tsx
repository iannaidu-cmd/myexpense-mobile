// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chart.bar.fill": "bar-chart",
  "chart.bar": "bar-chart",
  "camera.fill": "camera",
  "camera.aperture": "camera",
  "plus.circle.fill": "add-circle",
  "plus": "add",
  "gearshape.fill": "settings",
  "person.fill": "person",
  "list.bullet": "format-list-bulleted",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "bell.fill": "notifications",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "info.circle": "info",
  "doc.text.fill": "description",
  "folder.fill": "folder",
  "creditcard.fill": "credit-card",
  "checkmark": "check",
  "pencil": "edit",
  "xmark": "close",
  "tag.fill": "label",
  "exclamationmark.circle": "error",
  "checkmark.circle.fill": "check-circle",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "photo.fill": "photo",
  "car.fill": "directions-car",
  "clock.fill": "access-time",
  "dollarsign.circle": "attach-money",
  "magnifyingglass": "search",
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
  "calendar": "calendar-today",
  "mappin": "location-on",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
