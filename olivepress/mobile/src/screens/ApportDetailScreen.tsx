import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingView } from '../components/Feedback';
import { apportsApi, facturesApi, productionApi } from '../api/services';
import { Apport, ApportStatus, Facture, ProductionRecord, StatusHistory } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, radius, spacing, statusColors } from '../theme';
import { formatDateTime, formatKg, formatLiters, formatPercent, formatTND } from '../utils/format';
import { shareTicketPdf } from '../utils/pdf';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'ApportDetail'>;

const FLOW: ApportStatus[] = ['RECU', 'EN_ATTENTE', 'TRI', 'PRESSAGE', 'PRODUCTION_TERMINEE', 'STOCKAGE', 'LIVRAISON', 'CLOTURE'];

export function ApportDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { can } = useAuth();
  const { t, locale } = useI18n();
  const [apport, setApport] = useState<Apport | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const statusLabel = (s: ApportStatus | string) => t(statusColors[s]?.label ?? String(s));

  const load = useCallback(async () => {
    try {
      const [a, h, p, f] = await Promise.all([
        apportsApi.get(params.id),
        apportsApi.history(params.id),
        productionApi.byApport(params.id),
        facturesApi.byApport(params.id).catch(() => null),
      ]);
      setApport(a);
      setHistory(h);
      setProduction(p);
      setFacture(f);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const changeStatus = async (status: ApportStatus) => {
    setBusy(true);
    try {
      await apportsApi.updateStatus(params.id, status);
      await load();
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const shareTicket = async () => {
    if (!apport) return;
    const text =
      `${t("TICKET D'APPORT")} - OlivePress\n` +
      `N° : ${apport.numero}\n` +
      `${t('Ticket')} : ${apport.ticketNumber ?? '-'}\n` +
      `${t('Client')} : ${apport.clientName}\n` +
      `${t('Date')} : ${formatDateTime(apport.receivedAt)}\n` +
      `${t('Poids brut')} : ${formatKg(apport.grossWeightKg)}\n` +
      `${t('Tare')} : ${formatKg(apport.tareKg)}\n` +
      `${t('Poids net')} : ${formatKg(apport.netWeightKg)}\n` +
      `${t('Statut')} : ${statusLabel(apport.status)}`;
    await Share.share({ message: text, title: `${t('Apports')} ${apport.numero}` });
  };

  const exportPdf = async () => {
    if (!apport) return;
    try {
      await shareTicketPdf(apport, locale);
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    }
  };

  if (loading || !apport) return <LoadingView />;

  const canWrite = can('PRODUCTION_WRITE');

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.olive} />}>
      <Card>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.numero}>{apport.numero}</Text>
            <Text style={styles.client}>{apport.clientName}</Text>
          </View>
          <Badge status={apport.status} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t('Poids brut')}</Text>
            <Text style={styles.statValue}>{formatKg(apport.grossWeightKg)}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t('Tare')}</Text>
            <Text style={styles.statValue}>{formatKg(apport.tareKg)}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t('Poids net')}</Text>
            <Text style={[styles.statValue, { color: colors.olive }]}>{formatKg(apport.netWeightKg)}</Text>
          </View>
        </View>

        <InfoLine icon="time-outline" label={t('Réception')} value={formatDateTime(apport.receivedAt)} />
        <InfoLine icon="barcode-outline" label={t('Ticket')} value={apport.ticketNumber ?? '-'} />
        <InfoLine icon="person-outline" label={t('Employé')} value={apport.employeeName ?? '-'} />
        {apport.observations ? (
          <InfoLine icon="document-text-outline" label={t('Observations')} value={apport.observations} />
        ) : null}

        <View style={styles.actions}>
          <Button title={t('Partager le ticket')} variant="outline" small onPress={shareTicket}
            icon={<Ionicons name="share-outline" size={18} color={colors.olive} />} style={{ flex: 1 }} />
          <Button title={t('PDF')} variant="outline" small onPress={exportPdf}
            icon={<Ionicons name="document-outline" size={18} color={colors.olive} />} style={{ flex: 1, marginLeft: spacing.sm }} />
          {can('APPORT_WRITE') ? (
            <Button
              title={t('Modifier')}
              variant="outline"
              small
              icon={<Ionicons name="create-outline" size={18} color={colors.olive} />}
              onPress={() => navigation.navigate('ApportForm', { apport })}
              style={{ marginLeft: spacing.sm }}
            />
          ) : null}
        </View>
      </Card>

      {facture ? (
        <>
          <SectionHeader title={t('Facture automatique')} />
          <Card>
            <View style={styles.factureRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.factureNumero}>{facture.numero}</Text>
                <Text style={styles.factureDesc}>{facture.lines[0]?.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.factureTotal}>{formatTND(facture.totalAmount)}</Text>
                <Badge status={facture.statut} />
              </View>
            </View>
            <Button
              title={t('Voir la facture')}
              variant="outline"
              small
              icon={<Ionicons name="receipt-outline" size={18} color={colors.olive} />}
              onPress={() => navigation.navigate('FactureDetail', { id: facture.id })}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </>
      ) : null}

      {canWrite ? (
        <>
          <SectionHeader title={t('Avancement de la production')} />
          <Card>
            <View style={styles.flow}>
              {FLOW.map((s, i) => {
                const currentIdx = FLOW.indexOf(apport.status);
                const done = currentIdx >= i && currentIdx !== -1;
                return (
                  <View key={s} style={styles.flowStep}>
                    <View style={[styles.flowDot, done && styles.flowDotDone]}>
                      {done ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
                    </View>
                    <Text style={[styles.flowLabel, done && styles.flowLabelDone]}>
                      {statusLabel(s)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.nextTitle}>{t('Choisir une nouvelle étape')}</Text>
            <View style={styles.statusButtons}>
              {FLOW.filter((s) => s !== apport.status).map((s) => (
                <TouchableOpacity
                  key={s}
                  disabled={busy}
                  style={[styles.statusBtn, { backgroundColor: statusColors[s]?.bg ?? colors.softGray }]}
                  onPress={() => changeStatus(s)}
                >
                  <Text style={[styles.statusBtnText, { color: statusColors[s]?.fg ?? colors.textSecondary }]}>
                    {statusLabel(s)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                disabled={busy}
                style={[styles.statusBtn, { backgroundColor: statusColors.ANOMALIE.bg }]}
                onPress={() => changeStatus('ANOMALIE')}
              >
                <Text style={[styles.statusBtnText, { color: statusColors.ANOMALIE.fg }]}>{t('Signaler anomalie')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </>
      ) : null}

      {can('PRODUCTION_WRITE') ? (
        <Button
          title={t('Enregistrer la production & rendement')}
          onPress={() =>
            navigation.navigate('YieldForm', {
              apportId: apport.id,
              apportNumero: apport.numero,
              netWeightKg: Number(apport.netWeightKg),
            })
          }
          style={{ marginTop: spacing.lg }}
          icon={<Ionicons name="speedometer-outline" size={18} color={colors.white} />}
        />
      ) : null}

      {production.length > 0 ? (
        <>
          <SectionHeader title={t('Production enregistrée')} />
          {production.map((p) => (
            <Card key={p.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.prodRow}>
                <Text style={styles.prodDate}>{p.productionDate}</Text>
                <Text style={styles.prodYield}>{formatPercent(p.yieldPercent)}</Text>
              </View>
              <Text style={styles.prodDetail}>
                {t('{kg} traitées → {liters} d’huile', { kg: formatKg(p.olivesProcessedKg), liters: formatLiters(p.oilObtainedL) })}
              </Text>
              {p.notes ? <Text style={styles.prodNote}>{p.notes}</Text> : null}
            </Card>
          ))}
        </>
      ) : null}

      <SectionHeader title={t('Historique des étapes')} />
      <Card>
        {history.length === 0 ? (
          <Text style={styles.empty}>{t('Aucun changement.')}</Text>
        ) : (
          history.map((h, i) => (
            <View key={h.id} style={[styles.histRow, i < history.length - 1 && styles.histBorder]}>
              <View style={styles.histDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.histTitle}>
                  {h.fromStatus ? `${statusLabel(h.fromStatus)} → ` : ''}
                  {statusLabel(h.toStatus)}
                </Text>
                <Text style={styles.histMeta}>{formatDateTime(h.changedAt)} · {h.userName ?? '-'}</Text>
                {h.comment ? <Text style={styles.histComment}>{h.comment}</Text> : null}
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function InfoLine({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  numero: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  client: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', marginTop: spacing.lg, marginBottom: spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.softGray, paddingVertical: spacing.md,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  infoLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: colors.textSecondary, marginLeft: spacing.sm, width: 90 },
  infoValue: { fontSize: 13, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', marginTop: spacing.lg },
  flow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  flowStep: { width: '25%', alignItems: 'center', marginBottom: spacing.sm },
  flowDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.softGray,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  flowDotDone: { backgroundColor: colors.olive, borderColor: colors.olive },
  flowLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  flowLabelDone: { color: colors.olive, fontWeight: '600' },
  nextTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap' },
  statusBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, marginRight: spacing.sm, marginBottom: spacing.sm },
  statusBtnText: { fontSize: 13, fontWeight: '600' },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prodDate: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  prodYield: { fontSize: 14, fontWeight: '800', color: colors.success },
  prodDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  prodNote: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  factureRow: { flexDirection: 'row', alignItems: 'center' },
  factureNumero: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  factureDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  factureTotal: { fontSize: 16, fontWeight: '800', color: colors.olive },
  histRow: { flexDirection: 'row', paddingVertical: spacing.sm },
  histBorder: { borderBottomWidth: 1, borderBottomColor: colors.softGray },
  histDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.olive, marginTop: 5, marginRight: spacing.md },
  histTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  histMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  histComment: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  empty: { color: colors.textMuted, fontSize: 13 },
});
