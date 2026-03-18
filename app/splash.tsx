import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const PHASES = [
  { id: "boot", duration: 600 },
  { id: "logo", duration: 1400 },
  { id: "tagline", duration: 1000 },
  { id: "loader", duration: 1600 },
  { id: "ready", duration: 800 },
];

export default function SplashScreen() {
  const router = useRouter();

  const [phase, setPhase] = useState("boot");
  const [loaderW, setLoaderW] = useState(0);
  const [orbScale] = useState(new Animated.Value(1));

  // Animate orbs continuously
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, {
          toValue: 1.12,
          duration: 1100,
          useNativeDriver: false,
        }),
        Animated.timing(orbScale, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [orbScale]);

  // Phase sequencer
  useEffect(() => {
    setPhase("boot");
    setLoaderW(0);

    const timers: (number | NodeJS.Timeout)[] = [];
    let elapsed = 0;

    PHASES.forEach((p, i) => {
      elapsed += i === 0 ? 0 : PHASES[i - 1].duration;
      timers.push(setTimeout(() => setPhase(p.id), elapsed));
    });

    // Loader bar animation
    timers.push(
      setTimeout(
        () => {
          let w = 0;
          const step = setInterval(() => {
            w += Math.random() * 14 + 4;
            if (w >= 100) {
              w = 100;
              clearInterval(step);
            }
            setLoaderW(w);
          }, 80);
          timers.push(step);
        },
        PHASES[0].duration + PHASES[1].duration + PHASES[2].duration,
      ),
    );

    // Navigate to home after ready phase
    timers.push(
      setTimeout(
        () => {
          router.replace("/(tabs)");
        },
        PHASES.reduce((sum, p) => sum + p.duration, 0) + 500,
      ),
    );

    return () => timers.forEach((t) => clearTimeout(t));
  }, [router]);

  const visible = (p: string) =>
    phase === p ||
    PHASES.findIndex((x) => x.id === phase) >
      PHASES.findIndex((x) => x.id === p);

  const logoOpacity = visible("logo") ? 1 : 0.4;
  const taglineOpacity = visible("tagline") ? 1 : 0.4;
  const loaderOpacity = visible("loader") ? 1 : 0.2;
  const readyOpacity = phase === "ready" ? 1 : 0;

  const orbScaleInterpolated = orbScale.interpolate({
    inputRange: [1, 1.12],
    outputRange: [280, 320],
  });

  return (
    <ThemedView style={styles.container}>
      {/* Background gradient (solid fallback) */}
      <View style={styles.background} />

      {/* Animated orbs - simplified for React Native */}
      <Animated.View
        style={[
          styles.orbTop,
          {
            width: orbScaleInterpolated,
            height: orbScaleInterpolated,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbBottom,
          {
            width: orbScale.interpolate({
              inputRange: [1, 1.12],
              outputRange: [220, 260],
            }),
            height: orbScale.interpolate({
              inputRange: [1, 1.12],
              outputRange: [220, 260],
            }),
          },
        ]}
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                {
                  translateY: logoOpacity === 1 ? 0 : 24,
                },
              ],
            },
          ]}
        >
          <View style={styles.iconMedallion}>
            <Text style={styles.iconEmoji}>🧾</Text>
          </View>
          <Text style={styles.logoText}>MyExpense</Text>
        </Animated.View>

        {/* Tagline section */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
            },
          ]}
        >
          <Text style={styles.taglineSubtitle}>
            Automated tax deductions for
          </Text>
          <Text style={styles.taglineHighlight}>
            South Africa's self-employed
          </Text>
        </Animated.View>

        {/* Badges */}
        <Animated.View
          style={[
            styles.badgesContainer,
            {
              opacity: taglineOpacity,
            },
          ]}
        >
          {["SARS ITR12", "OCR Scanning", "Tax-Ready"].map((badge, i) => (
            <View key={i} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Loader section */}
        <Animated.View
          style={[
            styles.loaderContainer,
            {
              opacity: loaderOpacity,
            },
          ]}
        >
          <View style={styles.loaderTrack}>
            <View
              style={[
                styles.loaderBar,
                {
                  width: `${loaderW}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.loaderText}>
            {loaderW < 30
              ? "Initialising..."
              : loaderW < 60
                ? "Loading your profile..."
                : loaderW < 90
                  ? "Syncing tax categories..."
                  : "Ready"}
          </Text>
        </Animated.View>
      </View>

      {/* Version footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: taglineOpacity,
          },
        ]}
      >
        <Text style={styles.versionText}>
          Version 1.0.0 · MyExpense (PTY) Ltd · South Africa
        </Text>
      </Animated.View>

      {/* Ready overlay */}
      <Animated.View
        style={[
          styles.readyOverlay,
          {
            opacity: readyOpacity,
            pointerEvents: phase === "ready" ? "auto" : "none",
          },
        ]}
      >
        <View style={styles.readyCheckCircle}>
          <Text style={styles.readyCheckmark}>✓</Text>
        </View>
        <Text style={styles.readyTitle}>Ready</Text>
        <Text style={styles.readySubtitle}>Taking you to the app…</Text>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0D47A1",
  },
  orbTop: {
    position: "absolute",
    top: -80,
    right: -80,
    borderRadius: 999,
    backgroundColor: "rgba(59,191,173,0.08)",
  },
  orbBottom: {
    position: "absolute",
    bottom: 60,
    left: -60,
    borderRadius: 999,
    backgroundColor: "rgba(91,91,184,0.1)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconMedallion: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  iconEmoji: {
    fontSize: 42,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
  },
  taglineContainer: {
    alignItems: "center",
    marginBottom: 56,
  },
  taglineSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  taglineHighlight: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0288D1",
    letterSpacing: 0.2,
  },
  badgesContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 64,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "rgba(59,191,173,0.12)",
    borderWidth: 1,
    borderColor: "rgba(59,191,173,0.3)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: "#0288D1",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  loaderContainer: {
    width: "100%",
    maxWidth: 280,
  },
  loaderTrack: {
    width: "100%",
    height: 3,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 14,
  },
  loaderBar: {
    height: "100%",
    borderRadius: 100,
    backgroundColor: "#0288D1",
  },
  loaderText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  versionText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  readyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(26,26,92,0.95)",
  },
  readyCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0288D1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  readyCheckmark: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "700",
  },
  readyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  readySubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
});
