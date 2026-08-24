import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FOREIGN_INCOME_EXEMPTION, TFSA_ANNUAL_CAP } from "@/lib/taxRules";
import { colour, radius, space } from "@/tokens";
import React from "react";
import { ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fmtR = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function Card({
  icon,
  title,
  subtitle,
  appliesToMe,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  appliesToMe: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colour.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colour.borderLight,
        marginBottom: space.md,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: space.md, gap: space.md }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: colour.primary50,
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <IconSymbol name={icon as any} size={18} color={colour.accentDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colour.text }}>{title}</Text>
          <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1 }}>{subtitle}</Text>
        </View>
        <View style={{
          backgroundColor: appliesToMe ? colour.successBg : colour.surface2,
          borderRadius: radius.pill,
          paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{
            fontSize: 10, fontWeight: "700",
            color: appliesToMe ? colour.success : colour.textSub,
          }}>
            {appliesToMe ? "May apply" : "Unlikely to apply"}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ borderTopWidth: 1, borderTopColor: colour.borderLight, padding: space.md }}>
        {children}
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{
      backgroundColor: colour.noir, borderRadius: radius.sm,
      padding: space.md, marginTop: space.sm,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    }}>
      <Text style={{ fontSize: 12, color: colour.onNoir2, flex: 1, marginRight: 8 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "800", color: colour.primary }}>{value}</Text>
    </View>
  );
}

function Note({ text }: { text: string }) {
  return (
    <View style={{
      backgroundColor: colour.infoLight, borderRadius: radius.sm,
      padding: space.sm, marginTop: space.sm,
      flexDirection: "row", gap: space.xs, alignItems: "flex-start",
    }}>
      <IconSymbol name="info.circle.fill" size={13} color={colour.info} style={{ marginTop: 1 } as any} />
      <Text style={{ flex: 1, fontSize: 12, color: colour.info, lineHeight: 17 }}>{text}</Text>
    </View>
  );
}

export default function GovernmentConcessionsScreen() {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Government concessions"
        subtitle="Tax breaks explained simply"
        showBack
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13, color: colour.textSub, lineHeight: 20, marginBottom: space.lg }}>
          SARS offers a few special tax breaks. Here's what each one means in plain English — and whether it's likely to affect you as a freelancer.
        </Text>

        {/* S12C */}
        <Card
          icon="laptopcomputer"
          title="Write off big equipment faster"
          subtitle="Section 12C"
          appliesToMe={false}
        >
          <Text style={{ fontSize: 13, color: colour.text, lineHeight: 20 }}>
            If you buy heavy machinery for a manufacturing process, SARS lets you deduct most of the cost in the first year — instead of spreading it out over many years.
          </Text>
          <Fact label="Year 1 deduction" value="40% of cost" />
          <Note text="This is for factories and industrial equipment — not laptops, desks, or office gear. Most freelancers won't qualify." />
        </Card>

        {/* SBC */}
        <Card
          icon="building.2.fill"
          title="Lower tax rates for small companies"
          subtitle="Small Business Corporation (SBC)"
          appliesToMe={false}
        >
          <Text style={{ fontSize: 13, color: colour.text, lineHeight: 20 }}>
            Small registered companies (PTY Ltd or CC) with income under R20 million pay tax at lower rates than individuals — starting at 0% on the first portion of profit.
          </Text>
          <Fact label="First R95,750 of profit" value="0% tax" />
          <Note text="This only applies to registered companies, not sole proprietors. If you're freelancing as an individual, you're already on the correct individual tax table." />
        </Card>

        {/* S10(1)(o) */}
        <Card
          icon="globe"
          title="Working abroad tax break"
          subtitle="Section 10(1)(o)"
          appliesToMe={false}
        >
          <Text style={{ fontSize: 13, color: colour.text, lineHeight: 20 }}>
            If you're employed by a foreign company and spend more than 183 days outside South Africa in a year, up to R1.25 million of that income is tax-free in SA.
          </Text>
          <Fact label="Tax-free exemption limit" value={fmtR(FOREIGN_INCOME_EXEMPTION)} />
          <Note text="This only applies if you're physically working abroad for a foreign employer for most of the year. Freelancers based in SA don't qualify — nor does self-employed income." />
        </Card>

        {/* TFSA */}
        <Card
          icon="dollarsign.circle.fill"
          title="Tax-free savings account (TFSA)"
          subtitle="Save and grow money completely tax-free"
          appliesToMe
        >
          <Text style={{ fontSize: 13, color: colour.text, lineHeight: 20 }}>
            A TFSA is a savings account where all growth — interest, dividends, and investment gains — is completely tax-free. You don't pay a cent of tax on what you earn inside it.
          </Text>
          <Fact label="Maximum you can put in per year" value={fmtR(TFSA_ANNUAL_CAP)} />
          <View style={{ marginTop: space.sm, gap: space.xs }}>
            <Note text="Going over R36,000 in a tax year triggers a 40% penalty on the excess — SARS is strict about this." />
            <Note text="Unlike a retirement annuity, TFSA contributions are not a tax deduction. The benefit is on the growth, not the contribution. Don't log it as a business expense." />
          </View>
        </Card>

        {/* Footer note */}
        <View style={{
          backgroundColor: colour.noir, borderRadius: radius.md,
          padding: space.md, flexDirection: "row", gap: space.sm, alignItems: "flex-start",
        }}>
          <IconSymbol name="person.fill.checkmark" size={16} color={colour.primary} style={{ marginTop: 1 } as any} />
          <Text style={{ flex: 1, fontSize: 12, color: colour.onNoir2, lineHeight: 18 }}>
            Not sure if any of these apply to you? A registered SARS tax practitioner can check your situation in under an hour — it's usually worth it.
          </Text>
        </View>
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
