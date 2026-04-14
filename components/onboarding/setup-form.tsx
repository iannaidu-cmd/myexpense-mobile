import { colour, radius, space, typography } from "@/tokens";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { OnboardingData, WorkType } from "./types";

interface SetupFormProps {
  data: OnboardingData;
  workTypes: WorkType[];
  onChange: (updates: Partial<OnboardingData>) => void;
  onContinue: () => void;
  logoSource: number | { uri: string };
}

export function SetupForm({
  data,
  workTypes,
  onChange,
  onContinue,
  logoSource,
}: SetupFormProps) {
  const isValid = data.name.trim().length > 0 && data.workTypeIdx !== null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colour.surface1,
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: colour.white,
          paddingTop: 52,
          paddingBottom: 20,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: colour.surface2,
        }}
      >
        <Image
          source={logoSource}
          style={{ width: "55%", height: 32, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text
          style={{
            ...typography.h3,
            color: colour.text,
            marginBottom: 6,
          }}
        >
          Let's set you up
        </Text>
        <Text
          style={{
            ...typography.bodyM,
            color: colour.textSub,
            marginBottom: 16,
          }}
        >
          Just 3 quick steps — takes under a minute
        </Text>

        {/* Progress dots */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: i === 0 ? 24 : 8,
                height: 4,
                borderRadius: 2,
                backgroundColor: colour.primary,
                opacity: i === 0 ? 1 : 0.3,
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingVertical: 24,
          paddingHorizontal: 22,
        }}
        scrollEventThrottle={16}
      >
        {/* Name field */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colour.primary,
              marginBottom: 8,
            }}
          >
            YOUR NAME
          </Text>
          <TextInput
            value={data.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="e.g. Ian van der Merwe"
            style={{
              ...typography.bodyM,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colour.borderLight,
              paddingVertical: 13,
              paddingHorizontal: 16,
              color: colour.text,
              backgroundColor: colour.white,
            }}
            placeholderTextColor={colour.border}
          />
        </View>

        {/* Tax number field */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colour.primary,
              marginBottom: 8,
            }}
          >
            SARS TAX NUMBER{" "}
            <Text
              style={{ color: colour.textHint, fontWeight: "400" }}
            >
              (optional)
            </Text>
          </Text>
          <TextInput
            value={data.taxNumber}
            onChangeText={(taxNumber) => onChange({ taxNumber })}
            placeholder="e.g. 1234567890"
            style={{
              ...typography.bodyM,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colour.borderLight,
              paddingVertical: 13,
              paddingHorizontal: 16,
              color: colour.text,
              backgroundColor: colour.white,
            }}
            placeholderTextColor={colour.border}
          />
          <Text
            style={{
              fontSize: 11,
              color: colour.textHint,
              marginTop: 6,
              paddingLeft: 4,
            }}
          >
            Used to pre-fill your ITR12 export
          </Text>
        </View>

        {/* Work type selection */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colour.primary,
              marginBottom: 8,
            }}
          >
            HOW DO YOU WORK?
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            {workTypes.map((workType, i) => {
              const selected = data.workTypeIdx === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48%",
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    backgroundColor: selected ? colour.primary50 : colour.white,
                    borderColor: selected ? colour.primary : colour.surface2,
                  }}
                  onPress={() => onChange({ workTypeIdx: i })}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>
                    {workType.icon}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: selected ? colour.primary : colour.textSub,
                      textAlign: "center",
                    }}
                  >
                    {workType.label}
                  </Text>
                  {selected && (
                    <View
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: colour.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: colour.white,
                          fontSize: 10,
                          fontWeight: "800",
                        }}
                      >
                        ✓
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: colour.white,
          borderTopWidth: 1,
          borderTopColor: colour.surface2,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: colour.primary,
            borderRadius: radius.pill,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            opacity: isValid ? 1 : 0.5,
          }}
          onPress={onContinue}
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityLabel="Continue to next setup step"
        >
          <Text
            style={{ ...typography.btnL, color: colour.white, fontWeight: "800" }}
          >
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
