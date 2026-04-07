import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface SearchResult {
  id: string;
  type: "expense" | "category" | "report";
  title: string;
  subtitle: string;
  icon: string;
}

const SAMPLE_RESULTS: SearchResult[] = [
  {
    id: "1",
    type: "expense",
    title: "Uber to meeting",
    subtitle: "Travel • 15 Mar 2026",
    icon: "🚗",
  },
  {
    id: "2",
    type: "expense",
    title: "Coffee with client",
    subtitle: "Meals • 14 Mar 2026",
    icon: "☕",
  },
  {
    id: "3",
    type: "category",
    title: "Travel",
    subtitle: "23 expenses • R8,420 saved",
    icon: "✈️",
  },
  {
    id: "4",
    type: "report",
    title: "March 2026 Report",
    subtitle: "18 expenses • R4,280 saved",
    icon: "📊",
  },
];

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length > 0) {
      const filtered = SAMPLE_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(text.toLowerCase()) ||
          r.subtitle.toLowerCase().includes(text.toLowerCase()),
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchBox}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses, categories, reports..."
          placeholderTextColor="#757575"
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <ThemedText style={styles.clearButton}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {query.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>🔎</ThemedText>
            <ThemedText style={styles.emptyTitle}>Start searching</ThemedText>
            <ThemedText style={styles.emptyText}>
              Find expenses, categories, or reports
            </ThemedText>

            {/* Recent searches */}
            <View style={styles.recentSection}>
              <ThemedText style={styles.recentTitle}>
                Recent Searches
              </ThemedText>
              {["Travel", "Coffee", "Office supplies"].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.recentItem}
                  onPress={() => handleSearch(item)}
                >
                  <ThemedText style={styles.recentItemText}>{item}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.noResults}>
            <ThemedText style={styles.noResultsIcon}>🤷</ThemedText>
            <ThemedText style={styles.noResultsTitle}>No results</ThemedText>
            <ThemedText style={styles.noResultsText}>
              Try a different search term
            </ThemedText>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {results.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.resultItem}
                onPress={() => console.log("Selected:", result)}
              >
                <View style={styles.resultIcon}>
                  <ThemedText style={styles.resultIconEmoji}>
                    {result.icon}
                  </ThemedText>
                </View>

                <View style={styles.resultContent}>
                  <ThemedText style={styles.resultTitle}>
                    {result.title}
                  </ThemedText>
                  <ThemedText style={styles.resultSubtitle}>
                    {result.subtitle}
                  </ThemedText>
                </View>

                <View style={styles.resultType}>
                  <ThemedText style={styles.resultTypeText}>
                    {result.type === "expense"
                      ? "Expense"
                      : result.type === "category"
                        ? "Category"
                        : "Report"}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0D47A1",
  },
  clearButton: {
    fontSize: 18,
    color: "#757575",
    marginLeft: 8,
  },
  scrollContent: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D47A1",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#757575",
    marginBottom: 40,
  },
  recentSection: {
    alignItems: "center",
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  recentItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentItemText: {
    fontSize: 13,
    color: "#0288D1",
    fontWeight: "600",
  },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  noResultsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0D47A1",
    marginBottom: 4,
  },
  noResultsText: {
    fontSize: 13,
    color: "#757575",
  },
  resultsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(2,136,209,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultIconEmoji: {
    fontSize: 18,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0D47A1",
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 11,
    color: "#757575",
  },
  resultType: {
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resultTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1565C0",
  },
});
