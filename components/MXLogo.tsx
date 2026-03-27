import React from 'react';
import { Platform, TouchableOpacity, View, ViewStyle } from 'react-native';

// ─── MXLogo ──────────────────────────────────────────────────────────────────
// Platform-aware logo component:
//   Native (iOS/Android) — SVG via react-native-svg (transparent bg)
//   Web — inline HTML/CSS SVG (also transparent, works in browser)
//
// Variants:
//   "light" — white bars + teal smile  (use on blue/dark backgrounds)
//   "dark"  — navy bars + teal smile   (use on white/light backgrounds)
// ─────────────────────────────────────────────────────────────────────────────

interface MXLogoProps {
  size?: number;
  variant?: 'dark' | 'light';
  onPress?: () => void;
  style?: ViewStyle;
}

// ── Native SVG component (iOS + Android only) ─────────────────────────────────
function MXLogoNative({ size, barColour, onPress, style }: {
  size: number;
  barColour: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  // Lazy import so web bundler never tries to resolve react-native-svg
  const { default: Svg, Rect, Path } = require('react-native-svg');
  const TEAL = '#3AC0A0';

  const logo = (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="4"  y="8"    width="32" height="5.5" rx="2.75" fill={barColour} />
      <Rect x="4"  y="17.5" width="32" height="5.5" rx="2.75" fill={barColour} />
      <Path d="M4 30 Q20 42 36 30" stroke={TEAL} strokeWidth="5.5" strokeLinecap="round" fill="none" />
    </Svg>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={style}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        {logo}
      </TouchableOpacity>
    );
  }
  return <View style={style}>{logo}</View>;
}

// ── Web SVG component (browser only) ─────────────────────────────────────────
function MXLogoWeb({ size, barColour, onPress, style }: {
  size: number;
  barColour: string;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const TEAL = '#3AC0A0';

  // Use dangerouslySetInnerHTML to render a proper inline SVG on web
  // This is transparent and works on any background colour
  const svgString = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect x="4"  y="8"    width="32" height="5.5" rx="2.75" fill="${barColour}" />
      <rect x="4"  y="17.5" width="32" height="5.5" rx="2.75" fill="${barColour}" />
      <path d="M4 30 Q20 42 36 30" stroke="${TEAL}" stroke-width="5.5" stroke-linecap="round" fill="none" />
    </svg>
  `;

  const WebView = (
    // @ts-ignore — div is valid on web
    <div
      style={{ width: size, height: size, cursor: onPress ? 'pointer' : 'default' }}
      dangerouslySetInnerHTML={{ __html: svgString }}
      onClick={onPress}
      role={onPress ? 'button' : 'img'}
      aria-label={onPress ? 'Open menu' : 'MyExpense'}
    />
  );

  return <View style={style}>{WebView}</View>;
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MXLogo({
  size = 32,
  variant = 'dark',
  onPress,
  style,
}: MXLogoProps) {
  const barColour = variant === 'light' ? '#FFFFFF' : '#2D2E7A';

  if (Platform.OS === 'web') {
    return (
      <MXLogoWeb
        size={size}
        barColour={barColour}
        onPress={onPress}
        style={style}
      />
    );
  }

  return (
    <MXLogoNative
      size={size}
      barColour={barColour}
      onPress={onPress}
      style={style}
    />
  );
}
