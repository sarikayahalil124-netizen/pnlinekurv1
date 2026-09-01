import React from "react";
import { View } from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { useTheme } from "@/src/theme/ThemeContext";

interface Props {
  seriesA: number[];
  seriesB: number[];
  colorA: string;
  colorB: string;
  width: number;
  height: number;
}

// Normalize a series to percentage change from its first value.
function toPct(arr: number[]): number[] {
  if (!arr.length) return [];
  const base = arr[0] || 1;
  return arr.map((v) => (v / base - 1) * 100);
}

/** Overlays two products on one chart, each normalized to % change from start,
 *  so assets with very different price scales can be compared side by side. */
export function CompareChart({ seriesA, seriesB, colorA, colorB, width, height }: Props) {
  const { colors } = useTheme();
  const a = toPct(seriesA);
  const b = toPct(seriesB);
  if (a.length < 2 || b.length < 2) return null;

  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const all = [...a, ...b, 0];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const path = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = pad + (i / (arr.length - 1)) * w;
        const y = pad + (1 - (v - min) / range) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

  // zero baseline
  const zeroY = pad + (1 - (0 - min) / range) * h;

  return (
    <View>
      <Svg width={width} height={height}>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line key={f} x1={pad} y1={pad + f * h} x2={width - pad} y2={pad + f * h} stroke={colors.border} strokeWidth={1} />
        ))}
        <Line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} stroke={colors.textTertiary} strokeWidth={1} strokeDasharray="3,3" />
        <Path d={path(b)} stroke={colorB} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={path(a)} stroke={colorA} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
