import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi, livraisonsApi, stockApi } from '../api/services';
import { Client, StockSummary } from '../types';
import { Button, SelectField, TextAreaField, TextField } from '../components/Form';
import { Card } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { formatLiters, formatNumber } from '../utils/format';

function parseNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? NaN : n;
}

export default function LivraisonFormScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [clientId, setClientId] = useState<number | ''>('');
  const [qty, setQty] = useState('');
  const [lot, setLot] = useState('');
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([clientsApi.list(undefined, true), stockApi.summary()])
      .then(([cs, s]) => {
        setClients(cs);
        setSummary(s);
      })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!clientId) errs.clientId = t('Sélectionnez un client');
    const q = parseNum(qty);
    if (isNaN(q) || q <= 0) errs.qty = t('Quantité invalide');
    else if (summary && q > summary.availableL)
      errs.qty = t('Stock insuffisant ({available} L disponibles)', {
        available: formatNumber(summary.availableL, 1),
      });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await livraisonsApi.create({
        clientId: Number(clientId),
        quantityL: q,
        lotNumber: lot.trim() || undefined,
        observations: observations.trim() || undefined,
      });
      toast(t('Livraison enregistrée.'), 'success');
      navigate('/livraisons');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div style={{ maxWidth: 560 }}>
      <Card>
        <div className="info-box">
          <div className="muted">{t('Stock disponible')}</div>
          <div className="big">{formatLiters(summary?.availableL)}</div>
        </div>
        <form onSubmit={submit}>
          <SelectField
            label={t('Client')}
            required
            value={clientId}
            onChange={setClientId}
            options={clients.map((c) => ({ value: c.id, label: `${c.fullName} · ${c.phone}` }))}
            error={errors.clientId}
            placeholder={t('— Choisir un client —')}
          />
          <TextField
            label={t('Quantité livrée (litres)')}
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            error={errors.qty}
            inputMode="decimal"
          />
          <TextField label={t('N° de lot')} value={lot} onChange={(e) => setLot(e.target.value)} />
          <TextAreaField
            label={t('Observations')}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          <div className="form-actions">
            <Button type="submit" loading={saving}>
              {t('Enregistrer la livraison')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              {t('Annuler')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
