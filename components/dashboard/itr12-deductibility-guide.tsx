import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface DeductibilitySection {
  title: string;
  icon: string;
  color: string;
  summary: string;
  content: string;
  examples: string[];
}

interface ITR12DeductibilityGuideProps {
  sections?: DeductibilitySection[];
}

const DEFAULT_SECTIONS: DeductibilitySection[] = [
  {
    title: "Section 11(a) — General deductions",
    icon: "📘",
    color: "#1565C0",
    summary: "The main deduction rule for sole proprietors and freelancers.",
    content:
      "Section 11(a) of the Income Tax Act allows you to deduct expenditure and losses actually incurred in the production of income, provided they are not of a capital nature. This covers most day-to-day business expenses including software, professional services, office supplies, and travel directly related to earning income.",
    examples: [
      "Software subscriptions",
      "Professional services",
      "Office stationery",
      "Business phone & internet",
    ],
  },
  {
    title: "Travel & transport deductions",
    icon: "🚗",
    color: "#0288D1",
    summary: "Business travel is deductible. Personal travel is not.",
    content:
      "You may deduct travel expenses incurred in the course of your trade. Keep a logbook recording the date, destination, purpose and distance of each business trip. SARS requires a logbook for all travel deduction claims. The fixed-cost table rate or actual-cost method may be used.",
    examples: [
      "Client visits",
      "Business errands",
      "Uber/Bolt for work trips",
      "Parking at client sites",
    ],
  },
  {
    title: "Meals & entertainment (50% rule)",
    icon: "🍽️",
    color: "#E07060",
    summary: "Only 50% of qualifying meals may be deducted.",
    content:
      "Entertainment expenses, including business meals, are only 50% deductible under Section 11(a) read with Section 23(b). The meal must have a clear business purpose and a business associate must be present. Personal meals with family or friends do not qualify.",
    examples: [
      "Client lunch/dinner — 50% only",
      "Team meals with business purpose",
      "Conference catering",
    ],
  },
  {
    title: "Home office deduction",
    icon: "🏠",
    color: "#0288D1",
    summary: "Claim a proportional share of home costs if you work from home.",
    content:
      "If you use part of your home exclusively and regularly for your trade, you may deduct a proportion of home expenses (rent/bond interest, electricity, rates) based on the floor area used. The home office must be specifically fitted out for business and not used for personal purposes.",
    examples: [
      "Proportional rent / bond interest",
      "Pro-rata electricity",
      "Pro-rata rates & levies",
      "Dedicated internet line",
    ],
  },
  {
    title: "What you cannot deduct",
    icon: "🚫",
    color: "#E05555",
    summary: "Private and domestic expenses are explicitly excluded.",
    content:
      "Section 23(a) prohibits the deduction of private or domestic expenditure. This includes groceries, clothing (unless protective), personal insurance, gym membership, home improvements not related to the business, and entertainment that is not directly business-related.",
    examples: [
      "Groceries & personal food",
      "Personal clothing",
      "Gym or lifestyle costs",
      "School fees or childcare",
    ],
  },
];

export function ITR12DeductibilityGuideScreen({
  sections = DEFAULT_SECTIONS,
}: ITR12DeductibilityGuideProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const backgroundColor = useThemeColor({}, "background");

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <ThemedText style={styles.headerTitle}>MyExpense</ThemedText>
        </View>
        <ThemedText style={styles.headerMain}>Deductibility Guide</ThemedText>
        <ThemedText style={styles.headerSub}>
          Section 11(a) rules explained for South African freelancers
        </ThemedText>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <ThemedText style={styles.disclaimerText}>
          📋 <Text style={{ fontWeight: "700" }}>Note:</Text> This guide is for
          educational purposes only. Always consult a registered SARS tax
          practitioner for personalised advice.
        </ThemedText>
      </View>

      {/* Quick deductibility check */}
      <View style={styles.checkCard}>
        <View style={styles.checkCardHeader}>
          <Text style={styles.checkCardTitle}>Quick Deductibility Check</Text>
        </View>
        <View style={styles.checkCardContent}>
          {[
            "Was it incurred to earn income?",
            "Is it not private or domestic?",
            "Is it not capital expenditure?",
            "Do you have a receipt/invoice?",
          ].map((q, i) => (
            <View key={i} style={styles.checkItem}>
              <View style={styles.checkCircle}>
                <View style={styles.checkDot} />
              </View>
              <ThemedText style={styles.checkQuestion}>{q}</ThemedText>
              <Text style={styles.checkRequired}>REQUIRED</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Accordion sections */}
      {sections.map((sec, i) => (
        <View
          key={i}
          style={[
            styles.sectionCard,
            {
              borderColor: expanded === i ? sec.color : "#E0E0E0",
            },
          ]}
        >
          <Pressable
            onPress={() => setExpanded(expanded === i ? null : i)}
            style={styles.sectionHeader}
          >
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: sec.color + "18" },
              ]}
            >
              <Text style={styles.sectionIconText}>{sec.icon}</Text>
            </View>
            <View style={styles.sectionTitleContent}>
              <ThemedText style={styles.sectionTitle}>{sec.title}</ThemedText>
              <Text style={styles.sectionSummary}>{sec.summary}</Text>
            </View>
            <Text
              style={[
                styles.sectionArrow,
                {
                  transform: expanded === i ? "rotate(90deg)" : "rotate(0deg)",
                },
              ]}
            >
              ›
            </Text>
          </Pressable>

          {expanded === i && (
            <View style={styles.sectionContent}>
              <ThemedText style={styles.sectionContentText}>
                {sec.content}
              </ThemedText>
              <Text style={styles.examplesLabel}>EXAMPLES:</Text>
              {sec.examples.map((ex, j) => (
                <View key={j} style={styles.exampleItem}>
                  <View
                    style={[styles.exampleDot, { backgroundColor: sec.color }]}
                  />
                  <ThemedText style={styles.exampleText}>{ex}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "#1565C0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#fff",
  },
  headerMain: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  disclaimer: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "rgba(21,101,192,0.05)",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#757575",
    lineHeight: 1.5,
  },
  checkCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
  },
  checkCardHeader: {
    backgroundColor: "#1565C0",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  checkCardTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  checkCardContent: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(59,191,173,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0288D1",
  },
  checkQuestion: {
    fontSize: 12,
    flexGrow: 1,
  },
  checkRequired: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0288D1",
  },
  sectionCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionIconText: {
    fontSize: 18,
  },
  sectionTitleContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0D47A1",
    lineHeight: 1.2,
  },
  sectionSummary: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  sectionArrow: {
    fontSize: 16,
    color: "#757575",
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  sectionContentText: {
    paddingTop: 12,
    fontSize: 12,
    color: "#757575",
    lineHeight: 1.6,
    marginBottom: 12,
  },
  examplesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 8,
  },
  exampleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  exampleText: {
    fontSize: 12,
    color: "#0D47A1",
  },
});
