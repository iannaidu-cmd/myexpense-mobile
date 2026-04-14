import { colour, radius, space, typography } from "@/tokens";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface SearchResult {
  id: string;
  type: "expense" | "category" | "report";
  title: string;
  subtitle: string;
  icon: string;
}

const SAMPLE_RESULTS: SearchResult[] = [
  { id: "1", type: "expense",  title: "Uber to meeting",    subtitle: "Travel • 15 Mar 2026",          icon: "🚗"  },
  { id: "2", type: "expense",  title: "Coffee with client", subtitle: "Meals • 14 Mar 2026",            icon: "☕"  },
  { id: "3", type: "category", title: "Travel",             subtitle: "23 expenses • R8,420 saved",    icon: "✈️" },
  { id: "4", type: "report",   title: "March 2026 Report",  subtitle: "18 expenses • R4,280 saved",    icon: "📊"  },
];

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (text: string) => {
    setQuery(text);
    setResults(
      text.length > 0
        ? SAMPLE_RESULTS.filter(
            (r) =>
              r.title.toLowerCase().includes(text.toLowerCase()) ||
              r.subtitle.toLowerCase().includes(text.toLowerCase()),
          )
        : [],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colour.white }}>
      {/* Search box */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colour.surface1,
          borderRadius: radius.pill,
          marginHorizontal: 16,
          marginVertical: 12,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: colour.border,
          gap: space.sm,
        }}
      >
        <Text style={{ fontSize: 18 }}>🔍</Text>
        <TextInput
          style={{ ...typography.bodyM, flex: 1, paddingVertical: 12, color: colour.primary }}
          placeholder="Search expenses, categories, reports..."
          placeholderTextColor={colour.textHint}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Text style={{ fontSize: 18, color: colour.textSub }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {query.length === 0 ? (
          /* Empty state */
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🔎</Text>
            <Text style={{ ...typography.h4, color: colour.primary, marginBottom: 4 }}>
              Start searching
            </Text>
            <Text style={{ ...typography.bodyM, color: colour.textSub, marginBottom: 40 }}>
              Find expenses, categories, or reports
            </Text>
            {/* Recent searches */}
            <Text
              style={{
                ...typography.labelS,
                color: colour.primary,
                marginBottom: 12,
                letterSpacing: 0.5,
              }}
            >
              Recent Searches
            </Text>
            {["Travel", "Coffee", "Office supplies"].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={{ paddingVertical: 8, paddingHorizontal: 16, marginBottom: 8 }}
                onPress={() => handleSearch(item)}
              >
                <Text style={{ ...typography.labelM, color: colour.info }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : results.length === 0 ? (
          /* No results */
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🤷</Text>
            <Text style={{ ...typography.h4, color: colour.primary, marginBottom: 4 }}>
              No results
            </Text>
            <Text style={{ ...typography.bodyM, color: colour.textSub }}>
              Try a different search term
            </Text>
          </View>
        ) : (
          /* Results */
          <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            {results.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colour.surface1,
                  borderRadius: radius.md,
                  padding: 12,
                  marginBottom: 8,
                }}
                onPress={() => console.log("Selected:", result)}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.sm,
                    backgroundColor: colour.primary50,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{result.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.labelM, color: colour.primary, marginBottom: 2 }}>
                    {result.title}
                  </Text>
                  <Text style={{ ...typography.bodyXS, color: colour.textSub }}>{result.subtitle}</Text>
                </View>
                <View
                  style={{
                    backgroundColor: colour.surface2,
                    borderRadius: radius.sm,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ ...typography.micro, fontWeight: "600", color: colour.primary }}>
                    {result.type === "expense"
                      ? "Expense"
                      : result.type === "category"
                        ? "Category"
                        : "Report"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
