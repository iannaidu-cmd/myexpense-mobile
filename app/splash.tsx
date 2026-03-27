import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: 200,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();

    // ── Increased from 2500ms to 4500ms (+2 seconds) ──
    const timer = setTimeout(() => {
      router.replace('/onboarding-step-1');
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onTouchEnd={() => router.replace('/onboarding-step-1')}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('@/assets/images/sm_logo.gif')}
          style={{
            width: 120,
            height: 120,
            resizeMode: 'contain',
          }}
        />
      </Animated.View>
    </View>
  );
}
