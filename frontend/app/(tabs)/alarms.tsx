import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Switch, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { usePrices } from "@/src/context/PricesContext";
import { useAlarms, Alarm, AlarmEvent } from "@/src/context/AlarmsContext";
import { Sheet } from "@/src/components/Sheet";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { requestPushForAlarms } from "@/src/utils/push";
import { formatNumber, formatTime, formatDateTime, parseTR } from "@/src/utils/format";
import { useI18n } from "@/src/i18n";

export default function AlarmsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, byCode } = usePrices();
  const { alarms, history, add, remove, toggle } = useAlarms();
  const { t } = useI18n();

  const [tab, setTab] = useState<"active" | "history">("active");
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [code, setCode] = useState("USD");
  const [basis, setBasis] = useState<"buy" | "sell">("sell");
  const [condition, setCondition] = useState<">" | "<">(">");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const asset = useMemo(() => items.find((i) => i.code === code), [items, code]);

  const submit = async () => {
    const t = parseTR(target);
    if (!asset || isNaN(t) || t <= 0 || saving) return;
    setSaving(true);
    try {
      await add({ code: asset.code, name: asset.name, basis, condition, target: t });
      setTarget("");
      setOpen(false);
      // Contextual permission request — user just created an alarm.
      requestPushForAlarms();
    } finally {
      setSaving(false);
    }
  };

  const renderAlarm = ({ item: a }: { item: Alarm }) => {
    const cur = byCode(a.code);
    const price = cur ? (a.basis === "buy" ? cur.buy : cur.sell) : null;
    const triggered = !!a.triggeredAt && a.active;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: triggered ? colors.gold : colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardName, { color: colors.text }]}>{a.name}</Text>
            {triggered && (
              <View style={[styles.trigTag, { backgroundColor: colors.gold + "22" }]}>
                <Ionicons name="notifications" size={12} color={colors.gold} />
                <Text style={[styles.trigTxt, { color: colors.gold }]}>{t("alarm.triggered")}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardCond, { color: colors.textSecondary }]}>
            {a.basis === "buy" ? t("product.buy") : t("product.sell")} {a.condition} {formatNumber(a.target, cur?.decimals ?? 2)}
            {price != null && <Text style={{ color: colors.textTertiary }}>  ·  {t("common.now")} {formatNumber(price, cur?.decimals ?? 2)}</Text>}
          </Text>
          {triggered && <Text style={[styles.trigTime, { color: colors.textTertiary }]}>{formatTime(a.triggeredAt)}</Text>}
        </View>
        <Switch
          testID={`alarm-toggle-${a.id}`}
          value={a.active}
          onValueChange={() => toggle(a.id)}
          trackColor={{ true: colors.gold, false: colors.border }}
          thumbColor="#fff"
        />
        <Pressable testID={`alarm-delete-${a.id}`} onPress={() => remove(a.id)} hitSlop={8} style={{ marginLeft: 10 }}>
          <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
    );
  };

  const renderHistory = ({ item: h }: { item: AlarmEvent }) => {
    const dirColor = h.condition === ">" ? colors.up : colors.down;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.histIcon, { backgroundColor: dirColor + "1F" }]}>
          <Ionicons name={h.condition === ">" ? "trending-up" : "trending-down"} size={18} color={dirColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: colors.text }]}>{h.name}</Text>
          <Text style={[styles.cardCond, { color: colors.textSecondary }]}>
            {h.basis === "buy" ? t("product.buy") : t("product.sell")} {h.condition} {formatNumber(h.target, h.decimals)}
            <Text style={{ color: dirColor }}>  ·  {formatNumber(h.price, h.decimals)}</Text>
          </Text>
          <Text style={[styles.trigTime, { color: colors.textTertiary }]}>{formatDateTime(h.triggeredAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t("alarm.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("alarm.subtitle")}</Text>
        <View style={{ marginTop: 12 }}>
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as "active" | "history")}
            options={[
              { label: t("alarm.active"), value: "active" },
              { label: `${t("alarm.history")}${history.length ? ` (${history.length})` : ""}`, value: "history" },
            ]}
          />
        </View>
      </View>

      {tab === "history" ? (
        history.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("alarm.emptyHistTitle")}</Text>
            <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>{t("alarm.emptyHistTxt")}</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(h) => h.id}
            renderItem={renderHistory}
            contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
          />
        )
      ) : alarms.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("alarm.emptyActiveTitle")}</Text>
          <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>{t("alarm.emptyActiveTxt")}</Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(a) => a.id}
          renderItem={renderAlarm}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
        />
      )}

      {tab === "active" && (
        <Pressable
          testID="add-alarm-btn"
          onPress={() => setOpen(true)}
          style={[styles.fab, { backgroundColor: colors.gold, bottom: 16 }]}
        >
          <Ionicons name="add" size={22} color={colors.onGold} />
          <Text style={[styles.fabTxt, { color: colors.onGold }]}>{t("alarm.addBtn")}</Text>
        </Pressable>
      )}

      {/* Create sheet */}
      <Sheet visible={open} onClose={() => setOpen(false)} title={t("alarm.new")}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={[styles.fLabel, { color: colors.textSecondary }]}>{t("alarm.product")}</Text>
          <Pressable testID="alarm-asset" onPress={() => setPickerOpen(true)} style={[styles.selectRow, { backgroundColor: colors.card2, borderColor: colors.border }]}>
            <Text style={[styles.selectTxt, { color: colors.text }]}>{asset ? `${asset.name} (${asset.code})` : t("common.select")}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>

          <Text style={[styles.fLabel, { color: colors.textSecondary }]}>{t("alarm.priceType")}</Text>
          <View style={[styles.toggleRow, { backgroundColor: colors.card2, borderColor: colors.border }]}>
            {(["buy", "sell"] as const).map((b) => (
              <Pressable key={b} testID={`alarm-basis-${b}`} onPress={() => setBasis(b)} style={[styles.toggleBtn, basis === b && { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
                <Text style={{ color: basis === b ? colors.text : colors.textSecondary, fontWeight: basis === b ? "700" : "500" }}>{b === "buy" ? t("product.buy") : t("product.sell")}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fLabel, { color: colors.textSecondary }]}>{t("alarm.condition")}</Text>
          <View style={[styles.toggleRow, { backgroundColor: colors.card2, borderColor: colors.border }]}>
            {([">", "<"] as const).map((c) => (
              <Pressable key={c} testID={`alarm-cond-${c === ">" ? "gt" : "lt"}`} onPress={() => setCondition(c)} style={[styles.toggleBtn, condition === c && { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
                <Text style={{ color: condition === c ? colors.text : colors.textSecondary, fontWeight: condition === c ? "700" : "500" }}>
                  {c === ">" ? t("alarm.above") : t("alarm.below")}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fLabel, { color: colors.textSecondary }]}>{t("alarm.target")}</Text>
          <TextInput
            testID="alarm-target"
            value={target}
            onChangeText={setTarget}
            placeholder="Örn. 50,00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: colors.card2, borderColor: colors.border, color: colors.text }]}
          />

          <Pressable testID="alarm-save" onPress={submit} style={[styles.saveBtn, { backgroundColor: colors.gold, opacity: saving ? 0.7 : 1 }]}>
            <Text style={{ color: colors.onGold, fontWeight: "800", fontSize: 15 }}>{t("alarm.create")}</Text>
          </Pressable>
          <View style={styles.noteRow}>
            <Ionicons name="notifications-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.noteTxt, { color: colors.textTertiary }]}>
              {t("alarm.note")}
            </Text>
          </View>
        </ScrollView>
      </Sheet>

      {/* Asset picker */}
      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title={t("alarm.product")}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.code}
          style={{ maxHeight: 420 }}
          renderItem={({ item }) => (
            <Pressable
              testID={`alarm-pick-${item.code}`}
              onPress={() => {
                setCode(item.code);
                setPickerOpen(false);
              }}
              style={[styles.pickRow, { borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.pickName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.pickCode, { color: colors.textSecondary }]}>{item.code}</Text>
              </View>
              {item.code === code && <Ionicons name="checkmark" size={20} color={colors.gold} />}
            </Pressable>
          )}
        />
      </Sheet>
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
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14 },
  histIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontSize: 15, fontWeight: "700" },
  trigTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  trigTxt: { fontSize: 11, fontWeight: "700" },
  cardCond: { fontSize: 13, marginTop: 4, fontVariant: ["tabular-nums"] },
  trigTime: { fontSize: 11.5, marginTop: 2, fontVariant: ["tabular-nums"] },
  fab: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999 },
  fabTxt: { fontSize: 15, fontWeight: "800" },
  fLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 16, marginBottom: 8 },
  selectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  selectTxt: { fontSize: 15, fontWeight: "600" },
  toggleRow: { flexDirection: "row", borderRadius: 12, padding: 3, gap: 3, borderWidth: StyleSheet.hairlineWidth },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  input: { fontSize: 18, fontWeight: "700", padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, fontVariant: ["tabular-nums"] },
  saveBtn: { marginTop: 24, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 12, paddingHorizontal: 4 },
  noteTxt: { fontSize: 12, lineHeight: 17, flex: 1 },
  pickRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  pickName: { fontSize: 15, fontWeight: "600" },
  pickCode: { fontSize: 12, marginTop: 2 },
});
