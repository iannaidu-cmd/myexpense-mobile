// ─── Onboarding ───────────────────────────────────────────────────────────────
// One screen: what the person gets, then "How do you work?". Tapping a work
// type goes straight to sign-up, so the answer is required and it's one tap
// to the sign-up form. The pick is held on the device until there's an
// account to save it to (PENDING_WORK_TYPE_KEY, see lib/workType.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PENDING_WORK_TYPE_KEY, WORK_TYPES } from '@/lib/workType';
import { trackFunnel } from '@/services/funnelService';
import { colour, radius, space } from '@/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

type WorkTypeId = (typeof WORK_TYPES)[number]['id'];

const ICONS: Record<WorkTypeId, string> = {
  sole: 'building.2.fill',
  freelancer: 'briefcase.fill',
  contractor: 'doc.text.fill',
  employed: 'person.fill',
  other: 'list.bullet',
};

export default function OnboardingScreen() {
  const router = useRouter();

  const pick = (id: WorkTypeId) => {
    trackFunnel('onboarding_done', { work_type: id });
    AsyncStorage.setItem(PENDING_WORK_TYPE_KEY, id).catch(() => {});
    router.replace('/sign-up');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm, marginTop: 9 }}>
        <Image
          source={require('@/assets/images/Full-logo.gif')}
          style={{ width: LOGO_W, height: LOGO_H }}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: colour.primary50,
            borderRadius: radius.pill,
            paddingHorizontal: space.md,
            paddingVertical: space.xs,
            alignSelf: 'flex-start',
            marginBottom: space.sm,
          }}
        >
          <Text style={{ fontSize: 11, color: colour.primary, fontWeight: '700', letterSpacing: 0.3 }}>
            Average unclaimed per year: R37,492
          </Text>
        </View>
        <Text style={{ fontSize: 34, fontWeight: '800', color: colour.text, lineHeight: 40, letterSpacing: -0.8, marginBottom: space.md }}>
          Get your money{'\n'}
          <Text style={{ color: colour.primary }}>back from SARS.</Text>
        </Text>
        <Text style={{ fontSize: 16, color: colour.textSub, lineHeight: 24, marginBottom: space.xl }}>
          Keep every work expense in one place, with a trip logbook set out the way SARS asks for it.
          Then claim it all on your tax return.
        </Text>

        <Text style={{ fontSize: 17, fontWeight: '800', color: colour.text, marginBottom: 4 }}>
          How do you work?
        </Text>
        <Text style={{ fontSize: 13, color: colour.textSub, marginBottom: space.md }}>
          Pick one to create your free account.
        </Text>

        {WORK_TYPES.map((wt) => (
          <TouchableOpacity
            key={wt.id}
            onPress={() => pick(wt.id)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              borderWidth: 1.5,
              borderColor: colour.borderLight,
              borderRadius: radius.lg,
              backgroundColor: colour.white,
              paddingVertical: space.md,
              paddingHorizontal: space.md,
              marginBottom: space.sm,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: colour.primary50,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name={ICONS[wt.id] as any} size={19} color={colour.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colour.text }}>{wt.label}</Text>
            <IconSymbol name="chevron.right" size={14} color={colour.textHint} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.md }}>
        <Text style={{ fontSize: 14, color: colour.textSub }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/sign-in')}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colour.primary }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
