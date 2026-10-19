import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apportsApi, productionApi } from '../api/services';
import { Button, DateField, TextAreaField, TextField } from '../components/Form';
import { Card } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import { formatNumber, formatPercent, todayISODate } from '../utils/format';

function parseNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? NaN : n;
}

export default function YieldFormScreen() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const apportId = Number(id);

  const [netWeightKg, setNetWeightKg] = useState(0);
  const [apportNumero, setApportNumero] = useState('');
  const [olives, setOlives] = useState('');
  const [oil, setOil] = useState('');
  const [date, setDate] = useState(todayISODate());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    apportsApi
      .get(apportId)
      .then((a) => {
        setNetWeightKg(a.netWeightKg);
        setApportNumero(a.numero);
        setOlives(String(a.netWeightKg));
      })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [apportId]);

  const yieldPercent = useMemo(() => {
    const o = parseNum(olives);
    const l = parseNum(oil);
    if (isNaN(o) || isNaN(l) || o <= 0) return 0;
    return (l / o) * 100;
  }, [olives, oil]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const o = parseNum(olives);
    const l = parseNum(oil);
    if (isNaN(o) || o <= 0) errs.olives = t('Quantité d’olives invalide');
    else if (o > netWeightKg)
      errs.olives = t('Maximum {value} kg (poids net de l’apport)', {
        value: formatNumber(netWeightKg, 0),
      });
    if (isNaN(l) || l <= 0) errs.oil = t('Quantité d’huile invalide');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errs.date = t('Format attendu : AAAA-MM-JJ');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await productionApi.record({
        apportId,
        olivesProcessedKg: parseNum(olives),
        oilObtainedL: parseNum(oil),
        productionDate: date,
        notes: notes.trim() || undefined,
      });
      toast(
        `Production enregistrée. Rendement calculé : ${formatPercent(yieldPercent)}`,
        'success',
      );
      navigate(`/apports/${apportId}`);
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
        <h3 style={{ marginTop: 0 }}>
          {t('Saisie de production')} — {apportNumero}
        </h3>
        <form onSubmit={submit}>
          <TextField
            label={t('Olives traitées (kg)')}
            required
            value={olives}
            onChange={(e) => setOlives(e.target.value)}
            error={errors.olives}
            inputMode="decimal"
            hint={t("Poids net de l'apport : {value} kg", { value: formatNumber(netWeightKg, 0) })}
          />
          <TextField
            label={t('Huile obtenue (litres)')}
            required
            value={oil}
            onChange={(e) => setOil(e.target.value)}
            error={errors.oil}
            inputMode="decimal"
          />
          <DateField
            label={t('Date de production')}
            required
            value={date}
            onChange={setDate}
            error={errors.date}
          />
          <TextAreaField
            label={t('Notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="info-box" style={{ textAlign: 'center' }}>
            <div className="muted">{t('Rendement calculé')}</div>
            <div className="big" style={{ color: 'var(--success)', fontSize: 30 }}>
              {formatPercent(yieldPercent)}
            </div>
            <div className="formula">
              {t('Formule : rendement (%) = huile obtenue ÷ olives traitées × 100')}
            </div>
          </div>

          <div className="form-actions">
            <Button type="submit" loading={saving}>
              {t('Enregistrer la production')}
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
