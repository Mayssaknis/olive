import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { SelectField, Option } from '../components/SelectField';
import { Button } from '../components/Button';
import { livraisonsApi, clientsApi, stockApi } from '../api/services';
import { errorMessage } from '../api/client';
import { Client } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n';
import { colors, radius, spacing } from '../theme';
import { formatLiters } from '../utils/format';

export function LivraisonFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [available, setAvailable] = useState<number | null>(null);
  const [clientId, setClientId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [lot, setLot] = useState('');
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clientsApi.list(undefined, true).then(setClients).catch(() => undefined);
    stockApi.summary().then((s) => setAvailable(Number(s.availableL))).catch(() => undefined);
  }, []);

  const clientOptions: Option<number>[] = clients.map((c) => ({ label: `${c.fullName} · ${c.phone}`, value: c.id }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!clientId) e.client = t('Sélectionnez un client');
    const q = parseFloat(quantity.replace(',', '.'));
    if (isNaN(q) || q <= 0) e.quantity = t('Quantité invalide');
    else if (available !== null && q > available) e.quantity = t('Stock insuffisant ({available} L disponibles)', { available });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await livraisonsApi.create({
        clientId: clientId!,
        quantityL: parseFloat(quantity.replace(',', '.')),
        lotNumber: lot || undefined,
        observations: observations || undefined,
      });
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
        <Text style={styles.title}>{t('Nouvelle livraison')}</Text>
        {available !== null ? (
          <View style={styles.availBox}>
            <Text style={styles.availLabel}>{t('Stock disponible')}</Text>
            <Text style={styles.availValue}>{formatLiters(available)}</Text>
          </View>
        ) : null}
        <View style={{ height: spacing.md }} />
        <SelectField<number> label={t('Client *')} placeholder={t('Sélectionner')} value={clientId} options={clientOptions} onChange={setClientId} error={errors.client} />
        <TextField label={t('Quantité livrée (litres) *')} keyboardType="numeric" value={quantity} onChangeText={setQuantity} error={errors.quantity} />
        <TextField label={t('N° de lot')} value={lot} onChangeText={setLot} />
        <TextField label={t('Observations')} value={observations} onChangeText={setObservations} multiline />
        <Button title={t('Enregistrer la livraison')} onPress={submit} loading={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  availBox: {
    backgroundColor: colors.cream, borderRadius: radius.md, padding: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.softGray,
  },
  availLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  availValue: { fontSize: 18, fontWeight: '800', color: colors.olive },
});
