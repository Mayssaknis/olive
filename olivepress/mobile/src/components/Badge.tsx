import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { statusColors, colors, radius, spacing } from '../theme';
import { useI18n } from '../i18n';

interface Props {
  status: string;
  labelOverride?: string;
  size?: 'sm' | 'md';
}

export function Badge({ status, labelOverride, size = 'md' }: Props) {
  const { t } = useI18n();
  const conf = statusColors[status] ?? { bg: colors.softGray, fg: colors.textSecondary, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: conf.bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: conf.fg }, size === 'sm' && styles.smText]}>
        {t(labelOverride ?? conf.label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  sm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  text: { fontSize: 13, fontWeight: '600' },
  smText: { fontSize: 11 },
});
