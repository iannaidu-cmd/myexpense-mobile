import { MXTabBar } from "@/components/MXTabBar";
import { NavigationProp } from "@react-navigation/native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
  navigation?: NavigationProp<any>;
}

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

function PhoneShell({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation?: NavigationProp<any>;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bgLighter }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <MXTabBar />
    </View>
  );
}

type ActivityType =
  | "expense_added"
  | "receipt_scanned"
  | "report_generated"
  | "deadline"
  | "budget_alert"
  | "export"
  | "login";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  subtitle: string;
  time: string;
  date: string;
  amount?: string;
  read: boolean;
  navTarget?: string;
}

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    type: "expense_added",
    title: "Expense added",
    subtitle: "Engen Fuel · Travel · R 650",
    time: "09:14",
    date: "Today",
    amount: "R 650",
    read: false,
    navTarget: "ExpenseDetail",
  },
  {
    id: 2,
    type: "receipt_scanned",
    title: "Receipt scanned",
    subtitle: "Microsoft 365 · Software · OCR matched",
    time: "09:02",
    date: "Today",
    amount: "R 330",
    read: false,
    navTarget: "ExpenseDetail",
  },
  {
    id: 3,
    type: "budget_alert",
    title: "Budget alert",
    subtitle: "Equipment category 92% used this month",
    time: "08:30",
    date: "Today",
    read: false,
    navTarget: "BudgetVsActual",
  },
  {
    id: 4,
    type: "expense_added",
    title: "Expense added",
    subtitle: "Home Office Rent · R 1,200",
    time: "17:45",
    date: "Yesterday",
    amount: "R 1,200",
    read: true,
    navTarget: "ExpenseDetail",
  },
  {
    id: 5,
    type: "report_generated",
    title: "Monthly report ready",
    subtitle: "February 2025 — 28 expenses captured",
    time: "00:01",
    date: "Yesterday",
    read: true,
    navTarget: "ReportsHome",
  },
  {
    id: 6,
    type: "deadline",
    title: "SARS deadline reminder",
    subtitle: "ITR12 filing period opens in 47 days",
    time: "08:00",
    date: "14 Mar",
    read: true,
    navTarget: "TaxSummary",
  },
  {
    id: 7,
    type: "expense_added",
    title: "Expense added",
    subtitle: "Business Lunch · Meals · R 480",
    time: "13:22",
    date: "14 Mar",
    amount: "R 480",
    read: true,
    navTarget: "ExpenseDetail",
  },
  {
    id: 8,
    type: "export",
    title: "Export completed",
    subtitle: "ITR12 Summary PDF downloaded",
    time: "11:10",
    date: "13 Mar",
    read: true,
    navTarget: "ReportsHome",
  },
  {
    id: 9,
    type: "receipt_scanned",
    title: "Receipt scanned",
    subtitle: "Takealot · Equipment · R 1,499",
    time: "10:05",
    date: "12 Mar",
    amount: "R 1,499",
    read: true,
    navTarget: "ExpenseDetail",
  },
  {
    id: 10,
    type: "budget_alert",
    title: "Budget exceeded",
    subtitle: "Travel category went R 200 over budget",
    time: "09:00",
    date: "10 Mar",
    read: true,
    navTarget: "BudgetVsActual",
  },
  {
    id: 11,
    type: "login",
    title: "Signed in",
    subtitle: "Samsung Galaxy S24 · Cape Town",
    time: "08:15",
    date: "10 Mar",
    read: true,
  },
];

const TYPE_META: Record<
  ActivityType,
  { icon: string; color: string; bg: string }
> = {
  expense_added: { icon: "🧾", color: C.navy, bg: C.bgLight },
  receipt_scanned: { icon: "📷", color: C.teal, bg: "#E0F9F6" },
  report_generated: { icon: "📊", color: C.midNavy2, bg: C.bgLight },
  deadline: { icon: "🗓", color: C.warning, bg: "#FFF8E1" },
  budget_alert: { icon: "⚠️", color: C.danger, bg: "#FEF0EF" },
  export: { icon: "📤", color: C.success, bg: "#E8F8F3" },
  login: { icon: "🔐", color: C.textSub, bg: C.bgLight },
};

