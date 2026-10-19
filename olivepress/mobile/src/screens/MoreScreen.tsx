import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { Permission } from '../types';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../theme';
import { initials } from '../utils/format';

interface Tile {
  key: keyof RootStackParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  permission?: Permission;
}

const MANAGEMENT: Tile[] = [
  { key: 'Stock', label: 'Stock', icon: 'cube-outline', permission: 'STOCK_READ' },
  { key: 'Livraisons', label: 'Livraisons', icon: 'car-outline', permission: 'LIVRAISON_READ' },
  { key: 'Factures', label: 'Factures', icon: 'receipt-outline', permission: 'FACTURE_READ' },
  { key: 'Employees', label: 'Employés', icon: 'people-outline', permission: 'EMPLOYEE_READ' },
  { key: 'Settings', label: 'Réglages', icon: 'settings-outline', permission: 'SETTING_WRITE' },
];

const ANALYSIS: Tile[] = [
  { key: 'Reports', label: 'Rapports', icon: 'bar-chart-outline', permission: 'REPORT_READ' },
  { key: 'History', label: 'Historique', icon: 'time-outline', permission: 'HISTORY_READ' },
  { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', permission: 'NOTIFICATION_READ' },
];

export function MoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, can } = useAuth();
  const { t } = useI18n();

  const renderTile = (tile: Tile) => {
    if (tile.permission && !can(tile.permission)) return null;
    return (
      <Pressable key={tile.key} style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]} onPress={() => navigation.navigate(tile.key as any)}>
        <View style={styles.tileIcon}>
          <Ionicons name={tile.icon} size={24} color={colors.olive} />
        </View>
        <Text style={styles.tileLabel}>{t(tile.label)}</Text>
      </Pressable>
    );
  };

  const managementTiles = MANAGEMENT.filter((t) => !t.permission || can(t.permission));
  const analysisTiles = ANALYSIS.filter((t) => !t.permission || can(t.permission));

  return (
    <Screen>
      <Pressable style={styles.profile} onPress={() => navigation.navigate('Profile')}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={styles.name}>{user?.fullName ?? t('Utilisateur')}</Text>
          <Text style={styles.role}>{t(user?.role === 'ADMIN' ? 'Administrateur' : 'Employé')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      {managementTiles.length > 0 ? (
        <>
          <SectionHeader title={t('Gestion')} />
          <View style={styles.grid}>{managementTiles.map(renderTile)}</View>
        </>
      ) : null}

      {analysisTiles.length > 0 ? (
        <>
          <SectionHeader title={t('Suivi & analyse')} />
          <View style={styles.grid}>{analysisTiles.map(renderTile)}</View>
        </>
      ) : null}

      <SectionHeader title={t('Compte')} />
      <View style={styles.grid}>{renderTile({ key: 'Profile', label: 'Profil', icon: 'person-circle-outline' })}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.softGray,
    ...shadow.card,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  role: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47.5%', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.softGray, ...shadow.card,
  },
  tilePressed: { opacity: 0.8 },
  tileIcon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  tileLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
});
