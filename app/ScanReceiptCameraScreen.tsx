import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';

interface Props { navigation?: NavigationProp<any>; }

const C = {
  navy: '#2E2E7A', teal: '#3BBFAD', white: '#FFFFFF',
  textSub: '#6B6B9E', danger: '#E74C3C', warning: '#F39C12', success: '#27AE60',
};

// ─── Animated scan line ───────────────────────────────────────────────────────
function ScanLine({ active }: { active: boolean }) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [active]);

  const translateY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });

  return (
    <Animated.View style={{
      position: 'absolute', left: 0, right: 0, height: 2,
      backgroundColor: C.teal, opacity: active ? 0.85 : 0,
      transform: [{ translateY }],
      shadowColor: C.teal, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
    }} />
  );
}

// ─── Corner brackets ──────────────────────────────────────────────────────────
function CornerBrackets({ color = C.teal, size = 24, thickness = 3 }: {
  color?: string; size?: number; thickness?: number;
}) {
  const style = (top: boolean, left: boolean) => ({
    position: 'absolute' as const,
    top:    top  ? 0 : undefined, bottom: !top  ? 0 : undefined,
    left:   left ? 0 : undefined, right:  !left ? 0 : undefined,
    width: size, height: size,
    borderColor: color,
    borderTopWidth:    top    ? thickness : 0,
    borderBottomWidth: !top   ? thickness : 0,
    borderLeftWidth:   left   ? thickness : 0,
    borderRightWidth:  !left  ? thickness : 0,
    borderTopLeftRadius:     (top  && left)  ? 6 : 0,
    borderTopRightRadius:    (top  && !left) ? 6 : 0,
    borderBottomLeftRadius:  (!top && left)  ? 6 : 0,
    borderBottomRightRadius: (!top && !left) ? 6 : 0,
  });
  return (
    <>
      <View style={style(true,  true)}  />
      <View style={style(true,  false)} />
      <View style={style(false, true)}  />
      <View style={style(false, false)} />
    </>
  );
}

// ─── SCREEN: Scan Receipt — Camera ───────────────────────────────────────────
export default function ScanReceiptCameraScreen({ navigation }: Props) {
  const [flash,       setFlash]     = useState(false);
  const [torchOn,     setTorchOn]   = useState(false);
  const [scanning,    setScanning]  = useState(true);
  const [captured,    setCaptured]  = useState(false);
  const [countdown,   setCountdown] = useState<number | null>(null);
  const captureAnim = useRef(new Animated.Value(1)).current;

  const handleCapture = () => {
    setCaptured(true);
    setScanning(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    Animated.sequence([
      Animated.timing(captureAnim, { toValue: 0.92, duration: 80,  useNativeDriver: true }),
      Animated.timing(captureAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();

    // Simulate processing navigation
    let c = 3;
    setCountdown(c);
    const iv = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(iv);
        setCountdown(null);
        navigation?.navigate('ScanReceiptProcessing');
      } else {
        setCountdown(c);
      }
    }, 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>

      {/* Top bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ marginRight: 16 }}>
          <Text style={{ color: C.white, fontSize: 20 }}>✕</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, color: C.white, fontSize: 17, fontWeight: '700' }}>Scan Receipt</Text>
        <TouchableOpacity onPress={() => setTorchOn(v => !v)} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: torchOn ? C.teal : 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ fontSize: 18 }}>🔦</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.navigate('UploadFromGallery')} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>🖼</Text>
        </TouchableOpacity>
      </View>

      {/* Flash overlay */}
      {flash && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.white, zIndex: 20, opacity: 0.8 }} />}

      {/* Viewfinder */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Dark overlay with cutout illusion */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />

        {/* Receipt frame */}
        <Animated.View style={{ width: 280, height: 240, position: 'relative', transform: [{ scale: captureAnim }] }}>
          {/* Pseudo camera feed - dark rect */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: captured ? '#1A2E1A' : '#111', borderRadius: 8, overflow: 'hidden' }}>
            {/* Simulated receipt lines */}
            {!captured && Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={{ height: 8, marginHorizontal: 20, marginTop: i === 0 ? 20 : 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
            ))}
            {captured && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 40 }}>📄</Text>
                <Text style={{ color: C.teal, fontSize: 12, fontWeight: '700', marginTop: 8 }}>Processing…</Text>
              </View>
            )}
          </View>

          {/* Scan line */}
          <ScanLine active={scanning} />

          {/* Corner brackets */}
          <CornerBrackets color={captured ? C.success : C.teal} size={28} thickness={3} />
        </Animated.View>

        {/* Instruction */}
        <View style={{ marginTop: 24, paddingHorizontal: 40, alignItems: 'center' }}>
          {countdown !== null ? (
            <Text style={{ color: C.teal, fontSize: 15, fontWeight: '700' }}>
              Navigating in {countdown}…
            </Text>
          ) : captured ? (
            <Text style={{ color: C.success, fontSize: 14, fontWeight: '700' }}>✓ Receipt captured</Text>
          ) : (
            <>
              <Text style={{ color: C.white, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                Position receipt inside the frame
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                Ensure good lighting for best OCR results
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Bottom controls */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, paddingHorizontal: 40, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Manual entry */}
          <TouchableOpacity onPress={() => navigation?.navigate('AddExpense')} style={{ alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 20 }}>✏️</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Manual</Text>
          </TouchableOpacity>

          {/* Shutter */}
          <TouchableOpacity onPress={handleCapture} disabled={captured} style={{ alignItems: 'center' }}>
            <View style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: captured ? C.success : C.white, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: captured ? C.success : C.white, alignItems: 'center', justifyContent: 'center' }}>
                {captured && <Text style={{ fontSize: 28, color: C.white }}>✓</Text>}
              </View>
            </View>
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity onPress={() => navigation?.navigate('UploadFromGallery')} style={{ alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 20 }}>🖼</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* OCR notice */}
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
            🔒 Receipt data processed locally · Not uploaded until saved
          </Text>
        </View>
      </View>
    </View>
  );
}
