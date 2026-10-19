import React, { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { ListRow } from '../components/ListRow';
import { Badge } from '../components/Badge';
import { LoadingView, EmptyState } from '../components/Feedback';
import { apportsApi } from '../api/services';
import { Apport } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { formatDateTime, formatKg } from '../utils/format';

const CLOSED: Apport['status'][] = ['LIVRAISON', 'CLOTURE'];

export function ProductionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { can } = useAuth();
  const { t } = useI18n();
  const [apports, setApports] = useState<Apport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apportsApi.list({ size: 100 });
      setApports(res.content);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingView />;

  const inProgress = apports.filter((a) => !CLOSED.includes(a.status));
  const finished = apports.filter((a) => CLOSED.includes(a.status));

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.olive} />}>
      <Text style={styles.title}>{t('Suivi de production')}</Text>
      <Text style={styles.subtitle}>{t("Avancement des apports traités à l'huilerie.")}</Text>

      <SectionHeader title={t('En cours ({count})', { count: inProgress.length })} />
      {inProgress.length === 0 ? (
        <EmptyState icon="construct-outline" title={t('Aucune opération en cours')} />
      ) : (
        inProgress.map((a) => (
          <ListRow
            key={a.id}
            icon="construct-outline"
            title={`${a.numero} · ${a.clientName}`}
            subtitle={`${formatKg(a.netWeightKg)} · ${formatDateTime(a.receivedAt)}`}
            right={<Badge status={a.status} size="sm" />}
            onPress={() => navigation.navigate('ApportDetail', { id: a.id })}
          />
        ))
      )}

      <SectionHeader title={t('Terminés / livrés ({count})', { count: finished.length })} />
      {finished.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title={t('Aucune opération terminée')} />
      ) : (
        finished.slice(0, 20).map((a) => (
          <ListRow
            key={a.id}
            icon="checkmark-done-outline"
            title={`${a.numero} · ${a.clientName}`}
            subtitle={formatKg(a.netWeightKg)}
            right={<Badge status={a.status} size="sm" />}
            onPress={() => navigation.navigate('ApportDetail', { id: a.id })}
          />
        ))
      )}

      {!can('PRODUCTION_WRITE') ? (
        <Text style={styles.note}>{t('Consultation seule : votre rôle ne permet pas de modifier la production.')}</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  note: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
});
