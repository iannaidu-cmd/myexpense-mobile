// ─── Onboarding: how do you earn your income? ────────────────────────────────
// The first screen a new install sees. The answer is required (Continue is
// off until one is picked, and nothing is pre-picked so the data isn't
// skewed) and becomes the account's profiles.work_type, which decides:
//   • whether vehicle costs and wear & tear can be claimed (lib/workType.ts)
//   • the work type on the tax export and logbook
// There's no account yet, so the pick is held on the device
// (PENDING_WORK_TYPE_KEY) and saved to the profile on first sign-in by
// ProfileSetupPrompt in app/_layout.tsx. It can be changed on My profile.
// ─────────────────────────────────────────────────────────────────────────────

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PENDING_WORK_TYPE_KEY } from '@/lib/workType';
import { trackFunnel } from '@/services/funnelService';
import { colour, radius, space } from '@/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const handleContinue = async () => {
    if (!selected) return;
    trackFunnel('onboarding_done', { work_type: selected });
    await AsyncStorage.setItem(PENDING_WORK_TYPE_KEY, selected).catch(() => {});
    router.replace('/sign-up');
  };

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: space.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={{ paddingHorizontal: 4, paddingTop: 26 }}>
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

        {/* Choices */}
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

          {/* Not sure? */}
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

      {/* Continue */}
      <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: space.lg }}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!choice}
          activeOpacity={0.85}
          style={{
            height: 52,
            borderRadius: radius.pill,
            backgroundColor: choice ? colour.primary : colour.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: choice ? colour.onPrimary : colour.textSub }}>
            {choice ? `Continue as ${choice.as}` : 'Pick one to continue'}
          </Text>
        </TouchableOpacity>
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
