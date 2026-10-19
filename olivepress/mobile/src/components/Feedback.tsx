import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { useI18n } from '../i18n';

export function LoadingView({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.olive} />
      <Text style={styles.text}>{label ?? t('Chargement...')}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'leaf-outline',
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={42} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.text}>{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={42} color={colors.danger} />
      <Text style={styles.emptyTitle}>{t('Oups')}</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <Text style={styles.retry} onPress={onRetry}>{t('Réessayer')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  text: { marginTop: spacing.sm, color: colors.textSecondary, textAlign: 'center' },
  emptyTitle: { marginTop: spacing.md, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  retry: { marginTop: spacing.lg, color: colors.olive, fontWeight: '700', fontSize: 15 },
});
