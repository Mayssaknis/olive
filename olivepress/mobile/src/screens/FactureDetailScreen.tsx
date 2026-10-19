import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { SelectField, Option } from '../components/SelectField';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingView } from '../components/Feedback';
import { facturesApi } from '../api/services';
import { Facture, Paiement, PaymentMode } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate, formatDateTime, formatTND, formatNumber } from '../utils/format';
import { shareFacturePdf } from '../utils/pdf';

type Rt = RouteProp<RootStackParamList, 'FactureDetail'>;

export function FactureDetailScreen() {
  const { params } = useRoute<Rt>();
  const { can } = useAuth();
  const { t, locale } = useI18n();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [payments, setPayments] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('ESPECES');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const MODES: Option<PaymentMode>[] = [
    { label: t('Espèces'), value: 'ESPECES' },
    { label: t('Virement'), value: 'VIREMENT' },
    { label: t('Chèque'), value: 'CHEQUE' },
    { label: t('Carte'), value: 'CARTE' },
    { label: t('Autre'), value: 'AUTRE' },
  ];

  const load = useCallback(async () => {
    try {
      const [f, p] = await Promise.all([facturesApi.get(params.id), facturesApi.payments(params.id)]);
      setFacture(f);
      setPayments(p);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openPayment = () => {
    setAmount(facture ? String(facture.remainingAmount) : '');
    setMode('ESPECES');
    setReference('');
    setModal(true);
  };

  const submitPayment = async () => {
    const a = parseFloat(amount.replace(',', '.'));
    if (isNaN(a) || a <= 0) {
      Alert.alert(t('Erreur'), t('Montant invalide.'));
      return;
    }
    setSaving(true);
    try {
      await facturesApi.pay(params.id, a, mode, reference || undefined);
      setModal(false);
      await load();
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const shareInvoice = async () => {
    if (!facture) return;
    const lines = facture.lines.map((l) => `- ${l.description} : ${l.quantity} × ${formatTND(l.unitPrice)} = ${formatTND(l.total)}`).join('\n');
    const text =
      `${t('FACTURE')} ${facture.numero} - OlivePress\n` +
      `${t('Client')} : ${facture.clientName}\n` +
      `${t('Date')} : ${formatDate(facture.invoiceDate)}\n\n${lines}\n\n` +
      `${t('Total')} : ${formatTND(facture.totalAmount)}\n` +
      `${t('Payé')} : ${formatTND(facture.paidAmount)}\n` +
      `${t('Reste')} : ${formatTND(facture.remainingAmount)}`;
    await Share.share({ message: text, title: `${t('FACTURE')} ${facture.numero}` });
  };

  const exportPdf = async () => {
    if (!facture) return;
    try {
      await shareFacturePdf(facture, payments.map((p) => ({ amount: p.amount, mode: p.mode, paidAt: p.paidAt, reference: p.reference })), locale);
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    }
  };

  if (loading || !facture) return <LoadingView />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.olive} />}>
      <Card>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.numero}>{facture.numero}</Text>
            <Text style={styles.client}>{facture.clientName}</Text>
            <Text style={styles.date}>
              {t('Émise le {date}', { date: formatDate(facture.invoiceDate) })}
              {facture.dueDate ? ` · ${t('échéance {date}', { date: formatDate(facture.dueDate) })}` : ''}
            </Text>
          </View>
          <Badge status={facture.statut} />
        </View>

        <View style={styles.totals}>
          <Total label={t('Total')} value={formatTND(facture.totalAmount)} />
          <Total label={t('Payé')} value={formatTND(facture.paidAmount)} color={colors.success} />
          <Total label={t('Reste')} value={formatTND(facture.remainingAmount)} color={colors.danger} />
        </View>

        <View style={styles.actions}>
          <Button title={t('Partager la facture')} variant="outline" small onPress={shareInvoice}
            icon={<Ionicons name="share-outline" size={18} color={colors.olive} />} style={{ flex: 1 }} />
          <Button title={t('PDF')} variant="outline" small onPress={exportPdf}
            icon={<Ionicons name="document-outline" size={18} color={colors.olive} />} style={{ flex: 1, marginLeft: spacing.sm }} />
        </View>
      </Card>

      <SectionHeader title={t('Détail des prestations')} />
      <Card>
        {facture.lines.map((l, i) => (
          <View key={l.id} style={[styles.line, i < facture.lines.length - 1 && styles.lineBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineDesc}>{l.description}</Text>
              <Text style={styles.lineMeta}>{formatNumber(l.quantity, 2)} × {formatTND(l.unitPrice)}</Text>
            </View>
            <Text style={styles.lineTotal}>{formatTND(l.total)}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title={t('Paiements')} actionLabel={can('FACTURE_WRITE') && facture.remainingAmount > 0 ? t('Encaisser') : undefined} onAction={openPayment} />
      {payments.length === 0 ? (
        <Card><Text style={styles.empty}>{t('Aucun paiement enregistré.')}</Text></Card>
      ) : (
        payments.map((p) => (
          <Card key={p.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.payRow}>
              <Text style={styles.payAmount}>{formatTND(p.amount)}</Text>
              <Text style={styles.payMode}>{MODES.find((m) => m.value === p.mode)?.label ?? p.mode}</Text>
            </View>
            <Text style={styles.payMeta}>{formatDateTime(p.paidAt)}{p.reference ? ' · ' + p.reference : ''}{p.employeeName ? ' · ' + p.employeeName : ''}</Text>
          </Card>
        ))
      )}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModal(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{t('Enregistrer un paiement')}</Text>
              <Text style={styles.sheetSub}>{t('Reste à payer : {value}', { value: formatTND(facture.remainingAmount) })}</Text>
              <TextField label={t('Montant (DT) *')} keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <SelectField<PaymentMode> label={t('Mode de paiement')} value={mode} options={MODES} onChange={setMode} />
              <TextField label={t('Référence')} placeholder={t('N° chèque, virement…')} value={reference} onChangeText={setReference} />
              <Button title={t('Valider le paiement')} onPress={submitPayment} loading={saving} />
              <Button title={t('Annuler')} variant="ghost" onPress={() => setModal(false)} style={{ marginTop: spacing.sm }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function Total({ label, value, color = colors.textPrimary }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.totalCell}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  numero: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  client: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  totals: {
    flexDirection: 'row', marginVertical: spacing.lg, borderTopWidth: 1,
    borderBottomWidth: 1, borderColor: colors.softGray, paddingVertical: spacing.md,
  },
  totalCell: { flex: 1, alignItems: 'center' },
  totalLabel: { fontSize: 12, color: colors.textSecondary },
  totalValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  actions: { flexDirection: 'row' },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  lineBorder: { borderBottomWidth: 1, borderBottomColor: colors.softGray },
  lineDesc: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  lineMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  lineTotal: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  empty: { color: colors.textMuted, fontSize: 13 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payAmount: { fontSize: 16, fontWeight: '800', color: colors.success },
  payMode: { fontSize: 12, color: colors.textSecondary },
  payMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '90%' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  sheetSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.lg },
});
