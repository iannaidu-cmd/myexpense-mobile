import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Line, Polyline, Path } from 'react-native-svg';
import { colour, space, radius } from '@/tokens';

const { width: SW, height: SH } = Dimensions.get('window');
const HERO_W = SW - 32;
const HERO_H = SH * 0.37;

// ─── Logo dimensions: 72% width → reduced 20% → ~58% width, height 42 (was 52) ──
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

function HeroIllustration() {
  return (
    <Svg width={HERO_W} height={HERO_H} viewBox="0 0 340 220" preserveAspectRatio="xMidYMid meet">
      <Rect x="108" y="14" width="130" height="158" rx="8" fill="white" stroke="#B8D4F8" strokeWidth="2" />
      <Path
        d="M108 158 Q115 150 122 158 Q129 166 136 158 Q143 150 150 158 Q157 166 164 158 Q171 150 178 158 Q185 166 192 158 Q199 150 206 158 Q213 166 220 158 Q227 150 238 158 L238 172 L108 172 Z"
        fill="white" stroke="#B8D4F8" strokeWidth="1.5"
      />
      <Rect x="126" y="30" width="56" height="7" rx="3.5" fill="#006FFD" opacity="0.35" />
      <Rect x="126" y="48" width="76" height="5" rx="2.5" fill="#D6E8FF" />
      <Rect x="126" y="58" width="60" height="5" rx="2.5" fill="#D6E8FF" />
      <Rect x="126" y="68" width="68" height="5" rx="2.5" fill="#D6E8FF" />
      <Rect x="126" y="78" width="50" height="5" rx="2.5" fill="#D6E8FF" />
      <Line x1="126" y1="92" x2="222" y2="92" stroke="#B8D4F8" strokeWidth="1.5" strokeDasharray="5 3" />
      <Rect x="126" y="100" width="36" height="5" rx="2.5" fill="#D6E8FF" />
      <Rect x="178" y="97" width="44" height="11" rx="4" fill="#006FFD" opacity="0.8" />
      <Rect x="126" y="118" width="4" height="20" rx="2" fill="#B8D4F8" />
      <Rect x="133" y="118" width="3" height="20" rx="1.5" fill="#B8D4F8" />
      <Rect x="139" y="118" width="5" height="20" rx="2.5" fill="#B8D4F8" />
      <Rect x="147" y="118" width="3" height="20" rx="1.5" fill="#B8D4F8" />
      <Rect x="153" y="118" width="4" height="20" rx="2" fill="#B8D4F8" />
      <Rect x="160" y="118" width="6" height="20" rx="3" fill="#B8D4F8" />
      <Rect x="169" y="118" width="3" height="20" rx="1.5" fill="#B8D4F8" />
      <Rect x="175" y="118" width="5" height="20" rx="2.5" fill="#B8D4F8" />
      <Rect x="183" y="118" width="3" height="20" rx="1.5" fill="#B8D4F8" />
      <Rect x="189" y="118" width="7" height="20" rx="3.5" fill="#B8D4F8" />
      <Rect x="199" y="118" width="4" height="20" rx="2" fill="#B8D4F8" />
      <Rect x="206" y="118" width="5" height="20" rx="2.5" fill="#B8D4F8" />
      <Rect x="34" y="130" width="70" height="70" rx="16" fill="white" stroke="#B8D4F8" strokeWidth="2" />
      <Rect x="44" y="146" width="50" height="36" rx="7" fill="#D6E8FF" />
      <Rect x="44" y="146" width="50" height="36" rx="7" stroke="#006FFD" strokeWidth="2" fill="none" />
      <Circle cx="69" cy="164" r="11" fill="white" stroke="#006FFD" strokeWidth="2" />
      <Circle cx="69" cy="164" r="5" fill="#006FFD" opacity="0.5" />
      <Circle cx="69" cy="164" r="2" fill="#006FFD" />
      <Rect x="79" y="148" width="10" height="6" rx="3" fill="#006FFD" opacity="0.4" />
      <Line x1="104" y1="164" x2="238" y2="164" stroke="#006FFD" strokeWidth="2" strokeDasharray="6 3" opacity="0.55" />
      <Circle cx="104" cy="164" r="4" fill="#006FFD" opacity="0.8" />
      <Circle cx="238" cy="164" r="4" fill="#006FFD" opacity="0.8" />
      <Circle cx="270" cy="48" r="22" fill="#006FFD" />
      <Polyline points="259,48 267,57 282,36" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export default function OnboardingStep1Screen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.white }}>
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>

        {/* ── Top bar: logo left, skip right ── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: space.md,
          paddingBottom: space.sm,
        }}>
          <Image
            source={require('@/assets/images/Full-logo.gif')}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
          {/* Skip → /sign-up (bypasses all onboarding) */}
          <TouchableOpacity
            onPress={() => router.replace('/sign-up')}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colour.textSub }}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <View style={{
          borderRadius: radius.xl,
          backgroundColor: '#D6E8FF',
          alignItems: 'center',
          justifyContent: 'center',
          height: HERO_H,
          overflow: 'hidden',
          marginBottom: space.md,
        }}>
          <HeroIllustration />
          <View style={{
            position: 'absolute',
            bottom: 14,
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            paddingHorizontal: space.md,
            paddingVertical: 9,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}>
            <Text style={{ fontSize: 15 }}>💰</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colour.white }}>Save up to R28,400/yr</Text>
          </View>
        </View>

        {/* Headline */}
        <Text style={{ fontSize: 34, fontWeight: '800', color: colour.text, lineHeight: 40, marginBottom: space.sm }}>
          Stop losing money{'\n'}<Text style={{ color: colour.primary }}>at tax time.</Text>
        </Text>

        {/* Body */}
        <Text style={{ fontSize: 16, color: colour.textSub, lineHeight: 24 }}>
          South Africa's 3.8 million self-employed lose thousands in unclaimed deductions every year. MyExpense fixes that — automatically.
        </Text>

        <View style={{ flex: 1 }} />

        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: space.md }}>
          <View style={{ width: 22, height: 6, borderRadius: radius.pill, backgroundColor: colour.primary }} />
          <View style={{ width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colour.border }} />
          <View style={{ width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colour.border }} />
        </View>

        {/* Next */}
        <TouchableOpacity
          onPress={() => router.push('/onboarding-step-2')}
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.md,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colour.white }}>Next →</Text>
        </TouchableOpacity>

        {/* Sign in */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: space.lg }}>
          <Text style={{ fontSize: 14, color: colour.textSub }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/sign-in')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colour.primary }}>Sign in</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
