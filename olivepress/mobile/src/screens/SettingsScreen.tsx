import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingView } from '../components/Feedback';
import { settingsApi } from '../api/services';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

export function SettingsScreen() {
  const { t } = useI18n();
  const [tarif, setTarif] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .getTarif()
      .then((s) => {
        setTarif(String(s.tarifParKg));
        setUpdatedAt(s.updatedAt);
      })
      .catch((e) => Alert.alert(t('Erreur'), errorMessage(e)))
      .finally(() => setLoading(false));
  }, [t]);

  const onSubmit = async () => {
    const value = parseFloat(tarif.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      Alert.alert(t('Erreur'), t('Le tarif doit être supérieur à 0.'));
      return;
    }
    setSaving(true);
    try {
      const res = await settingsApi.setTarif(value);
      setTarif(String(res.tarifParKg));
      setUpdatedAt(res.updatedAt);
      Alert.alert(t('Succès'), t('Tarif mis à jour.'));
    } catch (e) {
      Alert.alert(t('Erreur'), errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{t('Tarif de pressage')}</Text>
        <Text style={styles.subtitle}>
          {t('Appliqué automatiquement à chaque nouvel apport (prix du kilo net).')}
        </Text>
        <View style={{ height: spacing.lg }} />

        <TextField
          label={t('Tarif (DT/kg net)')}
          placeholder={t('ex : 0,50')}
          keyboardType="numeric"
          value={tarif}
          onChangeText={setTarif}
          hint={t('Exemple : apport de 500 kg nets → facture auto de 250 DT.')}
        />

        {updatedAt ? (
          <Text style={styles.updated}>
            {t('Dernière modification')} : {formatDateTime(updatedAt)}
          </Text>
        ) : null}

        <Button title={t('Enregistrer le tarif')} onPress={onSubmit} loading={saving} />
      </Card>

      <SectionHeader title={t('Fonctionnement')} />
      <Card>
        <Text style={styles.info}>
          {t("Chaque nouvel apport génère automatiquement une facture : poids net × tarif. Une facture déjà générée n'est pas modifiée par un changement de tarif.")}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  updated: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.lg },
  info: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 21 },
});
