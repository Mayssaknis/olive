import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { DateField } from '../components/DateField';
import { StatCard } from '../components/StatCard';
import { SectionHeader } from '../components/SectionHeader';
import { Button } from '../components/Button';
import { LoadingView, ErrorState, EmptyState } from '../components/Feedback';
import { reportsApi } from '../api/services';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { colors, radius, spacing } from '../theme';
import { formatLiters, formatTND, formatNumber, todayISODate } from '../utils/format';
import { shareReportPdf } from '../utils/pdf';

type ReportType = 'global' | 'reception' | 'production' | 'stock' | 'facturation';

const TYPES: { value: ReportType; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'reception', label: 'Réception' },
  { value: 'production', label: 'Production' },
  { value: 'stock', label: 'Stock' },
  { value: 'facturation', label: 'Facturation' },
];

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export function ReportsScreen() {
  const { t, locale } = useI18n();
  const [type, setType] = useState<ReportType>('global');
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayISODate());
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await reportsApi.get(type, from, to);
      setData(res);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [type, from, to]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.olive} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {TYPES.map((rt) => {
          const active = rt.value === type;
          return (
            <TouchableOpacity key={rt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setType(rt.value)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(rt.label)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Card>
        <View style={styles.datesRow}>
          <View style={{ flex: 1 }}>
            <DateField label={t('Du')} value={from} onChange={setFrom} />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}>
            <DateField label={t('Au')} value={to} onChange={setTo} />
          </View>
        </View>
        <Text style={styles.hint}>{t('Le rapport affiché peut être téléchargé en PDF.')}</Text>
        <Button
          title={t('Télécharger PDF')}
          variant="outline"
          small
          icon={<Ionicons name="download-outline" size={18} color={colors.olive} />}
          disabled={!data || loading}
          onPress={() => {
            if (data) shareReportPdf(data, type, from, to, locale).catch(() => {});
          }}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <EmptyState icon="bar-chart-outline" title={t('Aucune donnée')} />
      ) : (
        <>
          {data.reception ? (
            <>
              <SectionHeader title={t('Réception')} />
              <View style={styles.grid}>
                <View style={styles.gridItem}><StatCard label={t('Apports')} value={formatNumber(data.reception.nombreApports)} icon="download-outline" /></View>
                <View style={styles.gridItem}><StatCard label={t('Poids net')} value={`${formatNumber(data.reception.poidsNetTotalKg)} kg`} icon="scale-outline" /></View>
              </View>
              {data.reception.parStatut ? (
                <Card style={{ marginTop: spacing.md }}>
                  {Object.entries(data.reception.parStatut as Record<string, number>).map(([k, v]) => (
                    <View key={k} style={styles.kv}>
                      <Text style={styles.k}>{k}</Text>
                      <Text style={styles.v}>{formatNumber(v)}</Text>
                    </View>
                  ))}
                </Card>
              ) : null}
            </>
          ) : null}

          {data.production ? (
            <>
              <SectionHeader title={t('Production')} />
              <View style={styles.grid}>
                <View style={styles.gridItem}><StatCard label={t('Olives traitées')} value={`${formatNumber(data.production.olivesTraiteesKg)} kg`} icon="leaf-outline" /></View>
                <View style={styles.gridItem}><StatCard label={t('Huile produite')} value={formatLiters(data.production.huileProduiteL)} icon="water-outline" /></View>
              </View>
              <View style={[styles.grid, { marginTop: spacing.md }]}>
                <View style={styles.gridItem}><StatCard label={t('Rendement moyen')} value={`${formatNumber(data.production.rendementMoyenPourcent, 2)} %`} icon="trending-up-outline" accent={colors.olive} /></View>
              </View>
            </>
          ) : null}

          {data.stock ? (
            <>
              <SectionHeader title={t('Stock')} />
              <View style={styles.grid}>
                <View style={styles.gridItem}><StatCard label={t('Disponible')} value={formatLiters(data.stock.stockDisponibleL)} icon="cube-outline" /></View>
              </View>
              <View style={[styles.grid, { marginTop: spacing.md }]}>
                <View style={styles.gridItem}><StatCard label={t('Entrées')} value={formatLiters(data.stock.entreesL)} icon="arrow-down-outline" accent={colors.success} /></View>
                <View style={styles.gridItem}><StatCard label={t('Sorties')} value={formatLiters(data.stock.sortiesL)} icon="arrow-up-outline" accent={colors.danger} /></View>
              </View>
            </>
          ) : null}

          {data.facturation ? (
            <>
              <SectionHeader title={t('Facturation')} />
              <View style={styles.grid}>
                <View style={styles.gridItem}><StatCard label={t('Total facturé')} value={formatTND(data.facturation.totalFacture)} icon="receipt-outline" /></View>
                <View style={styles.gridItem}><StatCard label={t('Encaissé')} value={formatTND(data.facturation.totalEncaisse)} icon="cash-outline" accent={colors.success} /></View>
              </View>
              <View style={[styles.grid, { marginTop: spacing.md }]}>
                <View style={styles.gridItem}><StatCard label={t('Reste à payer')} value={formatTND(data.facturation.resteAPayer)} icon="alert-circle-outline" accent={colors.danger} /></View>
                <View style={styles.gridItem}><StatCard label={t('Factures impayées')} value={formatNumber(data.facturation.facturesImpayees)} icon="document-text-outline" /></View>
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipsRow: { marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.softGray, marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  datesRow: { flexDirection: 'row' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  grid: { flexDirection: 'row', gap: spacing.md },
  gridItem: { flex: 1 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.softGray },
  k: { fontSize: 13, color: colors.textSecondary },
  v: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
