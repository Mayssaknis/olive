import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
  hint?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, accent = colors.olive, hint, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconCircle, { backgroundColor: `${accent}1A` }]}>
            <Ionicons name={icon} size={18} color={accent} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.softGray,
    ...shadow.card,
    minHeight: 96,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  iconCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  label: { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  value: { fontSize: 20, fontWeight: '800' },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
