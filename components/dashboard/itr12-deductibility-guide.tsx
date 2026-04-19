import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

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
    color: colour.primary,
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
    color: colour.info,
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
    color: colour.danger,
    summary: "Only 50% of qualifying meals may be deducted.",
    content:
      "Entertainment expenses, including business meals, are only 50% deductible under Section 11(a) read with Section 23(b). The meal must have a clear business purpose and a business associate must be present.",
    examples: [
      "Client lunch/dinner — 50% only",
      "Team meals with business purpose",
      "Conference catering",
    ],
  },
  {
    title: "Home office deduction",
    icon: "🏠",
    color: colour.teal,
    summary: "Claim a proportional share of home costs if you work from home.",
    content:
      "If you use part of your home exclusively and regularly for your trade, you may deduct a proportion of home expenses based on the floor area used. The home office must be specifically fitted out for business.",
    examples: [
      "Proportional rent / bond interest",
      "Pro-rata electricity",
      "Pro-rata rates & levies",
      "Dedicated internet line",
    ],
  },
  {
    title: "Home office — Bond interest",
    icon: "🏦",
    color: colour.teal,
    summary:
      "Claim the interest portion of your bond, proportional to office floor area.",
    content:
      "Sole proprietors and freelancers may deduct the proportional interest portion of their home bond — not the capital repayment. The calculation is: (Office m² ÷ Total floor m²) × Annual bond interest paid. The workspace must be dedicated exclusively and regularly to your trade. Your bank will provide a statement showing the interest vs capital split for the year.",
    examples: [
      "Bond interest × (office m² ÷ total m²)",
      "Not the capital repayment portion",
      "Workspace must be exclusive to business",
      "Floor plan needed to substantiate ratio",
    ],
  },
  {
    title: "Home office — Rent",
    icon: "🔑",
    color: colour.teal,
    summary:
      "Renters can claim a proportional share of annual rent for a dedicated workspace.",
    content:
      "If you rent your home and use part of it exclusively and regularly for trade, you may deduct a proportional portion of your annual rent. The calculation is: (Office m² ÷ Total floor m²) × Annual rent paid. The space must be used exclusively for business — not a dual-purpose room.",
    examples: [
      "Annual rent × (office m² ÷ total m²)",
      "Lease agreement required",
      "Workspace must be exclusive to business",
      "Monthly bank statements as supporting proof",
    ],
  },
  {
    title: "What you cannot deduct",
    icon: "🚫",
    color: colour.warning,
    summary: "Private and domestic expenses are explicitly excluded.",
    content:
      "Section 23(a) prohibits the deduction of private or domestic expenditure. This includes groceries, clothing (unless protective), personal insurance, gym membership, home improvements not related to the business.",
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colour.background }}>

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 24,
          backgroundColor: colour.primary,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Pressable style={{ padding: 4 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 22 }}>
              ←
            </Text>
          </Pressable>
          <Text
            style={{ ...typography.labelM, color: colour.white, marginLeft: 8 }}
          >
            MyExpense
          </Text>
        </View>
        <Text
          style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}
        >
          Deductibility Guide
        </Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)" }}>
          Section 11(a) rules explained for South African freelancers
        </Text>
      </View>

      {/* Disclaimer */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          backgroundColor: colour.primary50,
          borderWidth: 1.5,
          borderColor: colour.borderLight,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            ...typography.bodyXS,
            color: colour.textSub,
            lineHeight: 18,
          }}
        >
          📋 <Text style={{ fontWeight: "700" }}>Note:</Text> This guide is for
          educational purposes only. Always consult a registered SARS tax
          practitioner for personalised advice.
        </Text>
      </View>

      {/* Quick check card */}
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: colour.white,
          borderRadius: radius.lg,
          overflow: "hidden",
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colour.border,
        }}
      >
        <View
          style={{
            backgroundColor: colour.primary,
            paddingVertical: 12,
            paddingHorizontal: 18,
          }}
        >
          <Text style={{ ...typography.labelM, color: colour.white }}>
            Quick Deductibility Check
          </Text>
        </View>
        <View style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
          {[
            "Was it incurred to earn income?",
            "Is it not private or domestic?",
            "Is it not capital expenditure?",
            "Do you have a receipt/invoice?",
          ].map((q, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 9,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: colour.surface1,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colour.tealLight,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colour.info,
                  }}
                />
              </View>
              <Text
                style={{ ...typography.bodyS, color: colour.text, flex: 1 }}
              >
                {q}
              </Text>
              <Text
                style={{
                  ...typography.micro,
                  fontWeight: "700",
                  color: colour.info,
                }}
              >
                REQUIRED
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Accordion sections */}
      {sections.map((sec, i) => (
        <View
          key={i}
          style={{
            marginHorizontal: 20,
            backgroundColor: colour.white,
            borderRadius: radius.md,
            marginBottom: 10,
            borderWidth: 1.5,
            borderColor: expanded === i ? sec.color : colour.border,
            overflow: "hidden",
          }}
        >
          <Pressable
            onPress={() => setExpanded(expanded === i ? null : i)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.sm,
                backgroundColor: sec.color + "18",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: 18 }}>{sec.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.labelM, color: colour.primary }}>
                {sec.title}
              </Text>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.textSub,
                  marginTop: 2,
                }}
              >
                {sec.summary}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: colour.textSub }}>
              {expanded === i ? "−" : "›"}
            </Text>
          </Pressable>

          {expanded === i && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 16,
                borderTopWidth: 1,
                borderTopColor: colour.surface1,
              }}
            >
              <Text
                style={{
                  ...typography.bodyS,
                  color: colour.textSub,
                  lineHeight: 20,
                  paddingTop: 12,
                  marginBottom: 12,
                }}
              >
                {sec.content}
              </Text>
              <Text
                style={{
                  ...typography.labelS,
                  color: colour.primary,
                  marginBottom: 8,
                }}
              >
                EXAMPLES:
              </Text>
              {sec.examples.map((ex, j) => (
                <View
                  key={j}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: sec.color,
                      flexShrink: 0,
                    }}
                  />
                  <Text style={{ ...typography.bodyS, color: colour.primary }}>
                    {ex}
                  </Text>
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
