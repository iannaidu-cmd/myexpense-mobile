// ─── Onboarding ──────────────────────────────────────────────────────────────
// Two pages before sign-up:
//   1. Intro: what MyExpense gets you back.
//   2. How do you earn your income? The answer is required (Continue is off
//      until one is picked, and nothing is pre-picked so the data isn't
//      skewed) and becomes the account's profiles.work_type, which decides:
//        • whether vehicle costs and wear & tear can be claimed (lib/workType.ts)
//        • the work type on the tax export and logbook
//      There's no account yet, so the pick is held on the device
//      (PENDING_WORK_TYPE_KEY) and saved to the profile on first sign-in by
//      ProfileSetupPrompt in app/_layout.tsx. It can be changed on My profile.
// ─────────────────────────────────────────────────────────────────────────────

import { OnboardingHeroScene } from '@/components/illustrations/OnboardingHeroScene';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PENDING_WORK_TYPE_KEY } from '@/lib/workType';
import { trackFunnel } from '@/services/funnelService';
import { colour, radius, space } from '@/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const PAGES = 2;

// Ids match WORK_TYPES in lib/workType.ts. "Other" stays available on My
// profile but isn't offered here, so new accounts land in a real group.
const CHOICES = [
  { id: 'freelancer', icon: 'briefcase.fill', label: 'Freelancer', sub: 'Many clients, I invoice them myself', as: 'a freelancer' },
  { id: 'sole', icon: 'building.2.fill', label: 'Sole proprietor', sub: 'I run a business in my own name', as: 'a sole proprietor' },
  { id: 'contractor', icon: 'doc.text.fill', label: 'Independent contractor', sub: 'A few clients, on contract', as: 'an independent contractor' },
  { id: 'employed', icon: 'person.fill', label: 'Salaried employee', sub: 'I get an IRP5 from my employer', as: 'a salaried employee' },
] as const;

