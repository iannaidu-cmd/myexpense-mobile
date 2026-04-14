import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";

interface TaxYear { label: string; range: string; current: boolean; }
interface ExportCategory { name: string; icon: string; color: string; amount: number; included: boolean; note?: string; }
interface ExportFormat    { id: string; label: string; icon: string; description: string; }
type ExportStep = "year" | "categories" | "format" | "options";

interface ITR12ExportSetupProps {
  onExport?: (config: ITR12ExportConfig) => void;
  onCancel?: () => void;
}
interface ITR12ExportConfig {
  taxYear: string;
  categories: ExportCategory[];
  format: string;
  includeVAT: boolean;
  includeReceipts: boolean;
  totalAmount: number;
}

const TAX_YEARS: TaxYear[] = [
  { label: "2026", range: "1 Mar 2025 – 28 Feb 2026", current: true  },
  { label: "2025", range: "1 Mar 2024 – 28 Feb 2025", current: false },
  { label: "2024", range: "1 Mar 2023 – 28 Feb 2024", current: false },
];

const EXPORT_CATEGORIES: ExportCategory[] = [
  { name: "Software & Tech",       icon: "💻", color: colour.midNavy2, amount: 12400, included: true              },
  { name: "Travel & Transport",    icon: "🚗", color: colour.info,     amount: 9200,  included: true              },
  { name: "Office & Stationery",   icon: "📁", color: colour.primary,  amount: 7800,  included: true              },
  { name: "Professional Services", icon: "📋", color: colour.teal,     amount: 6100,  included: true              },
  { name: "Meals & Entertainment", icon: "🍽️", color: colour.danger,   amount: 3400,  included: true, note: "50% only"         },
  { name: "Home Office",           icon: "🏠", color: colour.info,     amount: 4800,  included: true, note: "Calculated %"     },
];

const EXPORT_FORMATS: ExportFormat[] = [
  { id: "pdf",   label: "PDF report",    icon: "📄", description: "Formatted for SARS submission"    },
  { id: "csv",   label: "CSV export",    icon: "📊", description: "Spreadsheet-compatible format"    },
  { id: "itr12", label: "ITR12 Summary", icon: "🏛️", description: "SARS field-mapped breakdown"     },
];

const STEPS: Array<{ id: ExportStep; label: string }> = [
  { id: "year",       label: "Tax year"   },
  { id: "categories", label: "Categories" },
  { id: "format",     label: "Format"     },
  { id: "options",    label: "Options"    },
];

