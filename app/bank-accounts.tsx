import { MXHeader } from "@/components/MXHeader";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from "@/stores/authStore";
import { colour, radius, space, typography } from "@/tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SA_BANKS = [
  "ABSA Bank",
  "Capitec Bank",
  "FNB (First National Bank)",
  "Nedbank",
  "Standard Bank",
  "African Bank",
  "Discovery Bank",
  "Investec",
  "TymeBank",
  "Bank Zero",
  "Bidvest Bank",
  "Other",
];
const ACCOUNT_TYPES = ["Cheque / Current", "Savings", "Transmission", "Credit"];

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code: string;
  account_type: string;
  is_primary: boolean;
}

function maskAccountNumber(num: string) {
  if (num.length <= 4) return num;
  return "•".repeat(num.length - 4) + num.slice(-4);
}

export default function BankAccountsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [accountType, setAccountType] = useState("Cheque / Current");

  const loadAccounts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });
      setAccounts(data ?? []);
    } catch (e) {
      console.error("BankAccounts load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const resetForm = () => {
    setBankName("");
    setAccountHolder("");
    setAccountNumber("");
    setBranchCode("");
    setAccountType("Cheque / Current");
  };

  const handleAdd = async () => {
    if (!bankName || !accountHolder || !accountNumber || !branchCode) {
      Alert.alert("Required fields", "Please fill in all fields.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("bank_accounts").insert({
        user_id: user.id,
        bank_name: bankName,
        account_holder: accountHolder,
        account_number: accountNumber,
        branch_code: branchCode,
        account_type: accountType,
        is_primary: accounts.length === 0,
      });
      setShowModal(false);
      resetForm();
      await loadAccounts();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    if (!user) return;
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase
        .from("bank_accounts")
        .update({ is_primary: false })
        .eq("user_id", user.id);
      await supabase
        .from("bank_accounts")
        .update({ is_primary: true })
        .eq("id", id);
      await loadAccounts();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Account", `Remove ${name} account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setDeleting(id);
          try {
            const { supabase } = await import("@/lib/supabase");
            await supabase.from("bank_accounts").delete().eq("id", id);
            await loadAccounts();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colour.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colour.background} />

      <MXHeader
        title="Bank Accounts"
        subtitle="Manage your banking details"
        showBack
        backLabel="Settings"
        right={
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              backgroundColor: colour.primary50,
              borderRadius: radius.pill,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
            }}
          >
            <Text style={{ ...typography.labelS, color: colour.accentDeep }}>
              + Add
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: colour.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <ActivityIndicator color={colour.primary} size="large" />
          </View>
        ) : accounts.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: space["4xl"] }}>
            <IconSymbol name="building.columns.fill" size={48} color={colour.textHint} style={{ marginBottom: space.md } as any} />
            <Text style={{ ...typography.h4, color: colour.textPrimary }}>
              No bank accounts
            </Text>
            <Text
              style={{
                ...typography.bodyM,
                color: colour.textSecondary,
                textAlign: "center",
                marginTop: space.xs,
                marginBottom: space.xl,
              }}
            >
              Add your banking details for ITR12 export and payment processing
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingVertical: space.md,
                paddingHorizontal: space.xl,
              }}
            >
              <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                Add Bank Account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {accounts.map((account) => (
              <View
                key={account.id}
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.lg,
                  padding: space.lg,
                  marginBottom: space.md,
                  borderWidth: account.is_primary ? 2 : 1,
                  borderColor: account.is_primary
                    ? colour.primary
                    : colour.border,
                }}
              >
                {account.is_primary && (
                  <View
                    style={{
                      backgroundColor: colour.primaryLight,
                      borderRadius: radius.pill,
                      paddingHorizontal: space.sm,
                      paddingVertical: 2,
                      alignSelf: "flex-start",
                      marginBottom: space.sm,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.micro,
                        color: colour.primary,
                        fontWeight: "700",
                      }}
                    >
                      PRIMARY ACCOUNT
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: space.sm,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: colour.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: space.md,
                    }}
                  >
                    <IconSymbol name="building.columns.fill" size={22} color={colour.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.labelM,
                        color: colour.textPrimary,
                      }}
                    >
                      {account.bank_name}
                    </Text>
                    <Text
                      style={{
                        ...typography.caption,
                        color: colour.textSecondary,
                      }}
                    >
                      {account.account_type}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: colour.bgPage,
                    borderRadius: radius.sm,
                    padding: space.sm,
                    marginBottom: space.md,
                  }}
                >
                  {[
                    { l: "Account Holder", v: account.account_holder },
                    {
                      l: "Account Number",
                      v: maskAccountNumber(account.account_number),
                    },
                    { l: "Branch Code", v: account.branch_code },
                  ].map((row, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: i < 2 ? 4 : 0,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.bodyXS,
                          color: colour.textSecondary,
                        }}
                      >
                        {row.l}
                      </Text>
                      <Text
                        style={{
                          ...typography.bodyXS,
                          color: colour.textPrimary,
                          fontWeight: "600",
                        }}
                      >
                        {row.v}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: space.sm }}>
                  {!account.is_primary && (
                    <TouchableOpacity
                      onPress={() => handleSetPrimary(account.id)}
                      style={{
                        flex: 1,
                        borderRadius: radius.sm,
                        borderWidth: 1.5,
                        borderColor: colour.primary,
                        paddingVertical: space.sm,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{ ...typography.labelS, color: colour.primary }}
                      >
                        Set Primary
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(account.id, account.bank_name)}
                    disabled={deleting === account.id}
                    style={{
                      flex: 1,
                      borderRadius: radius.sm,
                      borderWidth: 1.5,
                      borderColor: colour.danger,
                      paddingVertical: space.sm,
                      alignItems: "center",
                    }}
                  >
                    {deleting === account.id ? (
                      <ActivityIndicator color={colour.danger} size="small" />
                    ) : (
                      <Text
                        style={{ ...typography.labelS, color: colour.danger }}
                      >
                        Remove
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View
              style={{
                backgroundColor: colour.infoLight,
                borderRadius: radius.md,
                padding: space.md,
              }}
            >
              <Text
                style={{
                  ...typography.labelS,
                  color: colour.info,
                  marginBottom: space.xs,
                }}
              >
                POPIA & Security
              </Text>
              <Text
                style={{
                  ...typography.bodyXS,
                  color: colour.info,
                  lineHeight: 18,
                }}
              >
                Your banking details are stored securely and encrypted. Account
                numbers are masked in all exports. MyExpense never initiates
                transfers from your accounts.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colour.bgCard }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: space.lg,
              borderBottomWidth: 1,
              borderBottomColor: colour.border,
            }}
          >
            <Text style={{ ...typography.h4, color: colour.textPrimary }}>
              Add Bank Account
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Text
                style={{ ...typography.labelM, color: colour.textSecondary }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: space.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              BANK NAME *
            </Text>
            <TouchableOpacity
              onPress={() => setShowBankPicker(!showBankPicker)}
              style={{
                borderBottomWidth: 1.5,
                borderBottomColor: bankName ? colour.primary : colour.border,
                paddingVertical: space.sm,
                marginBottom: space.sm,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  ...typography.bodyM,
                  color: bankName ? colour.text : colour.textHint,
                }}
              >
                {bankName || "Select your bank…"}
              </Text>
              <Text style={{ color: colour.textSub }}>
                {showBankPicker ? "∨" : "›"}
              </Text>
            </TouchableOpacity>
            {showBankPicker && (
              <View
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: colour.border,
                  marginBottom: space.md,
                }}
              >
                {SA_BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    onPress={() => {
                      setBankName(bank);
                      setShowBankPicker(false);
                    }}
                    style={{
                      paddingVertical: space.md,
                      paddingHorizontal: space.md,
                      borderBottomWidth: 1,
                      borderBottomColor: colour.borderLight,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ ...typography.bodyM, color: colour.text }}>
                      {bank}
                    </Text>
                    {bankName === bank && (
                      <Text style={{ color: colour.success }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              ACCOUNT HOLDER NAME *
            </Text>
            <TextInput
              value={accountHolder}
              onChangeText={setAccountHolder}
              placeholder="Full name as on bank account"
              placeholderTextColor={colour.textHint}
              style={{
                ...typography.bodyM,
                color: colour.text,
                borderBottomWidth: 1.5,
                borderBottomColor: colour.border,
                paddingVertical: space.sm,
                marginBottom: space.lg,
              }}
            />

            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              ACCOUNT NUMBER *
            </Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Your bank account number"
              placeholderTextColor={colour.textHint}
              keyboardType="numeric"
              style={{
                ...typography.bodyM,
                color: colour.text,
                borderBottomWidth: 1.5,
                borderBottomColor: colour.border,
                paddingVertical: space.sm,
                marginBottom: space.lg,
              }}
            />

            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              BRANCH CODE *
            </Text>
            <TextInput
              value={branchCode}
              onChangeText={setBranchCode}
              placeholder="6-digit branch code"
              placeholderTextColor={colour.textHint}
              keyboardType="numeric"
              maxLength={6}
              style={{
                ...typography.bodyM,
                color: colour.text,
                borderBottomWidth: 1.5,
                borderBottomColor: colour.border,
                paddingVertical: space.sm,
                marginBottom: space.sm,
              }}
            />
            <Text
              style={{
                ...typography.bodyXS,
                color: colour.textSub,
                marginBottom: space.lg,
              }}
            >
              Universal branch codes: ABSA 632005 · FNB 250655 · Standard 051001
              · Nedbank 198765 · Capitec 470010
            </Text>

            <Text
              style={{
                ...typography.labelS,
                color: colour.textSub,
                marginBottom: space.xs,
              }}
            >
              ACCOUNT TYPE
            </Text>
            <TouchableOpacity
              onPress={() => setShowTypePicker(!showTypePicker)}
              style={{
                borderBottomWidth: 1.5,
                borderBottomColor: colour.border,
                paddingVertical: space.sm,
                marginBottom: space.sm,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ ...typography.bodyM, color: colour.text }}>
                {accountType}
              </Text>
              <Text style={{ color: colour.textSub }}>
                {showTypePicker ? "∨" : "›"}
              </Text>
            </TouchableOpacity>
            {showTypePicker && (
              <View
                style={{
                  backgroundColor: colour.white,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: colour.border,
                  marginBottom: space.md,
                }}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => {
                      setAccountType(type);
                      setShowTypePicker(false);
                    }}
                    style={{
                      paddingVertical: space.md,
                      paddingHorizontal: space.md,
                      borderBottomWidth: 1,
                      borderBottomColor: colour.borderLight,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ ...typography.bodyM, color: colour.text }}>
                      {type}
                    </Text>
                    {accountType === type && (
                      <Text style={{ color: colour.success }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={handleAdd}
              disabled={saving}
              style={{
                backgroundColor: saving ? colour.border : colour.primary,
                borderRadius: radius.lg,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                marginTop: space.lg,
              }}
            >
              {saving ? (
                <ActivityIndicator color={colour.onPrimary} />
              ) : (
                <Text style={{ ...typography.btnL, color: colour.onPrimary }}>
                  Save Bank Account
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
