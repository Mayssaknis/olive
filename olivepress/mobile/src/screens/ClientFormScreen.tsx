import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { clientsApi } from '../api/services';
import { errorMessage } from '../api/client';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'ClientForm'>;

export function ClientFormScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { t } = useI18n();
  const editing = params?.client;

  const [firstName, setFirstName] = useState(editing?.firstName ?? '');
  const [lastName, setLastName] = useState(editing?.lastName ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [address, setAddress] = useState(editing?.address ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = t('Le prénom est requis');
    if (!lastName.trim()) e.lastName = t('Le nom est requis');
    if (!phone.trim()) e.phone = t('Le téléphone est requis');
    else if (!/^[0-9+\s]{6,}$/.test(phone.trim())) e.phone = t('Numéro de téléphone invalide');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { firstName, lastName, phone, address: address || undefined };
      if (editing) {
        await clientsApi.update(editing.id, payload);
      } else {
        await clientsApi.create(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{editing ? t('Modifier le client') : t('Nouveau client')}</Text>
        <View style={{ height: spacing.lg }} />
        <TextField label={t('Prénom *')} placeholder="Ahmed" value={firstName} onChangeText={setFirstName} error={errors.firstName} />
        <TextField label={t('Nom *')} placeholder="El Fassi" value={lastName} onChangeText={setLastName} error={errors.lastName} />
        <TextField
          label={t('Téléphone *')} placeholder="0661 11 22 33" icon="call-outline"
          keyboardType="phone-pad" value={phone} onChangeText={setPhone} error={errors.phone}
        />
        <TextField
          label={t('Adresse (facultatif)')} placeholder="Douar, ville..." icon="location-outline"
          value={address} onChangeText={setAddress}
        />
        <Button title={editing ? t('Enregistrer') : t('Créer le client')} onPress={onSubmit} loading={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
});
