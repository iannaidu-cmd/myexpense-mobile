import { InfoBanner } from "@/components/InfoBanner";
import { MXHeader } from "@/components/MXHeader";
import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  FOREIGN_CONTINUOUS_DAYS,
  FOREIGN_DAYS_REQUIRED,
  FOREIGN_INCOME_EXEMPTION,
  SBC_BRACKETS,
  SBC_TURNOVER_LIMIT,
  TFSA_ANNUAL_CAP,
  TFSA_LIFETIME_CAP,
} from "@/lib/taxRules";
import { colour, radius, space } from "@/tokens";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const fmtR = (n: number) =>
  `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ── Collapsible section ────────────────────────────────────────────────────────
function Section({
  icon,
  title,
  badge,
  children,
}: {
  icon: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View
      style={{
        backgroundColor: colour.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colour.borderLight,
        overflow: "hidden",
        marginBottom: space.md,
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: space.md,
          gap: space.md,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colour.primary50,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconSymbol name={icon as any} size={16} color={colour.accentDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colour.text }}>
            {title}
          </Text>
          {badge ? (
            <Text style={{ fontSize: 11, color: colour.textSub, marginTop: 1 }}>
              {badge}
            </Text>
          ) : null}
        </View>
        <IconSymbol
          name={open ? "chevron.up" : "chevron.down"}
          size={14}
          color={colour.textSub}
        />
      </TouchableOpacity>
      {open && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colour.borderLight,
            padding: space.md,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: colour.borderLight,
      }}
    >
      <Text style={{ fontSize: 12, color: colour.textSub, flex: 1, marginRight: 8 }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: highlight ? colour.primary : colour.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colour.primary,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <Text style={{ flex: 1, fontSize: 12, color: colour.text, lineHeight: 18 }}>
        {text}
      </Text>
    </View>
  );
}

function Noir({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colour.noir,
        borderRadius: radius.sm,
        padding: space.md,
        marginTop: space.sm,
      }}
    >
      {children}
    </View>
  );
}

export default function GovernmentConcessionsScreen() {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colour.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />
      <MXHeader
        title="Government concessions"
        subtitle="S12C · SBC · S10(1)(o) · TFSA"
        showBack
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <InfoBanner
          icon="lightbulb.fill"
          body="These concessions reduce your tax burden significantly if you qualify. Each has strict criteria — if unsure, confirm with a registered tax practitioner before claiming."
          style={{ marginBottom: space.xl }}
        />

        {/* ── S12C Accelerated Depreciation ─────────────────────────────── */}
        <Section
          icon="laptopcomputer"
          title="S12C — Accelerated depreciation"
          badge="Manufacturing plant & machinery"
        >
          <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 18, marginBottom: space.md }}>
            Section 12C allows accelerated write-off of plant and machinery used in the process of manufacture or a similar process.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginBottom: 6 }}>
            WRITE-OFF SCHEDULE
          </Text>
          <Noir>
            {[
              { year: "Year 1",    pct: "40%",  note: "of cost" },
              { year: "Year 2",    pct: "20%",  note: "" },
              { year: "Year 3–7",  pct: "8%",   note: "per year (5 years)" },
            ].map((r) => (
              <View key={r.year} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: colour.onNoir2 }}>{r.year}</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colour.primary }}>
                  {r.pct}{r.note ? ` — ${r.note}` : ""}
                </Text>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 8 }} />
            <Text style={{ fontSize: 11, color: colour.onNoir2 }}>
              Totals 100% over 7 years. Both new and used assets qualify.
            </Text>
          </Noir>

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            WHO QUALIFIES
          </Text>
          <Bullet text="Taxpayer carries on a process of manufacture or similar process" />
          <Bullet text="Asset is machinery or plant owned by the taxpayer" />
          <Bullet text="Asset is used in that process — not used for retail, admin, or storage" />
          <Bullet text="Does NOT apply to passenger vehicles, office furniture, or buildings" />

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            HOW TO CLAIM
          </Text>
          <Bullet text='Capture in MyExpense under "Equipment & Tools" with the full purchase price' />
          <Bullet text="On your ITR12, claim under Wear & Tear/Depreciation — select the S12C rate schedule" />
          <Bullet text="Keep purchase invoice, proof of use in manufacturing" />
        </Section>

        {/* ── SBC Tax Rates ─────────────────────────────────────────────── */}
        <Section
          icon="building.2.fill"
          title="SBC — Small Business Corporation"
          badge={`Qualifying turnover under ${fmtR(SBC_TURNOVER_LIMIT)}`}
        >
          <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 18, marginBottom: space.md }}>
            SBCs benefit from a progressive tax table (lower rates than individuals) and accelerated asset write-offs (S12E). You must elect SBC status on your ITR14 company return.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginBottom: 6 }}>
            2024/25 TAX TABLE
          </Text>
          <Noir>
            {[
              { band: "R0 – R95,750",        rate: "0%",  base: "" },
              { band: "R95,751 – R365,000",  rate: "7%",  base: "on amount above R95,750" },
              { band: "R365,001 – R550,000", rate: "21%", base: "+ R18,848" },
              { band: "R550,001+",           rate: "27%", base: "+ R57,698" },
            ].map((r, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: colour.onNoir2, flex: 1, marginRight: 8 }}>{r.band}</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colour.primary }}>{r.rate}</Text>
              </View>
            ))}
          </Noir>

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            QUALIFYING CRITERIA (ALL MUST APPLY)
          </Text>
          <Bullet text="Company, CC, or co-operative (sole proprietors use individual rates)" />
          <Bullet text={`Gross income under ${fmtR(SBC_TURNOVER_LIMIT)} in the year of assessment`} />
          <Bullet text="South African tax resident" />
          <Bullet text="All shareholders are natural persons (no corporate shareholders)" />
          <Bullet text="At least one owner-manager works full-time in the business" />
          <Bullet text="Not more than 20% of income from personal service (professional services)" />
          <Bullet text="No owner holds shares in another company (with exceptions)" />

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            S12E ACCELERATED WRITE-OFFS FOR SBCs
          </Text>
          <Bullet text="Plant & machinery: 100% in Year 1 (immediate full deduction)" />
          <Bullet text="Manufacturing assets: same 40/20/8% schedule as S12C" />
          <Bullet text="Other qualifying assets: 50% / 30% / 20% over 3 years" />
        </Section>

        {/* ── S10(1)(o) Foreign income exemption ────────────────────────── */}
        <Section
          icon="globe"
          title="S10(1)(o) — Foreign income exemption"
          badge={`First ${fmtR(FOREIGN_INCOME_EXEMPTION)} of qualifying employment income`}
        >
          <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 18, marginBottom: space.md }}>
            South African tax residents working abroad may exempt a portion of their foreign employment income from South African tax, provided they meet the physical presence test.
          </Text>

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginBottom: 6 }}>
            EXEMPTION LIMIT
          </Text>
          <Noir>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: colour.onNoir2 }}>Exempt amount (2025/26)</Text>
              <Text style={{ fontSize: 14, fontWeight: "800", color: colour.primary }}>{fmtR(FOREIGN_INCOME_EXEMPTION)}</Text>
            </View>
            <Text style={{ fontSize: 11, color: colour.onNoir2 }}>
              Income above R1.25M is taxed in SA at normal individual rates.
            </Text>
          </Noir>

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            PHYSICAL PRESENCE TEST (BOTH CONDITIONS)
          </Text>
          <View
            style={{
              backgroundColor: colour.warningBg,
              borderRadius: radius.sm,
              padding: space.md,
              marginBottom: space.sm,
              flexDirection: "row",
              gap: space.sm,
            }}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colour.warning} />
            <Text style={{ flex: 1, fontSize: 12, color: colour.warning }}>
              Both conditions must be met during the 12-month period:
            </Text>
          </View>
          <Bullet text={`Outside South Africa for more than ${FOREIGN_DAYS_REQUIRED} days in aggregate (any 12-month period)`} />
          <Bullet text={`Includes a continuous absence of more than ${FOREIGN_CONTINUOUS_DAYS} consecutive days`} />
          <Bullet text="Employed by an employer (not self-employed income — that uses normal SA rules)" />
          <Bullet text="Services rendered outside SA for a foreign employer or SA employer with a foreign office" />

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            RECORD-KEEPING REQUIRED
          </Text>
          <Bullet text="Travel diary with dates entered/left SA for each trip" />
          <Bullet text="Employer letter confirming foreign posting and remuneration" />
          <Bullet text="Foreign payslips and bank statements" />
          <Bullet text="Passport stamps or airline boarding passes" />

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            CLAIM ON ITR12
          </Text>
          <Bullet text='Under "Foreign Income" section — report gross foreign employment income' />
          <Bullet text="MyExpense income entries: record as IRP5 / Employment Income with employer country noted" />
          <Bullet text="SARS will apply the exemption automatically based on your source code 3651" />
        </Section>

        {/* ── TFSA ──────────────────────────────────────────────────────── */}
        <Section
          icon="dollarsign.circle.fill"
          title="TFSA — Tax Free Savings Account"
          badge={`Annual cap: ${fmtR(TFSA_ANNUAL_CAP)} · Lifetime: ${fmtR(TFSA_LIFETIME_CAP)}`}
        >
          <Text style={{ fontSize: 12, color: colour.textSub, lineHeight: 18, marginBottom: space.md }}>
            A TFSA lets you grow savings completely tax-free — no tax on interest, dividends, or capital gains earned inside the account.
          </Text>

          <Row label="Annual contribution limit" value={fmtR(TFSA_ANNUAL_CAP)} highlight />
          <Row label="Lifetime contribution limit" value={fmtR(TFSA_LIFETIME_CAP)} />
          <Row label="Tax on growth inside TFSA" value="Zero" highlight />
          <Row label="Penalty for exceeding annual cap" value="40% on excess" />

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            KEY RULES
          </Text>
          <Bullet text={`You may contribute up to ${fmtR(TFSA_ANNUAL_CAP)} per tax year across all your TFSA accounts`} />
          <Bullet text="Withdrawals do NOT restore your annual limit — only your lifetime limit tracks cumulative contributions" />
          <Bullet text="Interest, dividends, and capital gains earned inside the TFSA are fully exempt — no need to declare on ITR12" />
          <Bullet text="Unused annual allowance cannot roll over to the next year" />

          <Text style={{ fontSize: 11, fontWeight: "700", color: colour.textSub, letterSpacing: 0.6, marginTop: space.md, marginBottom: 6 }}>
            IN MYEXPENSE
          </Text>
          <Bullet text="TFSA contributions are NOT a tax deduction (unlike an RA) — do not capture as an expense" />
          <Bullet text="The tax benefit is on growth inside the account, not on contributions" />
          <Bullet text="Track contributions separately against your R36,000 annual limit to avoid the 40% penalty" />
        </Section>

        <InfoBanner
          icon="info.circle.fill"
          body="These concessions are governed by the Income Tax Act. Eligibility rules change annually with the Budget. Always verify with a registered tax practitioner before making large claims."
          style={{ marginBottom: space.xl }}
        />
      </ScrollView>
      <MXTabBar />
    </SafeAreaView>
  );
}
