import { ThemedText } from "@/components/themed-text";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { OnboardingSlide } from "./types";

interface SlidesCarouselProps {
  slides: OnboardingSlide[];
  currentSlideIdx: number;
  animatingIn: boolean;
  orbPulsing: boolean;
  onSlideNext: () => void;
  onSlidePrev: () => void;
  onSkip: () => void;
  logoUri: string;
}

export function SlidesCarousel({
  slides,
  currentSlideIdx,
  animatingIn,
  orbPulsing,
  onSlideNext,
  onSlidePrev,
  onSkip,
  logoUri,
}: SlidesCarouselProps) {
  const slide = slides[currentSlideIdx];

  return (
    <View style={styles.container}>
      {/* Animated background orbs */}
      <View
        style={[
          styles.orb1,
          {
            opacity: orbPulsing ? 0.08 : 0.04,
            transform: orbPulsing ? [{ scale: 1.2 }] : [{ scale: 1 }],
          },
        ]}
      />
      <View
        style={[
          styles.orb2,
          {
            opacity: orbPulsing ? 0.06 : 0.02,
            transform: orbPulsing ? [{ scale: 1.1 }] : [{ scale: 1 }],
          },
        ]}
      />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <ThemedText style={styles.skipText}>Skip</ThemedText>
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <ThemedText style={styles.logo}>{slide.emoji}</ThemedText>
      </View>

      {/* Slide content */}
      <ScrollView
        contentContainerStyle={styles.slideContent}
        scrollEventThrottle={16}
      >
        {/* Big emoji illustration */}
        <View style={styles.emojiBox}>
          <ThemedText style={styles.emojiLarge}>{slide.emoji}</ThemedText>
        </View>

        <ThemedText style={styles.headline}>{slide.headline}</ThemedText>
        <ThemedText style={styles.subtitle}>{slide.sub}</ThemedText>

        {/* Stat pill (slide 0) */}
        {slide.stat && (
          <View style={styles.statPill}>
            <ThemedText style={styles.statValue}>{slide.stat.value}</ThemedText>
            <ThemedText style={styles.statLabel}>{slide.stat.label}</ThemedText>
          </View>
        )}

        {/* Feature list (slides 1, 2) */}
        {slide.features && (
          <View style={styles.featuresList}>
            {slide.features.map((feature, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.featureCheckmark}>
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                </View>
                <ThemedText style={styles.featureText}>{feature}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Indicator dots */}
      <View style={styles.dotsContainer}>
        {slides.slice(0, 3).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === currentSlideIdx ? 24 : 8,
                opacity: i === currentSlideIdx ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        {currentSlideIdx > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onSlidePrev}
            accessibilityRole="button"
            accessibilityLabel="Previous slide"
          >
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            currentSlideIdx > 0 && styles.nextButtonExpanded,
          ]}
          onPress={onSlideNext}
          accessibilityRole="button"
          accessibilityLabel={
            currentSlideIdx < 2 ? "Next slide" : "Get started"
          }
        >
          <ThemedText style={styles.nextButtonText}>
            {currentSlideIdx < 2 ? "Next →" : "Get Started →"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Sign in link */}
      <View style={styles.signInContainer}>
        <ThemedText style={styles.signInText}>
          Already have an account?{" "}
          <ThemedText style={styles.signInLink}>Sign in</ThemedText>
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D47A1",
    position: "relative",
    overflow: "hidden",
    flexDirection: "column",
  },
  orb1: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#0288D1",
  },
  orb2: {
    position: "absolute",
    bottom: 160,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#0288D1",
  },
  skipButton: {
    position: "absolute",
    top: 16,
    right: 22,
    marginTop: 10,
  },
  skipText: {
    color: "#757575",
    fontSize: 13,
    fontWeight: "600",
  },
  logoContainer: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 28,
    height: 28,
  },
  slideContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingVertical: 20,
  },
  emojiBox: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "#1565C0",
    borderWidth: 1.5,
    borderColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  emojiLarge: {
    fontSize: 54,
  },
  headline: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 16,
  },
  subtitle: {
    color: "#9E9E9E",
    fontSize: 14,
    marginBottom: 32,
  },
  statPill: {
    backgroundColor: "#1565C0",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#0288D1",
    alignSelf: "flex-start",
  },
  statValue: {
    color: "#0288D1",
    fontSize: 26,
    fontWeight: "800",
  },
  statLabel: {
    color: "#757575",
    fontSize: 11,
  },
  featuresList: {
    marginTop: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1565C0",
    borderWidth: 1,
    borderColor: "#0288D1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkmark: {
    fontSize: 13,
    color: "#0288D1",
    fontWeight: "700",
  },
  featureText: {
    color: "#9E9E9E",
    fontSize: 14,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0288D1",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1565C0",
    borderWidth: 1.5,
    borderColor: "#1976D2",
    marginHorizontal: 5,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0288D1",
    marginHorizontal: 5,
  },
  nextButtonExpanded: {
    flex: 2,
  },
  nextButtonText: {
    color: "#0D47A1",
    fontWeight: "800",
    fontSize: 15,
  },
  signInContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  signInText: {
    color: "#757575",
    fontSize: 12,
  },
  signInLink: {
    color: "#0288D1",
    fontWeight: "600",
  },
});
