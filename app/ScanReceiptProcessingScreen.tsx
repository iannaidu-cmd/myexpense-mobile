import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';

interface Props { navigation?: NavigationProp<any>; }

const C = {
  navy: '#2E2E7A', navyDark: '#1A1A5C', teal: '#3BBFAD',
  midNavy: '#3D3D9E', midNavy2: '#5B5BB8',
  bgLight: '#E8EAF6', bgLighter: '#F5F6FF',
  white: '#FFFFFF', text: '#1A1A2E', textSub: '#6B6B9E',
  border: '#D0D3F0', success: '#27AE60', warning: '#F39C12', danger: '#E74C3C',
};

interface ProcessStep { id: number; label: string; detail: string; durationMs: number; }

const STEPS: ProcessStep[] = [
  { id: 1, label: 'Capturing image',       detail: 'Optimising resolution & contrast', durationMs: 700  },
  { id: 2, label: 'Running OCR',           detail: 'Extracting text from receipt',     durationMs: 1200 },
  { id: 3, label: 'Parsing fields',        detail: 'Vendor · amount · date · VAT',     durationMs: 900  },
  { id: 4, label: 'Matching ITR12 category', detail: 'Mapping to SARS tax codes',       durationMs: 800  },
  { id: 5, label: 'Confidence check',      detail: 'Verifying extracted values',       durationMs: 600  },
];

export default function ScanReceiptProcessingScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const spin  = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Spin the loader
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Step through processing stages
  useEffect(() => {
    let step = 0;
    const runNextStep = () => {
      if (step >= STEPS.length) {
        setDone(true);
        Animated.timing(progress, { toValue: 1, duration: 300, useNativeDriver: false }).start();
        setTimeout(() => navigation?.navigate('ReceiptReview'), 900);
        return;
      }
      setCurrentStep(step);
      const pct = (step + 1) / STEPS.length;
      Animated.timing(progress, { toValue: pct, duration: STEPS[step].durationMs * 0.8, useNativeDriver: false }).start();
      setTimeout(() => { step += 1; runNextStep(); }, STEPS[step].durationMs);
    };
    runNextStep();
  }, []);

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ flex: 1, backgroundColor: C.navy }}>

      {/* Top bar */}
      <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, color: C.white, fontSize: 17, fontWeight: '700' }}>Processing Receipt</Text>
        {!done && (
          <TouchableOpacity onPress={() => navigation?.goBack()} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 }}>
            <Text style={{ color: C.white, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>

        {done ? (
          // ── Success state ──────────────────────────────────────────────────
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: C.success, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}>
              <Text style={{ fontSize: 48, color: C.white }}>✓</Text>
            </View>
            <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Receipt Processed!</Text>
            <Text style={{ color: C.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              OCR complete — reviewing extracted details now.
            </Text>
          </View>
        ) : (
          // ── Processing state ───────────────────────────────────────────────
          <>
            {/* Animated icon */}
            <Animated.View style={{ transform: [{ scale: pulse }], marginBottom: 32 }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(59,191,173,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(59,191,173,0.3)' }}>
                <Animated.Text style={{ fontSize: 48, transform: [{ rotate: spinDeg }] }}>
                  ⚙
                </Animated.Text>
              </View>
            </Animated.View>

            <Text style={{ color: C.white, fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>
              Analysing Receipt
            </Text>
            <Text style={{ color: C.textSub, fontSize: 13, textAlign: 'center', marginBottom: 32 }}>
              OCR is reading your receipt and mapping it to SARS ITR12 categories.
            </Text>

            {/* Progress bar */}
            <View style={{ width: '100%', marginBottom: 32 }}>
              <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <Animated.View style={{ height: 6, backgroundColor: C.teal, borderRadius: 3, width: progressWidth }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: C.textSub, fontSize: 11 }}>
                  Step {Math.min(currentStep + 1, STEPS.length)} of {STEPS.length}
                </Text>
                <Animated.Text style={{ color: C.teal, fontSize: 11, fontWeight: '700' }}>
                  {currentStep < STEPS.length ? `${Math.round(((currentStep + 1) / STEPS.length) * 100)}%` : '100%'}
                </Animated.Text>
              </View>
            </View>

            {/* Step list */}
            <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
              {STEPS.map((step, i) => {
                const isActive   = i === currentStep;
                const isComplete = i < currentStep;
                return (
                  <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < STEPS.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: isActive ? 'rgba(59,191,173,0.12)' : 'transparent' }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isComplete ? C.success : isActive ? C.teal : 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {isComplete ? (
                        <Text style={{ color: C.white, fontSize: 12, fontWeight: '800' }}>✓</Text>
                      ) : isActive ? (
                        <Animated.Text style={{ color: C.white, fontSize: 11, transform: [{ rotate: spinDeg }] }}>↻</Animated.Text>
                      ) : (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{step.id}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: isActive ? '700' : '500', color: isComplete ? C.textSub : isActive ? C.white : 'rgba(255,255,255,0.45)' }}>
                        {step.label}
                      </Text>
                      {isActive && (
                        <Text style={{ fontSize: 11, color: C.teal, marginTop: 2 }}>{step.detail}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* Bottom note */}
      {!done && (
        <View style={{ paddingHorizontal: 32, paddingBottom: 40 }}>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center' }}>
            🔒 Receipt data is processed securely and never shared without your consent.
          </Text>
        </View>
      )}
    </View>
  );
}