function ActivityRow({
  item,
  onPress,
}: {
  item: Activity;
  onPress: () => void;
}) {
  const meta = TYPE_META[item.type];
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: item.read ? C.white : `${C.bgLight}88`,
      }}
    >
      <View style={{ position: "relative", marginRight: 14 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: meta.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
        </View>
        {!item.read && (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: C.teal,
              borderWidth: 2,
              borderColor: C.white,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: item.read ? "600" : "800",
              color: C.text,
              flex: 1,
              marginRight: 8,
            }}
          >
            {item.title}
          </Text>
          <Text style={{ fontSize: 11, color: C.textSub }}>{item.time}</Text>
        </View>
        <Text
          style={{
            fontSize: 12,
            color: C.textSub,
            marginTop: 3,
            lineHeight: 17,
          }}
        >
          {item.subtitle}
        </Text>
        {item.amount && (
          <View
            style={{
              marginTop: 6,
              alignSelf: "flex-start",
              backgroundColor: C.bgLight,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: C.navy }}>
              {item.amount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function RecentActivityFeedScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<
    "All" | "Unread" | "Expenses" | "Alerts"
  >("All");
  const filters = ["All", "Unread", "Expenses", "Alerts"] as const;

  const unreadCount = ACTIVITIES.filter((a) => !a.read).length;

  const filtered = ACTIVITIES.filter((a) => {
    if (filter === "Unread") return !a.read;
    if (filter === "Expenses")
      return a.type === "expense_added" || a.type === "receipt_scanned";
    if (filter === "Alerts")
      return a.type === "budget_alert" || a.type === "deadline";
    return true;
  });

  // Group by date
  const groups: { date: string; items: Activity[] }[] = [];
  filtered.forEach((a) => {
    const last = groups[groups.length - 1];
    if (last && last.date === a.date) last.items.push(a);
    else groups.push({ date: a.date, items: [a] });
  });

  return (
    <PhoneShell navigation={navigation}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.navy,
          paddingTop: 47,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={{ marginBottom: 10 }}
        >
          <Text style={{ color: C.teal, fontSize: 13 }}>‹ Home</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: C.teal,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 1,
              }}
            >
              DASHBOARD
            </Text>
            <Text
              style={{
                color: C.white,
                fontSize: 22,
                fontWeight: "800",
                marginTop: 4,
              }}
            >
              Activity Feed
            </Text>
          </View>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: C.teal,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: C.white, fontSize: 12, fontWeight: "700" }}>
                {unreadCount} new
              </Text>
            </View>
          )}
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
        {/* Filter tabs */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 20, marginBottom: 12 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {filters.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: filter === f ? C.navy : C.bgLight,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: filter === f ? C.white : C.textSub,
                    }}
                  >
                    {f}
                    {f === "Unread" && unreadCount > 0
                      ? ` (${unreadCount})`
                      : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <TouchableOpacity style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: C.teal, fontWeight: "600" }}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}

        {/* Activity groups */}
        {groups.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: C.text,
                marginTop: 12,
              }}
            >
              No activity
            </Text>
            <Text style={{ fontSize: 13, color: C.textSub, marginTop: 6 }}>
              Nothing here for this filter.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.date} style={{ marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.textSub,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 8,
                }}
              >
                {group.date}
              </Text>
              <View
                style={{
                  backgroundColor: C.white,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: C.border,
                  overflow: "hidden",
                }}
              >
                {group.items.map((item) => (
                  <ActivityRow
                    key={item.id}
                    item={item}
                    onPress={() =>
                      item.navTarget && navigation?.navigate(item.navTarget)
                    }
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </PhoneShell>
  );
}
