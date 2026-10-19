import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../components/SearchBar';
import { ListRow } from '../components/ListRow';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingView, EmptyState, ErrorState } from '../components/Feedback';
import { apportsApi } from '../api/services';
import { Apport, ApportStatus } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDateTime, formatKg } from '../utils/format';

const STATUS_FILTERS: { value?: ApportStatus; label: string }[] = [
  { value: undefined, label: 'Tous' },
  { value: 'RECU', label: 'Reçus' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PRESSAGE', label: 'Pressage' },
  { value: 'PRODUCTION_TERMINEE', label: 'Terminés' },
  { value: 'ANOMALIE', label: 'Anomalies' },
];

export function ApportsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { can } = useAuth();
  const { t } = useI18n();
  const [apports, setApports] = useState<Apport[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApportStatus | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string, st?: ApportStatus) => {
    try {
      setError(null);
      const res = await apportsApi.list({ query: q || undefined, status: st, size: 50 });
      setApports(res.content);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(query, status);
    }, [load, query, status])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(query, status);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.headerArea}>
        <SearchBar value={query} onChange={setQuery} placeholder={t('N° apport, client...')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {STATUS_FILTERS.map((f) => {
            const active = f.value === status;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStatus(f.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(f.label)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {can('APPORT_WRITE') ? (
          <Button
            title={t('Nouvel apport')}
            small
            icon={<Ionicons name="add" size={18} color={colors.white} />}
            onPress={() => navigation.navigate('ApportForm', undefined)}
          />
        ) : null}
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(query, status)} />
      ) : (
        <FlatList
          data={apports}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.olive} />}
          ListEmptyComponent={<EmptyState icon="leaf-outline" title={t('Aucun apport')} subtitle={t('Enregistrez une réception.')} />}
          renderItem={({ item }) => (
            <ListRow
              icon="leaf-outline"
              title={`${item.numero} · ${item.clientName}`}
              subtitle={`${formatKg(item.netWeightKg)} · ${formatDateTime(item.receivedAt)}`}
              right={<Badge status={item.status} size="sm" />}
              onPress={() => navigation.navigate('ApportDetail', { id: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  headerArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.softGray,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
});
