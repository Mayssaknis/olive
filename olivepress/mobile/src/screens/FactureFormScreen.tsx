import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { DateField } from '../components/DateField';
import { SelectField, Option } from '../components/SelectField';
import { Button } from '../components/Button';
import { facturesApi, clientsApi } from '../api/services';
import { errorMessage } from '../api/client';
import { Client } from '../types';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { formatTND, formatNumber, todayISODate } from '../utils/format';
import { useI18n } from '../i18n';

interface LineState {
  description: string;
  quantity: string;
  unitPrice: string;
}

export function FactureFormScreen() {
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(todayISODate());
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<LineState[]>([{ description: '', quantity: '', unitPrice: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clientsApi.list(undefined, true).then(setClients).catch(() => undefined);
  }, []);

  const clientOptions: Option<number>[] = clients.map((c) => ({ label: `${c.fullName} · ${c.phone}`, value: c.id }));

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const q = parseFloat(l.quantity.replace(',', '.')) || 0;
        const p = parseFloat(l.unitPrice.replace(',', '.')) || 0;
        return sum + q * p;
      }, 0),
    [lines]
  );

  const updateLine = (index: number, patch: Partial<LineState>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { description: '', quantity: '', unitPrice: '' }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    if (!clientId) {
      Alert.alert(t('Erreur'), t('Sélectionnez un client.'));
      return;
    }
    const validLines = lines
      .filter((l) => l.description.trim() && parseFloat(l.quantity.replace(',', '.')) > 0 && parseFloat(l.unitPrice.replace(',', '.')) > 0)
      .map((l) => ({
        description: l.description.trim(),
        quantity: parseFloat(l.quantity.replace(',', '.')),
        unitPrice: parseFloat(l.unitPrice.replace(',', '.')),
      }));
    if (validLines.length === 0) {
      Alert.alert(t('Erreur'), t('Ajoutez au moins une ligne valide (description, quantité, prix).'));
      return;
    }
    setSaving(true);
    try {
      await facturesApi.create({
        clientId,
        invoiceDate,
        dueDate: dueDate || undefined,
        lines: validLines,
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
        <Text style={styles.title}>{t('Nouvelle facture')}</Text>
        <View style={{ height: spacing.md }} />
        <SelectField<number> label={t('Client *')} placeholder={t('Sélectionner')} value={clientId} options={clientOptions} onChange={setClientId} />
        <DateField label={t('Date de facture')} value={invoiceDate} onChange={setInvoiceDate} />
        <DateField label={t('Échéance (facultatif)')} value={dueDate} onChange={setDueDate} clearable placeholder={t('Aucune échéance')} />
      </Card>

      <Text style={styles.section}>{t('Prestations & tarifs')}</Text>
      {lines.map((line, i) => (
        <Card key={i} style={{ marginBottom: spacing.md }}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineTitle}>{t('Ligne {n}', { n: i + 1 })}</Text>
            {lines.length > 1 ? (
              <TouchableOpacity onPress={() => removeLine(i)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TextField label={t('Description')} placeholder="ex : Prestation de pressage" value={line.description} onChangeText={(v) => updateLine(i, { description: v })} />
          <View style={styles.lineRow}>
            <View style={{ flex: 1 }}>
              <TextField label={t('Quantité (L)')} keyboardType="numeric" value={line.quantity} onChangeText={(v) => updateLine(i, { quantity: v })} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <TextField label={t('Prix unitaire')} keyboardType="numeric" value={line.unitPrice} onChangeText={(v) => updateLine(i, { unitPrice: v })} />
            </View>
          </View>
          <Text style={styles.lineTotal}>
            {t('Sous-total : {value}', { value: formatTND((parseFloat(line.quantity.replace(',', '.')) || 0) * (parseFloat(line.unitPrice.replace(',', '.')) || 0)) })}
          </Text>
        </Card>
      ))}

      <Button title={t('Ajouter une ligne')} variant="outline" onPress={addLine} icon={<Ionicons name="add" size={18} color={colors.olive} />} />

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('Total facture')}</Text>
          <Text style={styles.totalValue}>{formatTND(total)}</Text>
        </View>
        <Button title={t('Créer la facture')} onPress={submit} loading={saving} style={{ marginTop: spacing.md }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  section: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginVertical: spacing.md },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  lineTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  lineRow: { flexDirection: 'row' },
  lineTotal: { fontSize: 13, color: colors.textSecondary, textAlign: 'right', fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.olive },
});
