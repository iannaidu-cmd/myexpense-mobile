import { colour, radius, space } from '@/tokens';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const LOGO_W = SW * 0.58;
const LOGO_H = 42;

function HeroPlaceholder() {
  return (
    <View style={{ alignItems: 'center', marginBottom: space.xl }}>
      <View
        style={{
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: colour.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Periwinkle accent blob */}
        <View
          style={{
            position: 'absolute',
            width: 160,
            height: 100,
            borderRadius: 50,
            backgroundColor: colour.primary100,
            bottom: 10,
            right: -20,
            opacity: 0.8,
            transform: [{ rotate: '-30deg' }],
          }}
        />
        {/* Inner white circle */}
        <View
          style={{
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: colour.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Person silhouette — head */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colour.primary200,
              marginBottom: 6,
            }}
          />
          {/* Person silhouette — body */}
          <View
            style={{
              width: 60,
              height: 32,
              borderRadius: 16,
              backgroundColor: colour.primary100,
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default function OnboardingStep1Screen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colour.background }}>
      <View style={{ flex: 1, paddingHorizontal: space.lg }}>

        {/* Top bar: logo + step counter */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: space.md,
            paddingBottom: space.sm,
          }}
        >
          <Image
            source={require('@/assets/images/Full-logo.gif')}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 11,
              color: colour.textSub,
              fontWeight: '600',
              letterSpacing: 0.5,
            }}
          >
            01 / 03
          </Text>
        </View>

        <HeroPlaceholder />

        {/* Stat section */}
        <View style={{ marginBottom: space.xl }}>
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
            <Text
              style={{
                fontSize: 11,
                color: colour.primary,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              Average unclaimed per year
            </Text>
          </View>
          <Text
            style={{
              fontSize: 48,
              fontWeight: '800',
              color: colour.primary,
              letterSpacing: -1.5,
              lineHeight: 54,
            }}
          >
            R37,492
          </Text>
        </View>

        {/* Body */}
        <Text
          style={{
            fontSize: 16,
            color: colour.textSub,
            lineHeight: 24,
            marginBottom: space.xl,
          }}
        >
          South Africa's 3.8 million self-employed lose thousands in unclaimed
          deductions every year. MyExpense fixes that — automatically.
        </Text>

        <View style={{ flex: 1 }} />

        {/* Progress dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginBottom: space.md,
          }}
        >
          <View
            style={{
              width: 22,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.primary,
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.border,
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: colour.border,
            }}
          />
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => router.push('/onboarding-step-2')}
          style={{
            backgroundColor: colour.noir,
            borderRadius: radius.pill,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.md,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colour.onNoir }}>
            Get started →
          </Text>
        </TouchableOpacity>

        {/* Sign in */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: space.lg,
          }}
        >
          <Text style={{ fontSize: 14, color: colour.textSub }}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/sign-in')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colour.primary }}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
