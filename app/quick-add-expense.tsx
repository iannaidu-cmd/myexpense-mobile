import { MXTabBar } from "@/components/MXTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colour } from "@/tokens";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const C = colour;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  /** When used as a modal overlay — pass visible + onClose instead of standalone navigation */
  visible?: boolean;
  onClose?: () => void;
  onSaved?: (expense: QuickExpense) => void;
}

interface QuickExpense {
  amount: string;
  category: string;
  vendor: string;
  date: string;
  note: string;
}

// ─── Quick Categories ─────────────────────────────────────────────────────────
const QUICK_CATS = [
  { icon: "car.fill",       label: "Travel",       itr12: "S11(a)" },
  { icon: "house.fill",     label: "Home Office",  itr12: "S11(a)" },
  { icon: "gearshape.fill", label: "Software",     itr12: "S11(a)" },
  { icon: "wrench.fill",    label: "Equipment",    itr12: "S11(e)" },
  { icon: "fork.knife",     label: "Meals",        itr12: "S11(a)" },
  { icon: "doc.text.fill",  label: "Professional", itr12: "S11(a)" },
  { icon: "bolt.fill",      label: "Utilities",    itr12: "S11(a)" },
  { icon: "person.fill",    label: "Personal",     itr12: "N/A"    },
];

// ─── SCREEN: Quick Add Expense (Bottom Sheet) ─────────────────────────────────
export default function QuickAddExpenseScreen({
  visible = true,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"amount" | "details">("amount");
  const [saved, setSaved] = useState(false);

  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
      router.back();
    });
  };

  const handleSave = () => {
    if (!amount || !category) return;
    setSaved(true);
    const expense: QuickExpense = {
      amount,
      category,
      vendor,
      date: new Date().toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      note,
    };
    setTimeout(() => {
      onSaved?.(expense);
      handleClose();
    }, 1200);
  };

  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const selectedCat = QUICK_CATS.find((c) => c.label === category);

  return (
    <View style={{ flex: 1 }}>
      {/* Scrim */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: fadeAnim,
        }}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: C.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: [{ translateY: slideAnim }],
          paddingBottom: 34,
          maxHeight: "85%",
        }}
      >
        {/* Handle */}
        <View
          style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: C.border,
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: C.text }}>
              Quick add expense
            </Text>
            <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
              {today}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/add-expense-manual" as any)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: C.bgLight,
              borderRadius: 10,
              marginRight: 10,
            }}
          >
            <Text
              style={{ fontSize: 12, color: C.midNavy2, fontWeight: "600" }}
            >
              Full form
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose}>
            <IconSymbol name="xmark" size={20} color={C.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {saved ? (
            // ── Success State ──────────────────────────────────────────────
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: C.success,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  shadowColor: C.success,
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <IconSymbol name="checkmark" size={32} color={C.white} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
                Expense saved!
              </Text>
              <Text style={{ fontSize: 13, color: C.textSub, marginTop: 6 }}>
                R {amount} · {category}
              </Text>
            </View>
          ) : (
            <View style={{ padding: 20 }}>
              {/* Amount input — always visible */}
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: C.textSub,
                    letterSpacing: 0.8,
                    marginBottom: 10,
                  }}
                >
                  Amount (ZAR)
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: C.textSub,
                      marginRight: 6,
                    }}
                  >
                    R
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={C.border}
                    keyboardType="decimal-pad"
                    style={{
                      fontSize: 44,
                      fontWeight: "900",
                      color: C.navy,
                      minWidth: 120,
                      textAlign: "center",
                      borderBottomWidth: 2,
                      borderBottomColor: amount ? C.teal : C.border,
                      paddingBottom: 4,
                    }}
                  />
                </View>
              </View>

              {/* Category picker */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: C.textSub,
                  letterSpacing: 0.8,

                  marginBottom: 10,
                }}
              >
                Category
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {QUICK_CATS.map((cat) => (
                  <TouchableOpacity
                    key={cat.label}
                    onPress={() => setCategory(cat.label)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor:
                        category === cat.label ? C.navy : C.bgLight,
                      borderWidth: 1,
                      borderColor: category === cat.label ? C.navy : C.border,
                    }}
                  >
                    <IconSymbol name={cat.icon as any} size={14} color={category === cat.label ? C.white : C.text} style={{ marginRight: 6 } as any} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: category === cat.label ? C.white : C.text,
                      }}
                    >
                      {cat.label}
                    </Text>
                    {category === cat.label && (
                      <Text
                        style={{
                          fontSize: 9,
                          color: C.teal,
                          marginLeft: 4,
                          fontWeight: "700",
                        }}
                      >
                        {cat.itr12}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Vendor */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: C.textSub,
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                Vendor / supplier
              </Text>
              <TextInput
                value={vendor}
                onChangeText={setVendor}
                placeholder="e.g. Engen, Makro, Telkom…"
                placeholderTextColor={C.textSub}
                style={{
                  fontSize: 15,
                  color: C.text,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                  paddingBottom: 10,
                  marginBottom: 20,
                }}
              />

              {/* Note */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: C.textSub,
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Short description…"
                placeholderTextColor={C.textSub}
                style={{
                  fontSize: 15,
                  color: C.text,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                  paddingBottom: 10,
                  marginBottom: 24,
                }}
              />

              {/* ITR12 badge */}
              {selectedCat && selectedCat.itr12 !== "N/A" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: C.bgLight,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 20,
                  }}
                >
                  <IconSymbol name="checkmark.circle.fill" size={16} color={C.success} style={{ marginRight: 10 } as any} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: C.textSub,
                      lineHeight: 17,
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: C.text }}>
                      {selectedCat.label}
                    </Text>{" "}
                    is tax-deductible under SARS ITR12 {selectedCat.itr12}.
                  </Text>
                </View>
              )}

              {/* Save */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!amount || !category}
                style={{
                  backgroundColor: amount && category ? C.teal : C.bgLight,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: amount && category ? C.white : C.textSub,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  {amount && category
                    ? `Save R ${amount} · ${category}`
                    : "Enter amount & category"}
                </Text>
              </TouchableOpacity>

              {/* Scan shortcut */}
              <TouchableOpacity
                onPress={() => {
                  handleClose();
                  router.push("/(tabs)/scan" as any);
                }}
                style={{ alignItems: "center", marginTop: 14 }}
              >
                <Text style={{ fontSize: 13, color: C.textSub }}>
                  Scan a receipt instead
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
      <MXTabBar />
    </View>
  );
}
