import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListRow } from '../components/ListRow';
import { Button } from '../components/Button';
import { LoadingView, EmptyState, ErrorState } from '../components/Feedback';
import { livraisonsApi } from '../api/services';
import { Livraison } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { errorMessage } from '../api/client';
import { colors, spacing } from '../theme';
import { formatDateTime, formatLiters } from '../utils/format';
import { shareLivraisonPdf } from '../utils/pdf';

export function LivraisonsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { can } = useAuth();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Livraison[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await livraisonsApi.list({ size: 50 });
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

  const exportPdf = async (livraison: Livraison) => {
    try {
      await shareLivraisonPdf(livraison, locale);
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {can('LIVRAISON_WRITE') ? (
        <View style={styles.headerArea}>
          <Button
            title={t('Nouvelle livraison')}
            small
            icon={<Ionicons name="add" size={18} color={colors.white} />}
            onPress={() => navigation.navigate('LivraisonForm')}
          />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.olive} />}
          ListEmptyComponent={<EmptyState icon="car-outline" title={t('Aucune livraison')} subtitle={t('Enregistrez un bon de livraison.')} />}
          renderItem={({ item }) => (
            <ListRow
              icon="car-outline"
              title={`${item.numero} · ${item.clientName}`}
              subtitle={`${formatLiters(item.quantityL)} · ${formatDateTime(item.deliveredAt)}`}
              right={
                <View style={styles.rowRight}>
                  {item.lotNumber ? <Text style={styles.lot}>{item.lotNumber}</Text> : null}
                  <TouchableOpacity onPress={() => exportPdf(item)} hitSlop={8} style={styles.pdfBtn}>
                    <Ionicons name="document-outline" size={18} color={colors.olive} />
                  </TouchableOpacity>
                </View>
              }
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
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lot: { fontSize: 12, color: colors.textMuted },
  pdfBtn: { padding: 4 },
});
