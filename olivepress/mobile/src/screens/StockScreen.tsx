import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { SectionHeader } from '../components/SectionHeader';
import { ListRow } from '../components/ListRow';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { SelectField, Option } from '../components/SelectField';
import { LoadingView, EmptyState } from '../components/Feedback';
import { stockApi, clientsApi } from '../api/services';
import { Client, MovementType, StockMovement, StockSummary } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDateTime, formatLiters, formatNumber } from '../utils/format';

const TYPES: Option<MovementType>[] = [
  { label: 'Entrée', value: 'ENTREE' },
  { label: 'Sortie', value: 'SORTIE' },
  { label: 'Ajustement positif', value: 'AJUSTEMENT_POSITIF' },
  { label: 'Ajustement négatif', value: 'AJUSTEMENT_NEGATIF' },
];

export function StockScreen() {
  const { can } = useAuth();
  const { t } = useI18n();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modal, setModal] = useState(false);
  const [type, setType] = useState<MovementType>('ENTREE');
  const [quantity, setQuantity] = useState('');
  const [lot, setLot] = useState('');
  const [reason, setReason] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([stockApi.summary(), stockApi.movements({ page: 0 })]);
      setSummary(s);
      setMovements(m.content);
      setPage(m.page.number);
      setHasMore(m.page.number + 1 < m.page.totalPages);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await stockApi.movements({ page: page + 1 });
      setMovements((prev) => [...prev, ...res.content]);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openModal = async () => {
    setType('ENTREE');
    setQuantity('');
    setLot('');
    setReason('');
    setClientId(null);
    setModal(true);
    if (clients.length === 0) {
      clientsApi.list(undefined, true).then(setClients).catch(() => undefined);
    }
  };

  const submit = async () => {
    const q = parseFloat(quantity.replace(',', '.'));
    if (isNaN(q) || q <= 0) {
      Alert.alert(t('Erreur'), t('Quantité invalide.'));
      return;
    }
    setSaving(true);
    try {
      await stockApi.move({
        movementType: type,
        quantityL: q,
        lotNumber: lot || undefined,
        reason: reason || undefined,
        clientId: clientId ?? undefined,
      });
      setModal(false);
      await load();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !summary) return <LoadingView />;

  const clientOptions: Option<number>[] = clients.map((c) => ({ label: c.fullName, value: c.id }));

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.olive} />}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <StatCard label={t('Stock disponible')} value={formatLiters(summary.availableL)} icon="cube-outline" />
        </View>
      </View>
      <View style={[styles.row, { marginTop: spacing.md }]}>
        <View style={{ flex: 1 }}>
          <StatCard label={t('Total entrées')} value={formatLiters(summary.totalInL)} icon="arrow-down-outline" accent={colors.success} />
        </View>
        <View style={{ width: spacing.md }} />
        <View style={{ flex: 1 }}>
          <StatCard label={t('Total sorties')} value={formatLiters(summary.totalOutL)} icon="arrow-up-outline" accent={colors.danger} />
        </View>
      </View>

      {can('STOCK_WRITE') ? (
        <Button
          title={t('Enregistrer un mouvement')}
          onPress={openModal}
          style={{ marginTop: spacing.lg }}
          icon={<Ionicons name="swap-vertical" size={18} color={colors.white} />}
        />
      ) : null}

      <SectionHeader title={t('Derniers mouvements')} />
      {movements.length === 0 ? (
        <EmptyState icon="swap-vertical-outline" title={t('Aucun mouvement')} />
      ) : (
        movements.map((m) => (
          <ListRow
            key={m.id}
            icon={m.signedQuantity >= 0 ? 'arrow-down-outline' : 'arrow-up-outline'}
            title={`${t(TYPES.find((o) => o.value === m.movementType)?.label ?? m.movementType)} · ${formatLiters(m.quantityL)}`}
            subtitle={`${formatDateTime(m.createdAt)}${m.lotNumber ? ' · lot ' + m.lotNumber : ''}${m.reason ? ' · ' + m.reason : ''}`}
            right={
              <Text style={[styles.signed, { color: m.signedQuantity >= 0 ? colors.success : colors.danger }]}>
                {m.signedQuantity >= 0 ? '+' : '−'}{formatNumber(Math.abs(m.signedQuantity), 1)}
              </Text>
            }
          />
        ))
      )}

      {hasMore ? (
        <Button
          title={t('Charger plus')}
          variant="ghost"
          loading={loadingMore}
          onPress={loadMore}
          style={{ marginTop: spacing.md }}
        />
      ) : null}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModal(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{t('Nouveau mouvement de stock')}</Text>
              <SelectField<MovementType> label={t('Type')} value={type} options={TYPES.map((o) => ({ ...o, label: t(o.label) }))} onChange={setType} />
              <TextField label={t('Quantité (litres) *')} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              <TextField label={t('N° de lot')} value={lot} onChangeText={setLot} />
              <SelectField<number> label={t('Client (facultatif)')} placeholder={t('Associer à un client')} value={clientId} options={clientOptions} onChange={setClientId} />
              <TextField label={t('Motif')} placeholder="ex : livraison, ajustement inventaire..." value={reason} onChangeText={setReason} />
              <Text style={styles.avail}>{t('Stock disponible actuel : {value}', { value: formatLiters(summary.availableL) })}</Text>
              <Button title={t('Valider le mouvement')} onPress={submit} loading={saving} />
              <Button title={t('Annuler')} variant="ghost" onPress={() => setModal(false)} style={{ marginTop: spacing.sm }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  signed: { fontSize: 15, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: '90%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.lg },
  avail: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg },
});
