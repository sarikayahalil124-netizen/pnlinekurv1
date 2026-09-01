import React from "react";
import { View } from "react-native";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { useTheme } from "@/src/theme/ThemeContext";

interface Props {
  values: number[];
  width: number;
  height: number;
  compare?: number[];
}

export function LineChart({ values, width, height, compare }: Props) {
  const { colors } = useTheme();
  if (values.length < 2) return null;

  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const all = compare && compare.length ? [...values, ...compare] : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const toXY = (arr: number[]) =>
    arr.map((v, i) => {
      const x = pad + (i / (arr.length - 1)) * w;
      const y = pad + (1 - (v - min) / range) * h;
      return { x, y };
    });

  const points = toXY(values);

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  const stroke = up ? colors.up : colors.down;
  const last = points[points.length - 1];

  let cmpPath = "";
  if (compare && compare.length === values.length) {
    cmpPath = toXY(compare).map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  }

  return (
    <View>
      <Svg width={width} height={height}>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line key={f} x1={pad} y1={pad + f * h} x2={width - pad} y2={pad + f * h} stroke={colors.border} strokeWidth={1} />
        ))}
        <Path
          d={`${d} L${last.x.toFixed(2)},${(height - pad).toFixed(2)} L${points[0].x.toFixed(2)},${(height - pad).toFixed(2)} Z`}
          fill={stroke}
          fillOpacity={0.08}
        />
        {cmpPath ? (
          <Path d={cmpPath} stroke={colors.gold} strokeWidth={1.8} fill="none" strokeDasharray="5,4" strokeLinejoin="round" strokeLinecap="round" />
        ) : null}
        <Path d={d} stroke={stroke} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={last.x} cy={last.y} r={3.5} fill={stroke} />
      </Svg>
    </View>
  );
}
