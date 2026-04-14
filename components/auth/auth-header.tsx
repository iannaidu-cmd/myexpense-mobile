import { colour, typography } from "@/tokens";
import { Text, View } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View
      style={{
        backgroundColor: colour.navyDark,
        paddingTop: 56,
        paddingBottom: 28,
        paddingHorizontal: 22,
        justifyContent: "flex-end",
      }}
    >
      <Text
        style={{
          ...typography.h3,
          color: colour.white,
          marginBottom: 8,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 21,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
