import { colour, radius, typography } from "@/tokens";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { OnboardingSlide } from "./types";

interface SlidesCarouselProps {
  slides: OnboardingSlide[];
  currentSlideIdx: number;
  animatingIn: boolean;
  orbPulsing: boolean;
  onSlideNext: () => void;
  onSlidePrev: () => void;
  onSkip: () => void;
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
    <View
      style={{
        flex: 1,
        backgroundColor: colour.white,
        flexDirection: "column",
      }}
    >
      {/* Skip button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 16,
          right: 22,
          marginTop: 10,
          zIndex: 10,
        }}
        onPress={onSkip}
      >
        <Text
          style={{
            color: colour.textDisabled,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          Skip
        </Text>
      </TouchableOpacity>

      {/* Logo */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 8,
          paddingHorizontal: 24,
        }}
      >
        <Image
          source={logoSource}
          style={{ width: "60%", height: 36 }}
          resizeMode="contain"
        />
      </View>

      {/* Slide content */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          justifyContent: "center",
          paddingVertical: 20,
        }}
        scrollEventThrottle={16}
      >
        {/* Emoji illustration */}
        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 32,
            backgroundColor: colour.primary50,
            borderWidth: 1.5,
            borderColor: colour.primary100,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <Text style={{ fontSize: 54 }}>{slide.emoji}</Text>
        </View>

        <Text
          style={{
            ...typography.h2,
            color: colour.text,
            marginBottom: 16,
          }}
        >
          {slide.headline}
        </Text>
        <Text
          style={{
            ...typography.bodyM,
            color: colour.textSub,
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          {slide.sub}
        </Text>

        {/* Stat pill (slide 0) */}
        {slide.stat && (
          <View
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.md,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: colour.primary100,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                color: colour.primary,
              }}
            >
              {slide.stat.value}
            </Text>
            <Text style={{ ...typography.bodyXS, color: colour.textHint }}>
              {slide.stat.label}
            </Text>
          </View>
        )}

        {/* Feature list (slides 1, 2) */}
        {slide.features && (
          <View style={{ marginTop: 20 }}>
            {slide.features.map((feature, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colour.primary50,
                    borderWidth: 1,
                    borderColor: colour.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colour.primary,
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </Text>
                </View>
                <Text style={{ ...typography.bodyM, color: colour.textSub }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Indicator dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 16,
          gap: 6,
        }}
      >
        {slides.slice(0, 3).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentSlideIdx ? 24 : 8,
              height: 4,
              borderRadius: 2,
              backgroundColor: colour.primary,
              opacity: i === currentSlideIdx ? 1 : 0.3,
            }}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}
      >
        {currentSlideIdx > 0 && (
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 15,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colour.white,
              borderWidth: 1.5,
              borderColor: colour.primary,
              marginHorizontal: 5,
            }}
            onPress={onSlidePrev}
            accessibilityRole="button"
            accessibilityLabel="Previous slide"
          >
            <Text
              style={{ ...typography.btnL, color: colour.primary, fontWeight: "600" }}
            >
              ← Back
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{
            flex: currentSlideIdx > 0 ? 2 : 1,
            paddingVertical: 15,
            borderRadius: radius.pill,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colour.primary,
            marginHorizontal: 5,
          }}
          onPress={onSlideNext}
          accessibilityRole="button"
          accessibilityLabel={
            currentSlideIdx < 2 ? "Next slide" : "Get started"
          }
        >
          <Text
            style={{ ...typography.btnL, color: colour.white, fontWeight: "800" }}
          >
            {currentSlideIdx < 2 ? "Next →" : "Get started →"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign in link */}
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ ...typography.bodyXS, color: colour.textDisabled }}>
          Already have an account?{" "}
          <Text style={{ color: colour.primary, fontWeight: "600" }}>
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}
