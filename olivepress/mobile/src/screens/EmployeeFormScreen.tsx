import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { SelectField, Option } from '../components/SelectField';
import { Button } from '../components/Button';
import { employeesApi } from '../api/services';
import { errorMessage } from '../api/client';
import { Role } from '../types';
import { ALL_PERMISSIONS } from '../constants/permissions';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useI18n } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'EmployeeForm'>;

export function EmployeeFormScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { t } = useI18n();
  const editing = params?.employee;

  const ROLES: Option<Role>[] = [
    { label: t('Employé'), value: 'EMPLOYEE' },
    { label: t('Administrateur'), value: 'ADMIN' },
  ];

  const [username, setUsername] = useState(editing?.username ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [fullName, setFullName] = useState(editing?.fullName ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(editing?.role ?? 'EMPLOYEE');
  const [active, setActive] = useState(editing?.active ?? true);
  const [permissions, setPermissions] = useState<string[]>(editing?.permissions ?? []);
  const [saving, setSaving] = useState(false);

  const togglePermission = (value: string) => {
    setPermissions((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  };

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert(t('Erreur'), t('Le nom complet et l’e-mail sont requis.'));
      return;
    }
    if (!editing && (!username.trim() || password.length < 6)) {
      Alert.alert(t('Erreur'), t('Identifiant requis et mot de passe de 6 caractères minimum.'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await employeesApi.update(editing.id, {
          email, fullName, phone, role,
          permissions: role === 'ADMIN' ? [] : permissions,
          active,
          password: password || undefined,
        });
      } else {
        await employeesApi.create({
          username, email, fullName, phone, role,
          permissions: role === 'ADMIN' ? [] : permissions,
          active,
          password,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{editing ? t('Modifier') + ' ' + editing.fullName : t('Nouvel employé')}</Text>
        <View style={{ height: spacing.lg }} />
        {!editing ? (
          <TextField label={t('Identifiant *')} autoCapitalize="none" value={username} onChangeText={setUsername} />
        ) : null}
        <TextField label={t('Nom complet *')} value={fullName} onChangeText={setFullName} />
        <TextField label={t('E-mail *')} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextField label={t('Téléphone')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextField
          label={editing ? t('Nouveau mot de passe (facultatif)') : t('Mot de passe *')}
          secure
          value={password}
          onChangeText={setPassword}
          hint={t('6 caractères minimum. Jamais affiché en clair.')}
        />
        <SelectField<Role> label={t('Rôle')} value={role} options={ROLES} onChange={setRole} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('Compte actif')}</Text>
          <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.olive, false: colors.softGray }} />
        </View>
      </Card>

      {role === 'EMPLOYEE' ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.permTitle}>{t('Permissions')}</Text>
          <Text style={styles.permHint}>{t("L'administrateur dispose de tous les droits automatiquement.")}</Text>
          {ALL_PERMISSIONS.map((p) => {
            const checked = permissions.includes(p.value);
            return (
              <TouchableOpacity key={p.value} style={styles.permRow} onPress={() => togglePermission(p.value)}>
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={checked ? colors.olive : colors.textMuted}
                />
                <Text style={styles.permLabel}>{t(p.label)}</Text>
              </TouchableOpacity>
            );
          })}
        </Card>
      ) : null}

      <Button
        title={editing ? t('Enregistrer') : t('Créer l’employé')}
        onPress={submit}
        loading={saving}
        style={{ marginTop: spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  switchLabel: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
  permTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  permHint: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  permLabel: { fontSize: 14, color: colors.textPrimary, marginLeft: spacing.md },
});