type ChoiceId = (typeof CHOICES)[number]['id'];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ChoiceId | null>(null);
  const choice = CHOICES.find((c) => c.id === selected);

  // Pre-select a pick made earlier on this device (e.g. they went on to
  // sign-up and came back).
  useEffect(() => {
    AsyncStorage.getItem(PENDING_WORK_TYPE_KEY)
      .then((v) => {
        if (CHOICES.some((c) => c.id === v)) setSelected(v as ChoiceId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    trackFunnel('onboarding_page', { page });
  }, [page]);

  const scrollToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SW, animated: true });
    setPage(index);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / SW));
  };

  const handleContinue = async () => {
    if (page === 0) {
      scrollToPage(1);
      return;
    }
    if (!selected) return;
    trackFunnel('onboarding_done', { work_type: selected });
    await AsyncStorage.setItem(PENDING_WORK_TYPE_KEY, selected).catch(() => {});
    router.replace('/sign-up');
  };

  const ctaDisabled = page === 1 && !choice;
  const ctaLabel = page === 0
    ? 'Get started'
    : choice ? `Continue as ${choice.as}` : 'Pick one to continue';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      {/* Top bar: logo + sign in */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 10,
        }}
      >
        <Image
          source={require('@/assets/images/Full-logo.gif')}
          style={{ width: 132, height: 28 }}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => router.replace('/sign-in')} hitSlop={10}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colour.textSub }}>
            Already a user? <Text style={{ color: colour.primary, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'flex-start' }}
      >
        {/* ── Page 1: Intro ── */}
        <ScrollView
          style={{ width: SW }}
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <OnboardingHeroScene />
          <View style={{ marginBottom: space.lg }}>
            <View
              style={{
                backgroundColor: colour.heroDark,
                borderRadius: radius.pill,
                paddingHorizontal: space.md,
                paddingVertical: space.xs,
                alignSelf: 'flex-start',
                marginBottom: space.sm,
              }}
            >
              <Text style={{ fontSize: 11, color: colour.onNoir, fontWeight: '700', letterSpacing: 0.3 }}>
                Average unclaimed per year
              </Text>
            </View>
            <Text style={{ fontSize: 46, fontWeight: '800', color: colour.primary, letterSpacing: -1.5, lineHeight: 52 }}>
              R37,492
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.6, lineHeight: 28, color: colour.heroDark, marginBottom: space.sm }}>
            Stop leaving your money with SARS.
          </Text>
          <Text style={{ fontSize: 15.5, color: colour.textSub, lineHeight: 23 }}>
            Most self-employed people in South Africa pay more tax than they need to, because slips get
            lost and work trips go unrecorded. MyExpense keeps them all in one place, so you can claim
            {"what you're owed."}
          </Text>
        </ScrollView>

        {/* ── Page 2: How do you earn your income? ── */}
        <ScrollView
          style={{ width: SW }}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: space.md }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={{ paddingHorizontal: 4, paddingTop: 22 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 1.7,
                textTransform: 'uppercase',
                color: colour.primary,
                marginBottom: 10,
              }}
            >
              Get your money back from SARS
            </Text>
            <Text style={{ fontSize: 30, fontWeight: '800', letterSpacing: -1.2, lineHeight: 32, color: colour.heroDark }}>
              How do you{'\n'}earn your income?
            </Text>
            <Text style={{ fontSize: 13.5, lineHeight: 20, fontWeight: '500', color: colour.textSub, marginTop: 10 }}>
              This decides what you can claim, like your car costs, and goes on your tax export. You can
              change it later.
            </Text>
          </View>

          <View style={{ gap: 10, paddingTop: 18 }}>
            {CHOICES.map((c) => {
              const on = selected === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelected(c.id)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: colour.white,
                    borderWidth: 1.5,
                    borderColor: on ? colour.primary : colour.borderLight,
                    borderRadius: 18,
                    paddingVertical: 11,
                    paddingHorizontal: 14,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colour.borderLight,
                      backgroundColor: on ? colour.primary50 : colour.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name={c.icon} size={19} color={on ? colour.primary : colour.heroDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '700', letterSpacing: -0.3, color: colour.heroDark }}>
                      {c.label}
                    </Text>
                    <Text style={{ fontSize: 11.5, fontWeight: '500', color: colour.textSub, marginTop: 1 }}>{c.sub}</Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: radius.pill,
                      borderWidth: 2,
                      borderColor: on ? colour.primary : colour.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on && <View style={{ width: 11, height: 11, borderRadius: radius.pill, backgroundColor: colour.primary }} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View
              style={{
                marginTop: 4,
                paddingVertical: 11,
                paddingHorizontal: 13,
                borderRadius: 15,
                backgroundColor: colour.primary + '17',
                borderWidth: 1,
                borderColor: colour.primary + '29',
              }}
            >
              <Text style={{ fontSize: 11.5, lineHeight: 16, fontWeight: '500', color: colour.textMid }}>
                <Text style={{ fontWeight: '700', color: colour.heroDark }}>Not sure? </Text>
                If you invoice clients yourself, pick freelancer. If you only earn a salary, pick employee.
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Bottom: dots + buttons */}
      <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: space.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: space.md }}>
          {Array.from({ length: PAGES }, (_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 22 : 6,
                height: 6,
                borderRadius: radius.pill,
                backgroundColor: i === page ? colour.primary : colour.border,
              }}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          {page > 0 && (
            <TouchableOpacity
              onPress={() => scrollToPage(page - 1)}
              style={{
                backgroundColor: colour.surface1,
                borderRadius: radius.pill,
                height: 52,
                paddingHorizontal: space.lg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: colour.textSub }}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={ctaDisabled}
            activeOpacity={0.85}
            style={{
              flex: 1,
              height: 52,
              borderRadius: radius.pill,
              backgroundColor: ctaDisabled ? colour.border : colour.primary,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.sm,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: ctaDisabled ? colour.textSub : colour.onPrimary }}
            >
              {ctaLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 12 }}>
          {['Free to start', 'No card needed', 'Change it anytime'].map((t) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colour.brandTeal }} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: colour.textSub }}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