export function ITR12ExportSetupScreen({ onExport, onCancel }: ITR12ExportSetupProps) {
  const [currentStep,     setCurrentStep]    = useState<ExportStep>("year");
  const [selectedYear,    setSelectedYear]   = useState(0);
  const [categories,      setCategories]     = useState(EXPORT_CATEGORIES);
  const [selectedFormat,  setSelectedFormat] = useState("pdf");
  const [includeVAT,      setIncludeVAT]     = useState(true);
  const [includeReceipts, setIncludeReceipts]= useState(true);

  const toggleCategory = (index: number) =>
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, included: !cat.included } : cat)),
    );

  const calculateTotal = () =>
    categories.reduce((sum, cat) => {
      if (!cat.included) return sum;
      return sum + (cat.note ? Math.round(cat.amount * 0.5) : cat.amount);
    }, 0);

  const totalAmount = calculateTotal();
  const stepIndex   = STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep  = stepIndex === STEPS.length - 1;

  // ── Checkbox helper ─────────────────────────────────────────────────────────
  const Checkbox = ({ checked }: { checked: boolean }) => (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: checked ? colour.primary : colour.border,
        backgroundColor: checked ? colour.primary : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && <Text style={{ color: colour.white, fontSize: 14 }}>✓</Text>}
    </View>
  );

  // ── Step content ────────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      case "year":
        return (
          <View>
            <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 16 }}>
              Select Tax Year
            </Text>
            {TAX_YEARS.map((year, index) => {
              const sel = selectedYear === index;
              return (
                <Pressable
                  key={year.label}
                  onPress={() => setSelectedYear(index)}
                  style={{
                    backgroundColor: sel ? colour.primary50 : colour.surface1,
                    borderRadius: radius.md,
                    borderWidth: 2,
                    borderColor: sel ? colour.primary : colour.border,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                      <Text style={{ ...typography.labelM, color: colour.text }}>{year.label}</Text>
                      {year.current && (
                        <View
                          style={{
                            backgroundColor: colour.tealLight,
                            borderRadius: radius.pill,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ ...typography.micro, color: colour.teal, fontWeight: "700" }}>
                            Current
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                      {year.range}
                    </Text>
                  </View>
                  <Checkbox checked={sel} />
                </Pressable>
              );
            })}
          </View>
        );

      case "categories":
        return (
          <View>
            <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 16 }}>
              Select Categories
            </Text>
            {categories.map((cat, index) => (
              <Pressable
                key={cat.name}
                onPress={() => toggleCategory(index)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderBottomWidth: index < categories.length - 1 ? 1 : 0,
                  borderBottomColor: colour.border,
                  backgroundColor: cat.included ? colour.primary50 : colour.white,
                  borderRadius: index === 0 ? radius.md : 0,
                }}
              >
                <Checkbox checked={cat.included} />
                <Text style={{ fontSize: 20, marginHorizontal: space.md }}>{cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.labelM, color: colour.text }}>{cat.name}</Text>
                  <Text style={{ ...typography.bodyXS, color: colour.textSub }}>
                    R {cat.amount.toLocaleString()}
                  </Text>
                  {cat.note && (
                    <Text style={{ ...typography.micro, color: colour.warning, fontWeight: "600" }}>
                      {cat.note}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        );

      case "format":
        return (
          <View>
            <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 16 }}>
              Choose Export Format
            </Text>
            {EXPORT_FORMATS.map((format) => {
              const sel = selectedFormat === format.id;
              return (
                <Pressable
                  key={format.id}
                  onPress={() => setSelectedFormat(format.id)}
                  style={{
                    backgroundColor: sel ? colour.primary50 : colour.white,
                    borderRadius: radius.md,
                    borderWidth: 2,
                    borderColor: sel ? colour.primary : colour.border,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{format.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.labelM, color: colour.text }}>{format.label}</Text>
                    <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                      {format.description}
                    </Text>
                  </View>
                  <Checkbox checked={sel} />
                </Pressable>
              );
            })}
          </View>
        );

      case "options":
        return (
          <View>
            <Text style={{ ...typography.labelM, color: colour.text, marginBottom: 16 }}>
              Export Options
            </Text>
            {[
              {
                label: "Include VAT",
                sub: "Add VAT amounts to report",
                value: includeVAT,
                onChange: setIncludeVAT,
              },
              {
                label: "Include Receipts",
                sub: "Attach receipt files to export",
                value: includeReceipts,
                onChange: setIncludeReceipts,
              },
            ].map((opt, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: space.md,
                  borderBottomWidth: i === 0 ? 1 : 0,
                  borderBottomColor: colour.border,
                  backgroundColor: colour.white,
                  borderRadius: i === 0 ? 0 : radius.md,
                }}
              >
                <View>
                  <Text style={{ ...typography.labelM, color: colour.text }}>{opt.label}</Text>
                  <Text style={{ ...typography.bodyXS, color: colour.textSub, marginTop: 2 }}>
                    {opt.sub}
                  </Text>
                </View>
                <Switch
                  value={opt.value}
                  onValueChange={opt.onChange}
                  trackColor={{ false: colour.border, true: colour.primary }}
                  thumbColor={colour.white}
                />
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 28,
          backgroundColor: colour.primary,
        }}
      >
        <Pressable onPress={onCancel} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 22, color: "rgba(255,255,255,0.65)" }}>←</Text>
        </Pressable>
        <Text style={{ ...typography.h3, color: colour.white, marginBottom: 6 }}>
          ITR12 Export Setup
        </Text>
        <Text style={{ ...typography.bodyS, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
          Configure your SARS expense report
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            backgroundColor: colour.tealLight,
            borderRadius: radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 5,
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ ...typography.labelS, color: colour.teal }}>
            Total to export: R {totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Step tabs */}
      <View
        style={{
          flexDirection: "row",
          gap: space.sm,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colour.border,
        }}
      >
        {STEPS.map((step) => {
          const active = currentStep === step.id;
          return (
            <Pressable
              key={step.id}
              onPress={() => setCurrentStep(step.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: active ? colour.primary : colour.border,
                backgroundColor: active ? colour.primary : "transparent",
              }}
            >
              <Text
                style={{
                  ...typography.labelS,
                  color: active ? colour.onPrimary : colour.textSub,
                }}
              >
                {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Step content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>{renderStepContent()}</View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Nav buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: space.md,
          paddingHorizontal: 20,
          paddingVertical: space.lg,
          borderTopWidth: 1,
          borderTopColor: colour.border,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colour.border,
            alignItems: "center",
          }}
          onPress={onCancel}
        >
          <Text style={{ ...typography.labelM, color: colour.text }}>Cancel</Text>
        </Pressable>

        {isLastStep ? (
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: radius.md,
              backgroundColor: colour.primary,
              alignItems: "center",
            }}
            onPress={() => {
              const config: ITR12ExportConfig = {
                taxYear: TAX_YEARS[selectedYear].label,
                categories,
                format: selectedFormat,
                includeVAT,
                includeReceipts,
                totalAmount,
              };
              onExport?.(config);
            }}
          >
            <Text style={{ ...typography.labelM, color: colour.onPrimary }}>📤 Export</Text>
          </Pressable>
        ) : (
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: radius.md,
              backgroundColor: colour.primary,
              alignItems: "center",
            }}
            onPress={() => {
              const nextIndex = stepIndex + 1;
              if (nextIndex < STEPS.length) setCurrentStep(STEPS[nextIndex].id);
            }}
          >
            <Text style={{ ...typography.labelM, color: colour.onPrimary }}>Next →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
