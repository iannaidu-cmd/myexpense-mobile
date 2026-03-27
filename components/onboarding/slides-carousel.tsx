import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import type { OnboardingSlide } from "./types";

// ─── SlidesCarousel ───────────────────────────────────────────────────────────
// FIX: White background throughout, navy/blue text, logo rendered as <Image>
// ─────────────────────────────────────────────────────────────────────────────

interface SlidesCarouselProps {
  slides: OnboardingSlide[];
  currentSlideIdx: number;
  animatingIn: boolean;
  orbPulsing: boolean;
  onSlideNext: () => void;
  onSlidePrev: () => void;
  onSkip: () => void;
  // FIX: was logoUri: string (base64 rendered as text)
  // Now logoSource accepts a require() asset reference
  logoSource: number | { uri: string };
}

export function SlidesCarousel({
  slides,
  currentSlideIdx,
  animatingIn,
  orbPulsing,
  onSlideNext,
  onSlidePrev,
  onSkip,
  logoSource,
}: SlidesCarouselProps) {
  const slide = slides[currentSlideIdx];

  return (
    <View style={styles.container}>

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <ThemedText style={styles.skipText}>Skip</ThemedText>
      </TouchableOpacity>

      {/* Logo — FIX: was <ThemedText>{logoUri}</ThemedText>, now proper Image */}
      <View style={styles.logoContainer}>
        <Image
          source={logoSource}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Slide content */}
      <ScrollView
        contentContainerStyle={styles.slideContent}
        scrollEventThrottle={16}
      >
        {/* Emoji illustration box */}
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
          accessibilityLabel={currentSlideIdx < 2 ? "Next slide" : "Get started"}
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
  // FIX: was backgroundColor: "#0D47A1" — now white
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },
  skipButton: {
    position: "absolute",
    top: 16,
    right: 22,
    marginTop: 10,
    zIndex: 10,
  },
  // FIX: was color: "#757575" on dark bg — now mid-grey on white works fine
  skipText: {
    color: "#9E9E9E",
    fontSize: 13,
    fontWeight: "600",
  },
  logoContainer: {
    paddingTop: 52,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  // FIX: was fontSize:28 text rendering base64 — now proper image dimensions
  logoImage: {
    width: "60%",
    height: 36,
  },
  slideContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingVertical: 20,
  },
  // FIX: was backgroundColor: "#1565C0" (dark) — now light primary blue tint
  emojiBox: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "#EAF2FF",
    borderWidth: 1.5,
    borderColor: "#B4D8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  emojiLarge: {
    fontSize: 54,
  },
  // FIX: was color: "#fff" on dark bg — now navy on white
  headline: {
    color: "#1F2024",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 16,
  },
  // FIX: was color: "#9E9E9E" on dark bg — now proper mid-grey on white
  subtitle: {
    color: "#494A50",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
  },
  // FIX: was backgroundColor: "#1565C0" (dark pill) — now light blue tint
  statPill: {
    backgroundColor: "#EAF2FF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#B4D8FF",
    alignSelf: "flex-start",
  },
  statValue: {
    color: "#006FFD",
    fontSize: 26,
    fontWeight: "800",
  },
  statLabel: {
    color: "#71727A",
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
  // FIX: was backgroundColor: "#1565C0" (dark) — now light blue tint
  featureCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#006FFD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkmark: {
    fontSize: 13,
    color: "#006FFD",
    fontWeight: "700",
  },
  featureText: {
    color: "#494A50",
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
    backgroundColor: "#006FFD",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  // FIX: was backgroundColor: "#1565C0" (dark) — now light border button
  backButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#006FFD",
    marginHorizontal: 5,
  },
  backButtonText: {
    color: "#006FFD",
    fontWeight: "600",
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#006FFD",
    marginHorizontal: 5,
  },
  nextButtonExpanded: {
    flex: 2,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  signInContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  signInText: {
    color: "#9E9E9E",
    fontSize: 12,
  },
  signInLink: {
    color: "#006FFD",
    fontWeight: "600",
  },
});
