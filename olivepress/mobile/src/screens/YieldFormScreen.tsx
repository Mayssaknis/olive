import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { DateField } from '../components/DateField';
import { Button } from '../components/Button';
import { productionApi } from '../api/services';
import { errorMessage } from '../api/client';
import { RootStackParamList } from '../navigation/types';
import { useI18n } from '../i18n';
import { colors, radius, spacing } from '../theme';
import { formatPercent, todayISODate } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'YieldForm'>;

export function YieldFormScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { t } = useI18n();

  const [olives, setOlives] = useState(String(params.netWeightKg));
  const [oil, setOil] = useState('');
  const [date, setDate] = useState(todayISODate());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const yieldPct = useMemo(() => {
    const o = parseFloat(olives.replace(',', '.'));
    const h = parseFloat(oil.replace(',', '.'));
    if (isNaN(o) || isNaN(h) || o <= 0) return 0;
    return (h / o) * 100;
  }, [olives, oil]);

  const validate = () => {
    const e: Record<string, string> = {};
    const o = parseFloat(olives.replace(',', '.'));
    const h = parseFloat(oil.replace(',', '.'));
    if (isNaN(o) || o <= 0) e.olives = t('Quantité d’olives invalide');
    else if (o > params.netWeightKg) e.olives = t('Maximum {value} kg (poids net de l’apport)', { value: params.netWeightKg });
    if (isNaN(h) || h <= 0) e.oil = t('Quantité d’huile invalide');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.date = t('Format attendu : AAAA-MM-JJ');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await productionApi.record({
        apportId: params.apportId,
        olivesProcessedKg: parseFloat(olives.replace(',', '.')),
        oilObtainedL: parseFloat(oil.replace(',', '.')),
        productionDate: date,
        notes: notes || undefined,
      });
      Alert.alert(t('Production enregistrée'), t('Rendement calculé : {value} %', { value: yieldPct.toFixed(2) }));
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
        <Text style={styles.title}>{t('Rendement')} · {params.apportNumero}</Text>
        <Text style={styles.subtitle}>
          {t('Formule : rendement (%) = huile obtenue ÷ olives traitées × 100')}
        </Text>
        <View style={{ height: spacing.lg }} />

        <TextField
          label={t('Olives traitées (kg) *')}
          keyboardType="numeric"
          value={olives}
          onChangeText={setOlives}
          error={errors.olives}
          hint={t("Poids net de l'apport : {value} kg", { value: params.netWeightKg })}
        />
        <TextField
          label={t('Huile obtenue (litres) *')}
          keyboardType="numeric"
          value={oil}
          onChangeText={setOil}
          error={errors.oil}
        />
        <DateField
          label={t('Date de production')}
          value={date}
          onChange={setDate}
          error={errors.date}
        />
        <TextField label={t('Notes')} placeholder={t('Observations...')} value={notes} onChangeText={setNotes} multiline />

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>{t('Rendement calculé')}</Text>
          <Text style={styles.resultValue}>{formatPercent(yieldPct)}</Text>
        </View>

        <Button title={t('Enregistrer la production')} onPress={onSubmit} loading={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  resultBox: {
    backgroundColor: colors.cream, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.softGray,
  },
  resultLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  resultValue: { fontSize: 30, fontWeight: '800', color: colors.success, marginTop: 4 },
});
