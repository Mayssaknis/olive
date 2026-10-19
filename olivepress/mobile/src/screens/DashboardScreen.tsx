import React, { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { SectionHeader } from '../components/SectionHeader';
import { BarChart } from '../components/BarChart';
import { Badge } from '../components/Badge';
import { ListRow } from '../components/ListRow';
import { LoadingView, ErrorState } from '../components/Feedback';
import { dashboardApi } from '../api/services';
import { Dashboard } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { colors, spacing } from '../theme';
import { formatDateTime, formatKg, formatLiters, formatTND, formatNumber, formatPercent } from '../utils/format';
import { useI18n } from '../i18n';

export function DashboardScreen() {
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, can } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await dashboardApi.get();
      setData(res);
    } catch (e) {
      setError(errorMessage(e));
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

  if (!data && !error) return <LoadingView label={t('Chargement du tableau de bord...')} />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const production = (data?.productionByDay ?? []).slice(-7).map((p) => ({
    label: p.date.slice(5),
    value: p.oilL,
  }));
  const yields = (data?.yieldByDay ?? []).slice(-7).map((p) => ({
    label: p.date.slice(5),
    value: p.yieldPercent,
  }));

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.olive} />}
    >
      <Text style={styles.greeting}>{t('Bonjour, {value} 👋', { value: user?.fullName?.split(' ')[0] ?? '' })}</Text>
      <Text style={styles.subGreeting}>{t("Voici l'activité de l'huilerie en temps réel.")}</Text>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <StatCard label={t("Apports aujourd'hui")} value={formatNumber(data!.apportsToday)} icon="leaf-outline" />
          <View style={{ width: spacing.md }} />
          <StatCard label={t('Poids net du jour')} value={formatKg(data!.netWeightTodayKg)} icon="scale-outline" accent={colors.oliveDark} />
        </View>
        <View style={styles.gridRow}>
          <StatCard label={t('Olives traitées')} value={formatKg(data!.olivesProcessedTotalKg)} icon="fitness-outline" accent={colors.info} />
          <View style={{ width: spacing.md }} />
          <StatCard label={t('Huile produite')} value={formatLiters(data!.oilProducedTotalL)} icon="water-outline" accent={colors.info} />
        </View>
        <View style={styles.gridRow}>
          <StatCard label={t('Rendement moyen')} value={formatPercent(data!.avgYieldPercent)} icon="speedometer-outline" accent={colors.success} />
          <View style={{ width: spacing.md }} />
          <StatCard label={t('Opérations en attente')} value={formatNumber(data!.pendingOperations)} icon="time-outline" accent={colors.warning} />
        </View>
        <View style={styles.gridRow}>
          <StatCard label={t("Stock d'huile")} value={formatLiters(data!.availableStockL)} icon="cube-outline" />
        </View>
        {can('FACTURE_READ') ? (
          <>
            <View style={styles.gridRow}>
              <StatCard label={t('Total facturé')} value={formatTND(data!.totalInvoiced)} icon="document-text-outline" accent={colors.oliveDark} />
              <View style={{ width: spacing.md }} />
              <StatCard label={t('Encaissé')} value={formatTND(data!.totalCollected)} icon="cash-outline" accent={colors.success} />
            </View>
            <View style={styles.gridRow}>
              <StatCard label={t('Reste à payer')} value={formatTND(data!.totalRemaining)} icon="alert-circle-outline" accent={colors.danger} />
            </View>
          </>
        ) : null}
      </View>

      <SectionHeader title={t("Production d'huile (7 jours)")} />
      <Card>
        <BarChart data={production} unit="litres" color={colors.olive} />
      </Card>

      <SectionHeader title={t('Rendement (7 jours)')} />
      <Card>
        <BarChart data={yields} unit="%" color={colors.success} decimals={1} />
      </Card>

      {data!.pendingList.length > 0 ? (
        <>
          <SectionHeader title={t('Opérations en cours')} />
          {data!.pendingList.map((op) => (
            <ListRow
              key={op.apportId}
              icon="construct-outline"
              title={`${op.numero} · ${op.clientName}`}
              subtitle={formatKg(op.netWeightKg)}
              right={<Badge status={op.status} size="sm" />}
              onPress={() => navigation.navigate('ApportDetail', { id: op.apportId })}
            />
          ))}
        </>
      ) : null}

      <SectionHeader title={t('Derniers apports')} actionLabel={t('Voir tout')} onAction={() => navigation.navigate('Tabs')} />
      {data!.recentApports.slice(0, 5).map((a) => (
        <ListRow
          key={a.id}
          icon="leaf-outline"
          title={`${a.numero} · ${a.clientName}`}
          subtitle={`${formatKg(a.netWeightKg)} · ${formatDateTime(a.receivedAt)}`}
          onPress={() => navigation.navigate('ApportDetail', { id: a.id })}
          chevron
        />
      ))}

      {can('FACTURE_READ') && data!.unpaidInvoices.length > 0 ? (
        <>
          <SectionHeader title={t('Factures impayées')} actionLabel={t('Voir tout')} onAction={() => navigation.navigate('Factures')} />
          {data!.unpaidInvoices.slice(0, 5).map((f) => (
            <ListRow
              key={f.id}
              icon="receipt-outline"
              title={`${f.numero} · ${f.clientName}`}
              subtitle={t('Reste : {value}', { value: formatTND(f.remainingAmount) })}
              right={<Badge status={f.statut} size="sm" />}
              onPress={() => navigation.navigate('FactureDetail', { id: f.id })}
            />
          ))}
        </>
      ) : null}

      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
        <Text style={styles.footerText}>
          {t('Statistiques calculées en direct depuis la base de données.')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
  grid: { gap: spacing.md },
  gridRow: { flexDirection: 'row' },
  footerNote: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, justifyContent: 'center' },
  footerText: { fontSize: 11, color: colors.textMuted, marginLeft: 4 },
});
