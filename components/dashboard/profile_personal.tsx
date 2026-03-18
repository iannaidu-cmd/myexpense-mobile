import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Brand Colours ────────────────────────────────────────────────────────────
const C = {
  navy: "#2E2E7A",
  navyDark: "#1A1A5C",
  teal: "#3BBFAD",
  midNavy: "#3D3D9E",
  midNavy2: "#5B5BB8",
  bgLight: "#E8EAF6",
  bgLighter: "#F5F6FF",
  white: "#FFFFFF",
  text: "#1A1A2E",
  textSub: "#6B6B9E",
  border: "#D0D3F0",
  success: "#27AE60",
  warning: "#F39C12",
  danger: "#E74C3C",
};

const NAV = { Home: "⊞", Scan: "⊡", Reports: "◈", Settings: "⚙" };

function PhoneShell({ children, activeTab = "Settings", navigation }) {
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

// ─── Field Input ──────────────────────────────────────────────────────────────
function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  note,
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: C.textSub,
          letterSpacing: 0.5,
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textSub}
        keyboardType={keyboardType || "default"}
        editable={editable}
        style={{
          fontSize: 15,
          color: editable ? C.text : C.textSub,
          borderBottomWidth: 1,
          borderBottomColor: editable ? C.midNavy2 : C.border,
          paddingBottom: 10,
          paddingTop: 4,
          backgroundColor: "transparent",
        }}
      />
      {note ? (
        <Text style={{ fontSize: 11, color: C.textSub, marginTop: 5 }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

// ─── SCREEN: Profile & Personal ───────────────────────────────────────────────
export default function ProfilePersonalScreen({ navigation }) {
  const [firstName, setFirstName] = useState("Ian");
  const [lastName, setLastName] = useState("Naidu");
  const [email, setEmail] = useState("ian@myexpense.co.za");
  const [phone, setPhone] = useState("+27 82 555 0123");
  const [idNumber, setIdNumber] = useState("8501015009087");
  const [taxNumber, setTaxNumber] = useState("1234567890");
  const [tradingName, setTradingName] = useState("Ian Naidu Consulting");
  const [address, setAddress] = useState("12 Bree Street, Cape Town, 8001");
  const [edited, setEdited] = useState(false);

  const wrap = (setter) => (val) => {
    setter(val);
    setEdited(true);
  };

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
          Profile & Personal
        </Text>
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
        {/* Avatar Block */}
        <View
          style={{ alignItems: "center", paddingTop: 28, paddingBottom: 20 }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: C.navy,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: C.teal,
            }}
          >
            <Text style={{ color: C.white, fontSize: 28, fontWeight: "800" }}>
              IN
            </Text>
          </View>
          <TouchableOpacity style={{ marginTop: 10 }}>
            <Text style={{ color: C.teal, fontSize: 13, fontWeight: "600" }}>
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Personal Details */}
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 16,
            }}
          >
            Personal Details
          </Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flex: 1 }}>
              <FieldInput
                label="First Name"
                value={firstName}
                onChangeText={wrap(setFirstName)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldInput
                label="Last Name"
                value={lastName}
                onChangeText={wrap(setLastName)}
              />
            </View>
          </View>
          <FieldInput
            label="Email Address"
            value={email}
            onChangeText={wrap(setEmail)}
            keyboardType="email-address"
          />
          <FieldInput
            label="Mobile Number"
            value={phone}
            onChangeText={wrap(setPhone)}
            keyboardType="phone-pad"
          />
          <FieldInput
            label="SA ID Number"
            value={idNumber}
            onChangeText={wrap(setIdNumber)}
            keyboardType="numeric"
            note="Used for ITR12 auto-fill. Stored encrypted."
          />
        </View>

        {/* Tax & Business */}
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 16,
            }}
          >
            Tax & Business Info
          </Text>
          <FieldInput
            label="SARS Tax Number"
            value={taxNumber}
            onChangeText={wrap(setTaxNumber)}
            keyboardType="numeric"
            note="Your 10-digit SARS taxpayer reference number."
          />
          <FieldInput
            label="Trading / Business Name"
            value={tradingName}
            onChangeText={wrap(setTradingName)}
            placeholder="Optional"
          />
          <FieldInput
            label="Employment Type"
            value="Sole Proprietor / Freelancer"
            editable={false}
            note="Contact support to change employment category."
          />
        </View>

        {/* Address */}
        <View
          style={{
            backgroundColor: C.white,
            marginHorizontal: 16,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 16,
            }}
          >
            Address
          </Text>
          <FieldInput
            label="Business / Residential Address"
            value={address}
            onChangeText={wrap(setAddress)}
            placeholder="Street, City, Postal Code"
          />
          <FieldInput label="Province" value="Western Cape" editable={false} />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            backgroundColor: edited ? C.teal : C.bgLight,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
          }}
          disabled={!edited}
          onPress={() => setEdited(false)}
        >
          <Text
            style={{
              color: edited ? C.white : C.textSub,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            {edited ? "Save Changes" : "No Changes"}
          </Text>
        </TouchableOpacity>

        {/* POPIA Note */}
        <View style={{ margin: 16, marginTop: 12 }}>
          <Text
            style={{
              fontSize: 11,
              color: C.textSub,
              textAlign: "center",
              lineHeight: 16,
            }}
          >
            🔒 Your personal information is protected under POPIA.{"\n"}
            MyExpense will never sell or share your data.
          </Text>
        </View>
      </View>
    </PhoneShell>
  );
}
