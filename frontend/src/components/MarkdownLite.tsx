import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  text: string;
  color: string;
  accent: string;
  muted: string;
  size?: number;
}

// Render **bold** inline segments within a line.
function renderInline(line: string, color: string, size: number, weight: "400" | "600") {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <Text key={i} style={{ color, fontSize: size, fontWeight: "800" }}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={i} style={{ color, fontSize: size, fontWeight: weight, lineHeight: size * 1.45 }}>
        {p}
      </Text>
    );
  });
}

/** Lightweight markdown-ish renderer for AI replies: headings, bullets, bold, spacing. */
export function MarkdownLite({ text, color, accent, muted, size = 14.5 }: Props) {
  const lines = (text || "").replace(/\r/g, "").split("\n");

  return (
    <View style={{ gap: 2 }}>
      {lines.map((raw, idx) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={idx} style={{ height: 6 }} />;

        // Heading (## or #)
        const h = line.match(/^#{1,3}\s+(.*)$/);
        if (h) {
          return (
            <Text key={idx} style={[styles.heading, { color: accent, fontSize: size + 2 }]}>
              {h[1].replace(/\*\*/g, "")}
            </Text>
          );
        }

        // Bullet (-, *, •)
        const b = line.match(/^\s*[-*•]\s+(.*)$/);
        if (b) {
          return (
            <View key={idx} style={styles.bulletRow}>
              <View style={[styles.dot, { backgroundColor: accent }]} />
              <Text style={{ flex: 1 }}>{renderInline(b[1], color, size, "400")}</Text>
            </View>
          );
        }

        // A short bold-only line acts as a title
        const boldOnly = line.match(/^\*\*(.+)\*\*[:：]?$/);
        if (boldOnly) {
          return (
            <Text key={idx} style={[styles.heading, { color: accent, fontSize: size + 1 }]}>
              {boldOnly[1]}
            </Text>
          );
        }

        // Paragraph
        return (
          <Text key={idx} style={{ marginTop: 2 }}>
            {renderInline(line, color, size, "400")}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontWeight: "800", marginTop: 6, marginBottom: 2, letterSpacing: -0.2 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
});
