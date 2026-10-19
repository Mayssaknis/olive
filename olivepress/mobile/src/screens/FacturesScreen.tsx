import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListRow } from '../components/ListRow';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingView, EmptyState, ErrorState } from '../components/Feedback';
import { facturesApi } from '../api/services';
import { Facture, FactureStatut } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate, formatTND } from '../utils/format';
import { useI18n } from '../i18n';

export function FacturesScreen() {
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { can } = useAuth();
  const [items, setItems] = useState<Facture[]>([]);
  const [statut, setStatut] = useState<FactureStatut | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (st?: FactureStatut) => {
    try {
      setError(null);
      const res = await facturesApi.list({ statut: st, size: 50 });
      setItems(res.content);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(statut);
    }, [load, statut])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.headerArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {([
            { value: undefined, label: t('Toutes') },
            { value: 'IMPAYEE', label: t('Impayées') },
            { value: 'PARTIELLE', label: t('Partielles') },
            { value: 'PAYEE', label: t('Payées') },
          ] as { value?: FactureStatut; label: string }[]).map((f) => {
            const active = f.value === statut;
            return (
              <TouchableOpacity key={f.label} style={[styles.chip, active && styles.chipActive]} onPress={() => setStatut(f.value)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {can('FACTURE_WRITE') ? (
          <Button
            title={t('Nouvelle facture')}
            small
            icon={<Ionicons name="add" size={18} color={colors.white} />}
            onPress={() => navigation.navigate('FactureForm')}
          />
        ) : null}
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(statut)} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(statut); setRefreshing(false); }} tintColor={colors.olive} />}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title={t('Aucune facture')} />}
          renderItem={({ item }) => (
            <ListRow
              icon="receipt-outline"
              title={`${item.numero} — ${item.clientName}`}
              subtitle={`${formatDate(item.invoiceDate)} — ${t('Total : {value}', { value: formatTND(item.totalAmount) })} — ${t('Reste : {value}', { value: formatTND(item.remainingAmount) })}`}
              right={<Badge status={item.statut} size="sm" />}
              onPress={() => navigation.navigate('FactureDetail', { id: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  headerArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.softGray, marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
});
