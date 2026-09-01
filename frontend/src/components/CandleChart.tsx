import React from "react";
import { View } from "react-native";
import Svg, { Path, Line, Rect } from "react-native-svg";
import { useTheme } from "@/src/theme/ThemeContext";

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  ts: string;
}

interface Props {
  candles: Candle[];
  ma?: number[];
  width: number;
  height: number;
  showMa?: boolean;
}

export function CandleChart({ candles, ma, width, height, showMa = true }: Props) {
  const { colors } = useTheme();
  if (!candles || candles.length < 2) return null;

  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const min = Math.min(...lows, ...(ma && ma.length ? ma : lows));
  const max = Math.max(...highs, ...(ma && ma.length ? ma : highs));
  const range = max - min || 1;

  const n = candles.length;
  const slot = w / n;
  const bodyW = Math.max(2, Math.min(slot * 0.6, 10));

  const yOf = (v: number) => pad + (1 - (v - min) / range) * h;
  const xOf = (i: number) => pad + slot * i + slot / 2;

  // moving-average comparison polyline
  let maPath = "";
  if (showMa && ma && ma.length === n) {
    maPath = ma
      .map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(2)},${yOf(v).toFixed(2)}`)
      .join(" ");
  }

  return (
    <View>
      <Svg width={width} height={height}>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1={pad}
            y1={pad + f * h}
            x2={width - pad}
            y2={pad + f * h}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {candles.map((c, i) => {
          const up = c.c >= c.o;
          const col = up ? colors.up : colors.down;
          const x = xOf(i);
          const yHigh = yOf(c.h);
          const yLow = yOf(c.l);
          const yO = yOf(c.o);
          const yC = yOf(c.c);
          const top = Math.min(yO, yC);
          const bodyH = Math.max(1.5, Math.abs(yC - yO));
          return (
            <React.Fragment key={i}>
              <Line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={col} strokeWidth={1.2} />
              <Rect x={x - bodyW / 2} y={top} width={bodyW} height={bodyH} rx={1} fill={col} />
            </React.Fragment>
          );
        })}
        {maPath ? (
          <Path
            d={maPath}
            stroke={colors.gold}
            strokeWidth={1.8}
            fill="none"
            strokeDasharray="5,4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}
