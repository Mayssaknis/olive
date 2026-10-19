import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../components/SearchBar';
import { ListRow } from '../components/ListRow';
import { Button } from '../components/Button';
import { LoadingView, EmptyState, ErrorState } from '../components/Feedback';
import { clientsApi } from '../api/services';
import { Client } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, spacing } from '../theme';
import { formatDate } from '../utils/format';

export function ClientsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { can } = useAuth();
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    try {
      setError(null);
      const res = await clientsApi.page({ query: q || undefined, page: 0 });
      setClients(res.content);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await clientsApi.page({ query: query || undefined, page: page + 1 });
      setClients((prev) => [...prev, ...res.content]);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, query, page]);

  useFocusEffect(
    useCallback(() => {
      load(query);
    }, [load, query])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(query);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.headerArea}>
        <SearchBar value={query} onChange={setQuery} placeholder={t('Rechercher un client...')} />
        {can('CLIENT_WRITE') ? (
          <Button
            title={t('Nouveau client')}
            small
            icon={<Ionicons name="add" size={18} color={colors.white} />}
            onPress={() => navigation.navigate('ClientForm', undefined)}
          />
        ) : null}
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(query)} />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.olive} style={{ marginVertical: spacing.md }} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.olive} />}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={t('Aucun client')} subtitle={t('Ajoutez votre premier client.')} />
          }
          renderItem={({ item }) => (
            <ListRow
              icon="person-outline"
              title={item.code ? `${item.fullName} · ${item.code}` : item.fullName}
              subtitle={`${item.phone}${item.address ? ' · ' + item.address : ''}`}
              right={<Text style={styles.date}>{formatDate(item.createdAt)}</Text>}
              onPress={() => navigation.navigate('ClientDetail', { id: item.id, name: item.fullName })}
              chevron
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
  date: { fontSize: 12, color: colors.textMuted },
});
