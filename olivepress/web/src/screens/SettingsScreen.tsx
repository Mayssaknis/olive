import { FormEvent, useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { settingsApi } from '../api/services';
import { Button, TextField } from '../components/Form';
import { Card, SectionHeader } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import { formatDateTime } from '../utils/format';

export default function SettingsScreen() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tarif, setTarif] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .getTarif()
      .then((s) => {
        setTarif(String(s.tarifParKg));
        setUpdatedAt(s.updatedAt);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseFloat(tarif.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      toast(t('Le tarif doit être supérieur à 0.'), 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await settingsApi.setTarif(value);
      setTarif(String(res.tarifParKg));
      setUpdatedAt(res.updatedAt);
      toast(t('Tarif mis à jour.'), 'success');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} />;

  return (
    <div style={{ maxWidth: 520 }}>
      <Card>
        <SectionHeader title={t('Tarif de pressage')} />
        <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: 13.5 }}>
          {t('Appliqué automatiquement à chaque nouvel apport (prix du kilo net).')}
        </p>
        <form onSubmit={submit}>
          <TextField
            label={t('Tarif (DT/kg net)')}
            required
            value={tarif}
            onChange={(e) => setTarif(e.target.value)}
            inputMode="decimal"
            placeholder={t('ex : 0,50')}
            hint={t('Exemple : apport de 500 kg nets → facture auto de 250 DT.')}
          />
          <div className="info-box">
            <div className="muted">
              <Settings size={14} style={{ verticalAlign: -2 }} /> {t('Fonctionnement')}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.7, marginTop: 4 }}>
              {t(
                "Chaque nouvel apport génère automatiquement une facture : poids net × tarif. Une facture déjà générée n'est pas modifiée par un changement de tarif.",
              )}
            </div>
          </div>
          {updatedAt && (
            <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
              {t('Dernière modification')} : {formatDateTime(updatedAt)}
            </div>
          )}
          <div className="form-actions">
            <Button type="submit" loading={saving}>
              {t('Enregistrer le tarif')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
