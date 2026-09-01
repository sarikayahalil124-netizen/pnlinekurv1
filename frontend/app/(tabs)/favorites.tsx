import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { usePrices } from "@/src/context/PricesContext";
import { useFavorites } from "@/src/context/FavoritesContext";
import { PriceRow } from "@/src/components/PriceRow";
import { ColumnsHeader } from "@/src/components/ColumnsHeader";
import { useI18n } from "@/src/i18n";

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items } = usePrices();
  const { favorites } = useFavorites();
  const { t } = useI18n();

  const data = useMemo(() => items.filter((i) => favorites.includes(i.code)), [items, favorites]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t("fav.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("fav.subtitle")}</Text>
      </View>

      {data.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="star-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("fav.emptyTitle")}</Text>
          <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
            {t("fav.emptyTxt")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.code}
          renderItem={({ item }) => <PriceRow item={item} onPress={() => router.push(`/product/${item.code}`)} />}
          ListHeaderComponent={<ColumnsHeader />}
          stickyHeaderIndices={[0]}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyTxt: { fontSize: 13.5, textAlign: "center", lineHeight: 20 },
});
