import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListRow } from '../components/ListRow';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { LoadingView, EmptyState, ErrorState } from '../components/Feedback';
import { employeesApi } from '../api/services';
import { User } from '../types';
import { RootStackParamList } from '../navigation/types';
import { errorMessage } from '../api/client';
import { colors, spacing } from '../theme';
import { useI18n } from '../i18n';

export function EmployeesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useI18n();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await employeesApi.list());
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

  const toggle = async (id: number) => {
    try {
      await employeesApi.toggle(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.headerArea}>
        <Button
          title={t('Nouvel employé')}
          small
          icon={<Ionicons name="person-add-outline" size={18} color={colors.white} />}
          onPress={() => navigation.navigate('EmployeeForm', undefined)}
        />
      </View>

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
          ListEmptyComponent={<EmptyState icon="people-outline" title={t('Aucun employé')} />}
          renderItem={({ item }) => (
            <ListRow
              icon={item.role === 'ADMIN' ? 'shield-checkmark-outline' : 'person-outline'}
              title={item.fullName}
              subtitle={`@${item.username} · ${item.role === 'ADMIN' ? t('Administrateur') : t('Employé')}${item.phone ? ' · ' + item.phone : ''}`}
              right={
                <TouchableOpacity onPress={() => toggle(item.id)} hitSlop={8}>
                  <Badge status={item.active ? 'PAYEE' : 'IMPAYEE'} labelOverride={item.active ? t('Actif') : t('Inactif')} size="sm" />
                </TouchableOpacity>
              }
              onPress={() => navigation.navigate('EmployeeForm', { employee: item })}
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
});
