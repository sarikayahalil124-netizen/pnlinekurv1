import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatTL, formatNumber } from "@/src/utils/format";

export interface ShareCardData {
  totalValue: number | null;
  pl: number | null;
  plPct: number | null;
  goldPct: number;
  currencyPct: number;
  count: number;
  date: string;
  labels: {
    title: string; // "My Portfolio Value"
    pl: string; // "Profit / Loss"
    gold: string;
    currency: string;
    assets: string; // "assets"
  };
}

const CARD_W = 340;

/** A polished, branded card designed to be captured to an image and shared. */
export function ShareCard({ data }: { data: ShareCardData }) {
  const plUp = (data.pl ?? 0) >= 0;
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#12100B", "#1E1A0F", "#0C0B08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="stats-chart" size={16} color="#0C0B08" />
            </View>
            <Text style={styles.brand}>ONLİNE KUR</Text>
          </View>
          <Text style={styles.date}>{data.date}</Text>
        </View>

        <Text style={styles.label}>{data.labels.title}</Text>
        <Text style={styles.value}>{formatTL(data.totalValue, 2)}</Text>

        {data.pl != null && (
          <View style={[styles.plChip, { backgroundColor: plUp ? "#1F3D2B" : "#3D1F22" }]}>
            <Ionicons name={plUp ? "trending-up" : "trending-down"} size={15} color={plUp ? "#4ADE80" : "#F87171"} />
            <Text style={[styles.plTxt, { color: plUp ? "#4ADE80" : "#F87171" }]}>
              {plUp ? "+" : ""}
              {formatNumber(data.pl, 2)} ₺
              {data.plPct != null ? `  (%${formatNumber(Math.abs(data.plPct), 2)})` : ""}
            </Text>
          </View>
        )}

        {/* allocation bar */}
        {data.goldPct + data.currencyPct > 0 && (
          <View style={styles.allocWrap}>
            <View style={styles.allocBar}>
              <View style={{ flex: Math.max(data.goldPct, 0.001), backgroundColor: "#E7B94B" }} />
              <View style={{ flex: Math.max(data.currencyPct, 0.001), backgroundColor: "#4ADE80" }} />
            </View>
            <View style={styles.allocLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: "#E7B94B" }]} />
                <Text style={styles.legendTxt}>{data.labels.gold} %{formatNumber(data.goldPct, 0)}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: "#4ADE80" }]} />
                <Text style={styles.legendTxt}>{data.labels.currency} %{formatNumber(data.currencyPct, 0)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footTxt}>{data.count} {data.labels.assets}</Text>
          <Text style={styles.footBrand}>onlinekur</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: CARD_W },
  card: { width: CARD_W, borderRadius: 24, padding: 22 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 26, height: 26, borderRadius: 8, backgroundColor: "#E7B94B", alignItems: "center", justifyContent: "center" },
  brand: { color: "#E7B94B", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
  date: { color: "#8A8574", fontSize: 12, fontWeight: "600" },
  label: { color: "#B7B1A0", fontSize: 13, fontWeight: "600", marginTop: 22 },
  value: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", marginTop: 6, letterSpacing: -0.5 },
  plChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  plTxt: { fontSize: 14, fontWeight: "800" },
  allocWrap: { marginTop: 22 },
  allocBar: { flexDirection: "row", height: 10, borderRadius: 6, overflow: "hidden" },
  allocLegend: { flexDirection: "row", gap: 18, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 3 },
  legendTxt: { color: "#D6D0BF", fontSize: 12.5, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2A2618" },
  footTxt: { color: "#8A8574", fontSize: 12.5, fontWeight: "600" },
  footBrand: { color: "#5C5849", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
});
