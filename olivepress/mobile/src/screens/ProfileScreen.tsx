import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TextField } from '../components/TextField';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { LOCALES, Locale } from '../i18n/translations';
import { Permission } from '../types';
import { authApi } from '../api/services';
import { colors, radius, spacing } from '../theme';
import { initials } from '../utils/format';

export function ProfileScreen() {
  const { user, logout, can } = useAuth();
  const { t, locale, setLocale } = useI18n();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const confirmLogout = () => {
    Alert.alert(t('Déconnexion'), t('Voulez-vous vous déconnecter ?'), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Déconnexion'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const changeLocale = async (next: Locale) => {
    if (next === locale) return;
    const needsRestart = await setLocale(next);
    if (needsRestart) {
      Alert.alert(
        t('Langue'),
        t('Redémarrez l’application pour appliquer le sens de lecture (droite à gauche).')
      );
    }
  };

  if (!user) return null;

  const submitPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert(t('Changer le mot de passe'), t('Les mots de passe ne correspondent pas.'));
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('Changer le mot de passe'), t('Mot de passe modifié.'));
    } catch (err: any) {
      Alert.alert(
        t('Changer le mot de passe'),
        err?.response?.data?.message ?? t('Échec du changement de mot de passe.')
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const granted: Permission[] = ['DASHBOARD_READ', 'CLIENT_READ', 'CLIENT_WRITE', 'APPORT_READ', 'APPORT_WRITE',
    'PRODUCTION_READ', 'PRODUCTION_WRITE', 'STOCK_READ', 'STOCK_WRITE', 'LIVRAISON_READ', 'LIVRAISON_WRITE',
    'FACTURE_READ', 'FACTURE_WRITE', 'EMPLOYEE_READ', 'EMPLOYEE_WRITE', 'NOTIFICATION_READ', 'HISTORY_READ', 'REPORT_READ'];

  return (
    <Screen>
      <Card>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user.fullName)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <View style={{ marginTop: spacing.sm }}>
              <Badge status={user.role === 'ADMIN' ? 'PRODUCTION_TERMINEE' : 'RECU'} labelOverride={t(user.role === 'ADMIN' ? 'Administrateur' : 'Employé')} size="sm" />
            </View>
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Row label={t('E-mail')} value={user.email} />
        <Row label={t('Téléphone')} value={user.phone || '—'} />
        <Row label={t('Compte')} value={t(user.active ? 'Actif' : 'Inactif')} />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.permTitle}>{t('Langue')}</Text>
        <View style={styles.langWrap}>
          {LOCALES.map((l) => {
            const active = l.value === locale;
            return (
              <Pressable
                key={l.value}
                onPress={() => changeLocale(l.value)}
                style={[styles.langChip, active && styles.langChipActive]}
              >
                <Text style={[styles.langFlag, active && styles.langTextActive]}>{l.flag}</Text>
                <Text style={[styles.langLabel, active && styles.langTextActive]}>{l.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.permTitle}>{t('Changer le mot de passe')}</Text>
        <TextField
          label={t('Mot de passe actuel')}
          secure
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextField
          label={t('Nouveau mot de passe')}
          secure
          hint={t('Au moins 6 caractères.')}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextField
          label={t('Confirmer le nouveau mot de passe')}
          secure
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Button title={t('Enregistrer')} onPress={submitPassword} loading={savingPassword} style={{ marginTop: spacing.md }} />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.permTitle}>
          {t(user.role === 'ADMIN' ? 'Droits administrateur (accès complet)' : 'Vos permissions')}
        </Text>
        <View style={styles.permWrap}>
          {granted.filter((p) => can(p)).map((p) => (
            <View key={p} style={styles.permChip}>
              <Text style={styles.permChipText}>{p.replace('_', ' ')}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Button title={t('Se déconnecter')} variant="danger" onPress={confirmLogout} style={{ marginTop: spacing.xl }} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.olive,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  username: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLabel: { fontSize: 14, color: colors.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  permTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  permWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  permChip: {
    backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: spacing.md,
    paddingVertical: 4, borderWidth: 1, borderColor: colors.softGray,
  },
  permChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  langWrap: { flexDirection: 'row', gap: spacing.md },
  langChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.softGray,
    backgroundColor: colors.cream,
  },
  langChipActive: { backgroundColor: colors.olive, borderColor: colors.olive },
  langFlag: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  langLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  langTextActive: { color: colors.white },
});
