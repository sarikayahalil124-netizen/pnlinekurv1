import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { useFavorites } from "@/src/context/FavoritesContext";
import { useSettings } from "@/src/context/SettingsContext";
import { api } from "@/src/api/client";
import { LineChart } from "@/src/components/LineChart";
import { CandleChart, Candle } from "@/src/components/CandleChart";
import { StatusPill } from "@/src/components/StatusPill";
import { formatNumber, providerTimeOnly } from "@/src/utils/format";
import { useI18n } from "@/src/i18n";

const RANGES = [
  { label: "1s", value: "1s" },
  { label: "6s", value: "6s" },
  { label: "12s", value: "12s" },
  { label: "1G", value: "1G" },
  { label: "1H", value: "1H" },
  { label: "1A", value: "1A" },
];

export default function ProductDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isFavorite, toggle } = useFavorites();
  const { extraDecimals } = useSettings();
  const { t } = useI18n();

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("1G");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [ma, setMa] = useState<number[]>([]);
  const [chartType, setChartType] = useState<"line" | "candle">("line");
  const [chartLoading, setChartLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.getPrice(String(code));
      setDetail(d);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Veri Yok");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    (async () => {
      setChartLoading(true);
      try {
        const h = await api.getCandles(String(code), range);
        setCandles(h.candles || []);
        setMa(h.ma || []);
      } catch {
        setCandles([]);
        setMa([]);
      } finally {
        setChartLoading(false);
      }
    })();
  }, [code, range]);

  const fav = isFavorite(String(code));

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
      <Pressable testID="detail-back" onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
        {detail?.name || code}
      </Text>
      <Pressable testID="detail-fav" onPress={() => toggle(String(code))} hitSlop={10} style={styles.favBtn}>
        <Ionicons name={fav ? "star" : "star-outline"} size={22} color={fav ? colors.gold : colors.textSecondary} />
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {Header}
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {Header}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.textTertiary} />
          <Text style={[styles.centerTxt, { color: colors.text }]}>{t("product.noData")}</Text>
        </View>
      </View>
    );
  }

  const dec = detail.decimals + (extraDecimals ? 1 : 0);

  const Stat = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: accent || colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <Text style={[styles.heroCode, { color: colors.textSecondary }]}>{detail.code}</Text>
            <StatusPill status={detail.status} />
          </View>
          <View style={styles.heroPrices}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>{t("product.buy")}</Text>
              <Text style={[styles.heroValue, { color: colors.text }]}>{formatNumber(detail.buy, dec)}</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>{t("product.sell")}</Text>
              <Text style={[styles.heroValue, { color: colors.text }]}>{formatNumber(detail.sell, dec)}</Text>
            </View>
          </View>
          {detail.manual && (
            <View style={[styles.manualTag, { backgroundColor: colors.goldSoft }]}>
              <Ionicons name="create-outline" size={13} color={colors.gold} />
              <Text style={[styles.manualTxt, { color: colors.gold }]}>{t("product.manual")}</Text>
            </View>
          )}
        </View>

        {/* Intraday high / low */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("product.intraday")}</Text>
        <View style={styles.dayRow}>
          <View style={[styles.dayBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.dayLabelRow}>
              <Ionicons name="trending-up" size={14} color={colors.up} />
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{t("product.high")}</Text>
            </View>
            <Text testID="day-high" style={[styles.dayValue, { color: colors.up }]}>{formatNumber(detail.dayHigh, dec)}</Text>
          </View>
          <View style={[styles.dayBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.dayLabelRow}>
              <Ionicons name="trending-down" size={14} color={colors.down} />
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{t("product.low")}</Text>
            </View>
            <Text testID="day-low" style={[styles.dayValue, { color: colors.down }]}>{formatNumber(detail.dayLow, dec)}</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartHead}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>{t("product.chart")}</Text>
          <View style={[styles.typeToggle, { backgroundColor: colors.card2, borderColor: colors.border }]}>
            {(["line", "candle"] as const).map((tp) => (
              <Pressable
                key={tp}
                testID={`chart-type-${tp}`}
                onPress={() => setChartType(tp)}
                style={[styles.typeBtn, chartType === tp && { backgroundColor: colors.gold }]}
              >
                <Ionicons
                  name={tp === "line" ? "pulse" : "stats-chart"}
                  size={13}
                  color={chartType === tp ? colors.onGold : colors.textSecondary}
                />
                <Text style={{ color: chartType === tp ? colors.onGold : colors.textSecondary, fontWeight: "700", fontSize: 11.5 }}>
                  {tp === "line" ? t("product.line") : t("product.candle")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Pressable
              key={r.value}
              testID={`range-${r.value}`}
              onPress={() => setRange(r.value)}
              style={[styles.rangeBtn, { backgroundColor: range === r.value ? colors.gold : colors.card2, borderColor: colors.border }]}
            >
              <Text style={{ color: range === r.value ? colors.onGold : colors.textSecondary, fontWeight: "700", fontSize: 11.5 }}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {chartLoading ? (
            <View style={styles.chartEmpty}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : candles.length >= 2 ? (
            <>
              {chartType === "candle" ? (
                <CandleChart candles={candles} ma={ma} width={width - 64} height={160} />
              ) : (
                <LineChart values={candles.map((c) => c.c)} compare={ma} width={width - 64} height={160} />
              )}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDash, { backgroundColor: colors.gold }]} />
                  <Text style={[styles.legendTxt, { color: colors.textSecondary }]}>{t("product.avgLine")}</Text>
                </View>
              </View>
              <View style={styles.chartCaption}>
                <Text style={[styles.chartCapTxt, { color: colors.down }]}>
                  {t("product.lowest")} {formatNumber(Math.min(...candles.map((c) => c.l)), dec)}
                </Text>
                <Text style={[styles.chartCapTxt, { color: colors.up }]}>
                  {t("product.highest")} {formatNumber(Math.max(...candles.map((c) => c.h)), dec)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.chartEmpty}>
              <Ionicons name="analytics-outline" size={32} color={colors.textTertiary} />
              <Text style={[styles.chartEmptyTxt, { color: colors.textSecondary }]}>
                {t("product.noHistory")}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t("product.details")}</Text>
        <View style={styles.statsGrid}>
          <Stat label={t("product.marketBuy")} value={formatNumber(detail.marketBuy, dec)} />
          <Stat label={t("product.marketSell")} value={formatNumber(detail.marketSell, dec)} />
          <Stat label={t("product.lastUpdate")} value={providerTimeOnly(detail.providerUpdatedAt)} />
          <Stat label={t("product.spread")} value={formatNumber(detail.sell - detail.buy, dec)} accent={colors.gold} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 6 },
  favBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", letterSpacing: -0.3, marginHorizontal: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  centerTxt: { fontSize: 15, fontWeight: "600" },
  hero: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroCode: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  heroPrices: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  heroLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  heroValue: { fontSize: 26, fontWeight: "800", marginTop: 4, fontVariant: ["tabular-nums"], letterSpacing: -0.5 },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 40 },
  manualTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 14, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  manualTxt: { fontSize: 11.5, fontWeight: "700" },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: 24, marginBottom: 10, marginLeft: 2 },
  dayRow: { flexDirection: "row", gap: 10 },
  dayBox: { flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  dayLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dayLabel: { fontSize: 12, fontWeight: "600" },
  dayValue: { fontSize: 19, fontWeight: "800", marginTop: 6, fontVariant: ["tabular-nums"], letterSpacing: -0.3 },
  chartCaption: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 2 },
  chartCapTxt: { fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  chartHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeToggle: { flexDirection: "row", borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, padding: 2, gap: 2, marginTop: 24 },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7 },
  legendRow: { flexDirection: "row", marginTop: 10, paddingHorizontal: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDash: { width: 16, height: 3, borderRadius: 2 },
  legendTxt: { fontSize: 11.5, fontWeight: "600" },
  rangeRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  rangeBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth },
  chartCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, minHeight: 180, justifyContent: "center" },
  chartEmpty: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 30 },
  chartEmptyTxt: { fontSize: 13, textAlign: "center", lineHeight: 19, paddingHorizontal: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "47%", flexGrow: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  statLabel: { fontSize: 12, fontWeight: "600" },
  statValue: { fontSize: 17, fontWeight: "700", marginTop: 6, fontVariant: ["tabular-nums"] },
});
