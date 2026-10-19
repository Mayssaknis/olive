import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { ListRow } from '../components/ListRow';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingView, EmptyState } from '../components/Feedback';
import { clientsApi, apportsApi, facturesApi, livraisonsApi } from '../api/services';
import { Apport, Client, Facture, Livraison } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { shareClientPdf } from '../utils/pdf';
import { useI18n } from '../i18n';
import { colors, radius, spacing } from '../theme';
import { formatDate, formatDateTime, formatKg, formatLiters, formatTND, initials } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'ClientDetail'>;

export function ClientDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { can } = useAuth();
  const { t, locale } = useI18n();
  const [client, setClient] = useState<Client | null>(null);
  const [apports, setApports] = useState<Apport[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, a, f, l] = await Promise.all([
        clientsApi.get(params.id),
        apportsApi.byClient(params.id),
        can('FACTURE_READ') ? facturesApi.byClient(params.id) : Promise.resolve([]),
        livraisonsApi.list({ clientId: params.id, size: 20 }).then((p) => p.content).catch(() => []),
      ]);
      setClient(c);
      setApports(a);
      setFactures(f);
      setLivraisons(l);
    } finally {
      setLoading(false);
    }
  }, [params.id, can]);

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

  const printCard = async () => {
    if (!client) return;
    try {
      await shareClientPdf(
        client,
        { apports: apports.length, netWeightKg: totalApportsKg, factures: factures.length },
        locale as 'fr' | 'ar'
      );
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    }
  };

  if (loading) return <LoadingView />;

  const totalApportsKg = apports.reduce((s, a) => s + Number(a.netWeightKg), 0);

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.olive} />}>
      <Card>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(client?.fullName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{client?.fullName}</Text>
            {client?.code ? <Text style={styles.code}>{client.code}</Text> : null}
            <Text style={styles.meta}>{client?.phone}</Text>
            {client?.address ? <Text style={styles.meta}>{client.address}</Text> : null}
            <Text style={styles.since}>{t('Client depuis le {date}', { date: formatDate(client?.createdAt) })}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryValue}>{apports.length}</Text>
            <Text style={styles.summaryLabel}>{t('Apports')}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryValue}>{formatKg(totalApportsKg)}</Text>
            <Text style={styles.summaryLabel}>{t('Poids net')}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryValue}>{factures.length}</Text>
            <Text style={styles.summaryLabel}>{t('Factures')}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title={t('Imprimer la fiche')}
            variant="outline"
            small
            icon={<Ionicons name="print-outline" size={18} color={colors.olive} />}
            onPress={printCard}
            style={{ flex: 1 }}
          />
          {can('CLIENT_WRITE') ? (
            <Button
              title={t('Modifier')}
              variant="outline"
              small
              icon={<Ionicons name="create-outline" size={18} color={colors.olive} />}
              onPress={() => client && navigation.navigate('ClientForm', { client })}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </Card>

      <SectionHeader
        title={t('Apports')}
        actionLabel={can('APPORT_WRITE') ? t('Nouveau') : undefined}
        onAction={can('APPORT_WRITE') ? () => navigation.navigate('ApportForm', { clientId: params.id }) : undefined}
      />
      {apports.length === 0 ? (
        <EmptyState icon="leaf-outline" title={t('Aucun apport')} />
      ) : (
        apports.slice(0, 10).map((a) => (
          <ListRow
            key={a.id}
            icon="leaf-outline"
            title={`${a.numero} · ${formatKg(a.netWeightKg)}`}
            subtitle={formatDateTime(a.receivedAt)}
            right={<Badge status={a.status} size="sm" />}
            onPress={() => navigation.navigate('ApportDetail', { id: a.id })}
          />
        ))
      )}

      <SectionHeader title={t('Livraisons')} />
      {livraisons.length === 0 ? (
        <EmptyState icon="car-outline" title={t('Aucune livraison')} />
      ) : (
        livraisons.map((l) => (
          <ListRow
            key={l.id}
            icon="car-outline"
            title={`${l.numero} · ${formatLiters(l.quantityL)}`}
            subtitle={formatDateTime(l.deliveredAt)}
          />
        ))
      )}

      {can('FACTURE_READ') ? (
        <>
          <SectionHeader title={t('Factures')} />
          {factures.length === 0 ? (
            <EmptyState icon="receipt-outline" title={t('Aucune facture')} />
          ) : (
            factures.map((f) => (
              <ListRow
                key={f.id}
                icon="receipt-outline"
                title={`${f.numero} · ${formatTND(f.totalAmount)}`}
                subtitle={t('Reste : {value}', { value: formatTND(f.remainingAmount) })}
                right={<Badge status={f.statut} size="sm" />}
                onPress={() => navigation.navigate('FactureDetail', { id: f.id })}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.olive,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  code: { fontSize: 13, color: colors.olive, fontWeight: '700', marginTop: 2 },
  meta: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  since: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  summaryRow: {
    flexDirection: 'row', marginTop: spacing.lg, borderTopWidth: 1,
    borderTopColor: colors.softGray, paddingTop: spacing.md,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: colors.olive },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
