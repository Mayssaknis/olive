import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface BarPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarPoint[];
  height?: number;
  color?: string;
  unit?: string;
  decimals?: number;
}

/**
 * Graphique a barres leger, sans dependance native supplementaire.
 * (Une librairie comme victory-native peut etre branchee plus tard sur les memes donnees.)
 */
export function BarChart({ data, height = 160, color = colors.olive, unit = '', decimals = 1 }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * (height - 24));
          return (
            <View key={i} style={styles.col}>
              <Text style={styles.valueLabel}>{d.value > 0 ? d.value.toFixed(decimals) : ''}</Text>
              <View style={[styles.bar, { height: h, backgroundColor: color }]} />
              <Text style={styles.axisLabel} numberOfLines={1}>{d.label}</Text>
            </View>
          );
        })}
      </View>
      {unit ? <Text style={styles.unit}>(en {unit})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '62%', borderRadius: 4, minHeight: 2 },
  valueLabel: { fontSize: 9, color: colors.textSecondary, marginBottom: 2 },
  axisLabel: { fontSize: 9, color: colors.textMuted, marginTop: 4 },
  unit: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'right' },
});
