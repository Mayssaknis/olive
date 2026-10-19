import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { LoadingView, EmptyState, ErrorState } from '../components/Feedback';
import { notificationsApi } from '../api/services';
import { AppNotification } from '../types';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  STOCK_LOW: 'alert-circle-outline',
  FACTURE_IMPAYEE: 'receipt-outline',
  APPORTS_EN_ATTENTE: 'hourglass-outline',
  INFO: 'information-circle-outline',
};

export function NotificationsScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await notificationsApi.list({ page: 0 });
      setItems(res.content);
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
      const res = await notificationsApi.list({ page: page + 1 });
      setItems((prev) => [...prev, ...res.content]);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readFlag: true } : n)));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, readFlag: true })));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const unread = items.filter((n) => !n.readFlag).length;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {unread > 0 ? (
        <View style={styles.headerArea}>
          <TouchableOpacity onPress={markAll} style={styles.markAll}>
            <Ionicons name="checkmark-done-outline" size={18} color={colors.olive} />
            <Text style={styles.markAllText}>{t('Tout marquer comme lu ({count})', { count: unread })}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.olive} style={{ marginVertical: spacing.md }} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.olive} />}
          ListEmptyComponent={<EmptyState icon="notifications-outline" title={t('Aucune notification')} />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={item.readFlag ? 1 : 0.7} onPress={() => !item.readFlag && markRead(item.id)}>
              <Card style={item.readFlag ? styles.card : [styles.card, styles.unread]}>
                <View style={styles.row}>
                  <Ionicons name={ICONS[item.type] ?? 'information-circle-outline'} size={22} color={colors.olive} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
                  </View>
                  {!item.readFlag ? <View style={styles.dot} /> : null}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  headerArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  markAll: { flexDirection: 'row', alignItems: 'center' },
  markAllText: { color: colors.olive, fontWeight: '700', marginLeft: spacing.sm, fontSize: 13 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.olive },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  message: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.olive, marginLeft: spacing.sm, marginTop: 4 },
});
