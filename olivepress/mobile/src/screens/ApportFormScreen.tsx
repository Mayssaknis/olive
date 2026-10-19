import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { SelectField, Option } from '../components/SelectField';
import { Button } from '../components/Button';
import { apportsApi, clientsApi } from '../api/services';
import { errorMessage } from '../api/client';
import { Client } from '../types';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { formatKg, formatNumber } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'ApportForm'>;

export function ApportFormScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { t } = useI18n();
  const editing = params?.apport;

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | null>(editing?.clientId ?? params?.clientId ?? null);
  const [gross, setGross] = useState(editing ? String(editing.grossWeightKg) : '');
  const [tare, setTare] = useState(editing ? String(editing.tareKg) : '');
  const [ticket, setTicket] = useState(editing?.ticketNumber ?? '');
  const [observations, setObservations] = useState(editing?.observations ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clientsApi.list(undefined, true).then(setClients).catch(() => undefined);
  }, []);

  const clientOptions: Option<number>[] = clients.map((c) => ({
    label: `${c.fullName} · ${c.phone}`,
    value: c.id,
  }));

  const net = useMemo(() => {
    const g = parseFloat(gross.replace(',', '.'));
    const t = parseFloat(tare.replace(',', '.')) || 0;
    if (isNaN(g)) return 0;
    return g - t;
  }, [gross, tare]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!clientId) e.client = t('Sélectionnez un client');
    const g = parseFloat(gross.replace(',', '.'));
    const tr = parseFloat(tare.replace(',', '.')) || 0;
    if (isNaN(g) || g <= 0) e.gross = t('Le poids brut doit être supérieur à 0');
    if (tr < 0) e.tare = t('La tare ne peut pas être négative');
    if (!isNaN(g) && tr >= g) e.tare = t('La tare doit être inférieure au poids brut');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        clientId: clientId!,
        grossWeightKg: parseFloat(gross.replace(',', '.')),
        tareKg: parseFloat(tare.replace(',', '.')) || 0,
        ticketNumber: ticket || undefined,
        observations: observations || undefined,
      };
      if (editing) {
        await apportsApi.update(editing.id, payload);
      } else {
        const created = await apportsApi.create(payload);
        Alert.alert(
          t('Apport enregistré.'),
          `${t('Facture automatique créée pour')} ${created.numero}.`
        );
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
        <Text style={styles.title}>{editing ? `${t('Modifier l’apport')} ${editing.numero}` : t('Nouvel apport d’olives')}</Text>
        <Text style={styles.subtitle}>{t('Pesée et réception')}</Text>
        <View style={{ height: spacing.lg }} />

        <SelectField<number>
          label={t('Client *')}
          placeholder={t('Sélectionner un client')}
          value={clientId}
          options={clientOptions}
          onChange={setClientId}
          error={errors.client}
        />
        <TextField
          label={t('Poids brut (kg) *')}
          placeholder="ex : 1250"
          keyboardType="numeric"
          value={gross}
          onChangeText={setGross}
          error={errors.gross}
        />
        <TextField
          label={t('Tare (kg)')}
          placeholder="ex : 25"
          keyboardType="numeric"
          value={tare}
          onChangeText={setTare}
          error={errors.tare}
          hint={t("Poids de l'emballage, déduit du poids brut.")}
        />

        <View style={styles.netBox}>
          <Text style={styles.netLabel}>{t('Poids net calculé')}</Text>
          <Text style={styles.netValue}>{formatKg(net)}</Text>
          <Text style={styles.netFormula}>{formatNumber(parseFloat(gross.replace(',', '.')) || 0, 0)} − {formatNumber(parseFloat(tare.replace(',', '.')) || 0, 0)} kg</Text>
        </View>

        <TextField label={t('N° de ticket (facultatif)')} placeholder="Auto : T00001, T00002…" value={ticket} onChangeText={setTicket} hint={t('Laissez vide pour génération automatique.')} />
        <TextField
          label={t('Observations')}
          placeholder={t('Observations...')}
          value={observations}
          onChangeText={setObservations}
          multiline
        />

        <Button title={editing ? t('Enregistrer') : t('Enregistrer l’apport')} onPress={onSubmit} loading={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  netBox: {
    backgroundColor: colors.cream, borderRadius: 12, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.softGray,
  },
  netLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  netValue: { fontSize: 26, fontWeight: '800', color: colors.olive, marginTop: 2 },
  netFormula: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
