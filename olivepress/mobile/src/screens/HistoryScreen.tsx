import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { LoadingView, EmptyState, ErrorState } from '../components/Feedback';
import { historyApi } from '../api/services';
import { HistoryEntry } from '../types';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

const ACTION_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  CREATE: 'add-circle-outline',
  UPDATE: 'create-outline',
  DELETE: 'trash-outline',
  STATUS_CHANGE: 'git-branch-outline',
  PAYMENT: 'cash-outline',
  LOGIN: 'log-in-outline',
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  STATUS_CHANGE: 'Changement de statut',
  PAYMENT: 'Paiement',
  LOGIN: 'Connexion (historique)',
};

export function HistoryScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await historyApi.list({ size: 50 });
      setItems(res.content);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.olive} />}
          ListEmptyComponent={<EmptyState icon="time-outline" title={t('Aucun événement')} />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Ionicons name={ACTION_ICON[item.action] ?? 'ellipse-outline'} size={20} color={colors.olive} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.action}>{t(ACTION_LABEL[item.action] ?? item.action)}</Text>
                  <Text style={styles.details}>{item.details || item.entityType || '—'}</Text>
                  <Text style={styles.meta}>{item.userName ?? t('Système')} · {formatDateTime(item.createdAt)}</Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  action: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  details: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
