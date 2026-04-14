import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colour } from "@/tokens";

// ─── Colour aliases mapped to design tokens ───────────────────────────────────
const C = {
  navy: colour.primary,
  navyDark: colour.navyDark,
  teal: colour.teal,
  midNavy: colour.midNavy2,
  midNavy2: colour.midNavy2,
  bgLight: colour.surface2,
  bgLighter: colour.background,
  white: colour.white,
  text: colour.text,
  textSub: colour.textSub,
  border: colour.borderLight,
  success: colour.success,
  warning: colour.warning,
  danger: colour.danger,
};

const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({
  children,
  activeTab = "Settings",
  navigation,
}: {
  children: React.ReactNode;
  activeTab?: string;
  navigation?: any;
}) {
  const tabs = [
    { key: "Home", label: "Home", icon: NAV.Home },
    { key: "Scan", label: "Scan", icon: NAV.Scan },
    { key: "Reports", label: "Reports", icon: NAV.Reports },
    { key: "Settings", label: "Settings", icon: NAV.Settings },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 8,
          paddingTop: 6,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => navigation?.navigate(t.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 20,
                color: activeTab === t.key ? C.teal : C.textSub,
              }}
            >
              {t.icon}
            </Text>
            <Text
              style={{
                fontSize: 10,
                marginTop: 2,
                color: activeTab === t.key ? C.teal : C.textSub,
                fontWeight: activeTab === t.key ? "700" : "400",
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.white,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{ flex: 1, fontSize: 13, fontWeight: "600", color: C.text }}
        >
          {question}
        </Text>
        <Text style={{ color: C.midNavy2, fontSize: 18, fontWeight: "300" }}>
          {open ? "∨" : "›"}
        </Text>
      </View>
      {open && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 14,
            backgroundColor: C.bgLighter,
          }}
        >
          <Text style={{ fontSize: 13, color: C.textSub, lineHeight: 20 }}>
            {answer}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({
  icon,
  label,
  value,
  sublabel,
  onPress,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  sublabel?: string;
  onPress?: () => void;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: highlight ? C.navy : C.white,
        borderRadius: 14,
        padding: 16,
        borderWidth: highlight ? 0 : 1,
        borderColor: C.border,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 26, marginBottom: 8 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: highlight ? C.white : C.text,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: highlight ? C.teal : C.teal,
          fontWeight: "600",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
      {sublabel ? (
        <Text
          style={{
            fontSize: 10,
            color: C.textSub,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {sublabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── SCREEN: Help & Support ───────────────────────────────────────────────────
export default function HelpSupportScreen({
  navigation,
}: {
  navigation?: any;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSent, setTicketSent] = useState(false);

  const categories = [
    "Billing",
    "Technical",
    "ITR12 / SARS",
    "Account",
    "Other",
  ];

  const faqs = [
    {
      question: "How does OCR receipt scanning work?",
      answer:
        "Point your camera at any paper or digital receipt. MyExpense uses optical character recognition (OCR) to extract the vendor name, amount, date, and VAT number automatically. You can review and correct any field before saving.",
    },
    {
      question: "Which ITR12 categories does MyExpense support?",
      answer:
        "MyExpense supports all Section 11(a) and related deductible expense categories including travel, home office, equipment, professional fees, utilities, software, and more. Each category is mapped directly to the relevant ITR12 line.",
    },
    {
      question: "How do I claim a home office deduction?",
      answer:
        'Navigate to Add Expense and select the "Home Office" category. Enter the expenses attributable to your workspace. MyExpense will calculate the deductible portion based on the floor area ratio you set in your profile.',
    },
    {
      question: "Can I export data for my accountant?",
      answer:
        "Yes. Go to Reports > Spending by Category and tap Export. You can export as CSV, PDF summary, or ITR12-formatted report. You can also share access via the accountant portal in Settings > Subscription (Pro+ only).",
    },
    {
      question: "How long should I keep receipts?",
      answer:
        "SARS requires you to retain supporting documentation for 5 years from the date of submission of the relevant return. MyExpense stores all your receipts securely and reminds you when documents approach their retention limit.",
    },
    {
      question: "Is my financial data secure?",
      answer:
        "All data is encrypted at rest using AES-256 and in transit using TLS 1.3. We are POPIA compliant and never sell your data. You can delete your account and all associated data at any time from Settings > Data & Privacy.",
    },
    {
      question: "What is the difference between Pro and Pro+ plans?",
      answer:
        "Pro includes unlimited expenses, OCR scanning, full ITR12 categories, and reports. Pro+ adds VAT tracking, VAT201 generation, client invoicing, an accountant collaboration portal, and API access for integration with Xero and Sage.",
    },
  ];

  const filtered = searchQuery.trim()
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : faqs;

  return (
    <PhoneShell activeTab="Settings" navigation={navigation}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 52,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={{ marginBottom: 10 }}
        >
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Settings</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: C.teal,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
          }}
        >
          SETTINGS
        </Text>
        <Text
          style={{
            color: C.white,
            fontSize: 22,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Help & Support
        </Text>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.navyDark,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginTop: 16,
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 10 }}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search FAQs..."
            placeholderTextColor={C.textSub}
            style={{ flex: 1, color: C.white, fontSize: 14 }}
          />
        </View>
      </View>

      <View
        style={{
          backgroundColor: C.bgLighter,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingBottom: 30,
        }}
      >
        {/* Contact Options */}
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 12,
            }}
          >
            Contact Us
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            <ContactCard
              icon="💬"
              label="Live chat"
              value="Chat now"
              sublabel="Avg. response: 2 min"
              onPress={() => {}}
              highlight
            />
            <ContactCard
              icon="📧"
              label="Email"
              value="support@"
              sublabel="Replies within 24h"
              onPress={() => {}}
            />
            <ContactCard
              icon="📚"
              label="Docs"
              value="Read guides"
              sublabel="Step-by-step"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Quick Links */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                "Getting Started",
                "ITR12 Guide",
                "OCR Tips",
                "Billing",
                "Video Tutorials",
              ].map((link) => (
                <TouchableOpacity
                  key={link}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: C.navy,
                  }}
                >
                  <Text
                    style={{ color: C.white, fontSize: 12, fontWeight: "600" }}
                  >
                    {link}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* FAQs */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          Frequently asked questions{" "}
          {filtered.length < faqs.length ? `(${filtered.length} results)` : ""}
        </Text>
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((faq, i) => <FAQItem key={i} {...faq} />)
          ) : (
            <View
              style={{
                padding: 24,
                alignItems: "center",
                backgroundColor: C.white,
              }}
            >
              <Text style={{ fontSize: 22 }}>🔍</Text>
              <Text style={{ fontSize: 13, color: C.textSub, marginTop: 8 }}>
                No FAQs match "{searchQuery}"
              </Text>
            </View>
          )}
        </View>

        {/* Submit a Ticket */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textSub,
            letterSpacing: 0.8,
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 8,
          }}
        >
          Submit a support ticket
        </Text>
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 16,
          }}
        >
          {ticketSent ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ fontSize: 36 }}>✅</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: C.success,
                  marginTop: 12,
                }}
              >
                Ticket Submitted!
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: C.textSub,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                We'll respond to ian@myexpense.co.za within 24 hours.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTicketSent(false);
                  setTicketMessage("");
                  setTicketCategory("");
                }}
                style={{ marginTop: 16 }}
              >
                <Text
                  style={{ color: C.teal, fontSize: 13, fontWeight: "600" }}
                >
                  Submit Another
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.textSub,
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Category
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setTicketCategory(cat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor:
                        ticketCategory === cat ? C.navy : C.bgLight,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: ticketCategory === cat ? C.white : C.textSub,
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.textSub,
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Describe your issue
              </Text>
              <TextInput
                value={ticketMessage}
                onChangeText={setTicketMessage}
                placeholder="Tell us what's happening..."
                placeholderTextColor={C.textSub}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 13,
                  color: C.text,
                  minHeight: 100,
                }}
              />
              <TouchableOpacity
                onPress={() =>
                  ticketMessage.trim() && ticketCategory && setTicketSent(true)
                }
                style={{
                  marginTop: 14,
                  backgroundColor:
                    ticketMessage.trim() && ticketCategory ? C.teal : C.bgLight,
                  borderRadius: 10,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      ticketMessage.trim() && ticketCategory
                        ? C.white
                        : C.textSub,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Send Ticket
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App Status */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: C.white,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: C.success,
              marginRight: 10,
            }}
          />
          <Text
            style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: "600" }}
          >
            All Systems Operational
          </Text>
          <TouchableOpacity>
            <Text style={{ color: C.teal, fontSize: 12, fontWeight: "600" }}>
              Status Page ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </PhoneShell>
  );
}
