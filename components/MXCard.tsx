// ─── MXCard ───────────────────────────────────────────────────────────────────
// White card, borderRadius lg, 1px surface2 border, elevation 1
// Shadow handled per-platform to avoid deprecation warnings on web

import React from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { colour, space, radius } from '@/tokens';

interface MXCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  noBorder?: boolean;
}

// Platform-aware shadow — iOS uses shadow* props, Android uses elevation,
// web uses boxShadow to avoid "shadow* deprecated" warnings
const shadowStyle: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  android: {
    elevation: 1,
  },
  default: {
    // web — boxShadow via style (React Native Web supports this)
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
  } as ViewStyle,
}) ?? {};

export function MXCard({
  children,
  style,
  padding = space.lg,
  noBorder = false,
}: MXCardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: colour.white,
    borderRadius: radius.lg,   // 16
    padding,
    borderWidth: noBorder ? 0 : 1,
    borderColor: colour.surface2,
    ...shadowStyle,
    ...style,
  };

  return <View style={cardStyle}>{children}</View>;
}
