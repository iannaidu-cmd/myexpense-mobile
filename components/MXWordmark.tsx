import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { ViewStyle, View } from 'react-native';

// ─── MXWordmark ───────────────────────────────────────────────────────────────
// Full "MyExpense" wordmark as SVG — transparent background, scales to any size.
// The letter 'e' in "Expense" is replaced by the signature circular icon:
//   two horizontal bars (hamburger ≡) + teal smile arc.
//
// Usage:
//   <MXWordmark width={240} />                  ← dark (navy) — for white/light bg
//   <MXWordmark width={240} variant="light" />  ← light (white) — for blue/dark bg
//   <MXWordmark width={160} style={{marginBottom: 24}} />
//
// Colours:
//   Navy:  #2D2E7A   colour.text (dark variant)
//   White: #FFFFFF   colour.onPrimary (light variant)
//   Teal:  #3AC0A0   colour.accent  (always teal — visible on both backgrounds)
// ─────────────────────────────────────────────────────────────────────────────

const TEAL = '#3AC0A0';

// Artwork viewBox: 1140 × 290 (~4:1)
const VB_W = 1140;
const VB_H = 290;

interface MXWordmarkProps {
  /** Width in dp. Height scales automatically at ~4:1. Default 240. */
  width?: number;
  /** 'dark' = navy letters (use on white/light bg). 'light' = white letters (use on blue/dark bg). */
  variant?: 'dark' | 'light';
  style?: ViewStyle;
}

export default function MXWordmark({
  width = 240,
  variant = 'dark',
  style,
}: MXWordmarkProps) {
  const height = Math.round((width / VB_W) * VB_H);
  const INK = variant === 'light' ? '#FFFFFF' : '#2D2E7A';
  const SW = 36; // stroke width
  const LC = 'round' as const;

  return (
    <View style={style}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        accessible
        accessibilityLabel="MyExpense"
        accessibilityRole="image"
      >
        {/* ── M ── */}
        <Path
          d="M22 225 L22 62 L84 168 L146 62 L146 225"
          stroke={INK} strokeWidth={40} strokeLinecap={LC} strokeLinejoin={LC} fill="none"
        />

        {/* ── y ── */}
        <Path d="M172 98 L208 192 L172 258" stroke={INK} strokeWidth={SW} strokeLinecap={LC} strokeLinejoin={LC} fill="none" />
        <Path d="M244 98 L208 192"          stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />

        {/* ── E ── */}
        <Path d="M282 60 L282 228"  stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />
        <Path d="M282 60 L368 60"   stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />
        <Path d="M282 144 L352 144" stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />
        <Path d="M282 228 L368 228" stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />

        {/* ── x ── */}
        <Path d="M390 95 L462 205 M462 95 L390 205" stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />

        {/* ── p ── */}
        <Path d="M490 95 L490 268"
          stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />
        <Path d="M490 95 Q490 48 544 48 Q598 48 598 134 Q598 210 544 210 Q490 210 490 170"
          stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />

        {/* ── Icon: circle replacing 'e' ── */}
        <Circle cx={672} cy={134} r={80} stroke={INK} strokeWidth={32} fill="none" />
        {/* Two horizontal bars */}
        <Rect x={628} y={100} width={88} height={17} rx={8.5} fill={INK} />
        <Rect x={628} y={130} width={88} height={17} rx={8.5} fill={INK} />
        {/* Teal smile — always teal regardless of variant */}
        <Path d="M630 174 Q672 212 714 174" stroke={TEAL} strokeWidth={17} strokeLinecap={LC} fill="none" />

        {/* ── n ── */}
        <Path d="M775 210 L775 100 Q775 52 824 52 Q873 52 873 100 L873 210"
          stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />

        {/* ── s ── */}
        <Path d="M950 86 Q950 52 910 55 Q870 58 870 100 Q870 144 944 150 Q1012 155 1012 195 Q1012 236 965 236 Q918 236 915 208"
          stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />

        {/* ── e ── */}
        <Path d="M1040 150 L1108 150 Q1115 150 1115 130 Q1115 52 1050 52 Q985 52 985 134 Q985 216 1050 216 Q1090 216 1108 196"
          stroke={INK} strokeWidth={SW} strokeLinecap={LC} fill="none" />
      </Svg>
    </View>
  );
}
