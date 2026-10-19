import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apportsApi, clientsApi } from '../api/services';
import { Client } from '../types';
import { Button, SelectField, TextAreaField, TextField } from '../components/Form';
import { Card } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import { formatKg } from '../utils/format';

function parseNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? NaN : n;
}

export default function ApportFormScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id, clientId: clientIdParam } = useParams();
  const { toast } = useToast();
  const editing = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | ''>(clientIdParam ? Number(clientIdParam) : '');
  const [gross, setGross] = useState('');
  const [tare, setTare] = useState('');
  const [ticket, setTicket] = useState('');
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const p1 = clientsApi.list(undefined, true);
    const p2 = editing ? apportsApi.get(Number(id)) : Promise.resolve(null);
    Promise.all([p1, p2])
      .then(([cs, ap]) => {
        setClients(cs);
        if (ap) {
          setClientId(ap.clientId);
          setGross(String(ap.grossWeightKg));
          setTare(String(ap.tareKg));
          setTicket(ap.ticketNumber ?? '');
          setObservations(ap.observations ?? '');
        }
      })
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const net = useMemo(() => {
    const g = parseNum(gross);
    const tr = parseNum(tare) || 0;
    if (isNaN(g) || g <= 0) return 0;
    return Math.max(g - tr, 0);
  }, [gross, tare]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!clientId) errs.clientId = t('Sélectionnez un client');
    const g = parseNum(gross);
    if (isNaN(g) || g <= 0) errs.gross = t('Le poids brut doit être supérieur à 0');
    const tr = tare.trim() ? parseNum(tare) : 0;
    if (!isNaN(tr) && tr < 0) errs.tare = t('La tare ne peut pas être négative');
    else if (!isNaN(tr) && !isNaN(g) && tr >= g)
      errs.tare = t('La tare doit être inférieure au poids brut');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        clientId: Number(clientId),
        grossWeightKg: parseNum(gross),
        tareKg: tare.trim() ? parseNum(tare) : 0,
        ticketNumber: ticket.trim() || undefined,
        observations: observations.trim() || undefined,
      };
      if (editing) await apportsApi.update(Number(id), payload);
      else {
        const created = await apportsApi.create(payload);
        toast(
          `${t('Apport enregistré.')} ${t('Facture automatique créée pour')} ${created.numero}.`,
          'success',
        );
        navigate('/apports');
        return;
      }
      toast(t('Apport modifié.'), 'success');
      navigate('/apports');
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
          <div className="form-row">
            <TextField
              label={t('Poids brut (kg)')}
              required
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              error={errors.gross}
              placeholder={t('ex : 1250')}
              inputMode="decimal"
            />
            <TextField
              label={t('Tare (kg)')}
              value={tare}
              onChange={(e) => setTare(e.target.value)}
              error={errors.tare}
              placeholder={t('ex : 25')}
              inputMode="decimal"
              hint={t("Poids de l'emballage, déduit du poids brut.")}
            />
          </div>
          <div className="info-box">
            <div className="muted">{t('Poids net calculé')}</div>
            <div className="big">{formatKg(net)}</div>
            <div className="formula">
              {gross || tare
                ? `${parseNum(gross) || 0} − ${parseNum(tare) || 0} kg`
                : t('Formule : brut − tare')}
            </div>
          </div>
          <TextField
            label={t('N° de ticket (facultatif)')}
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            placeholder={t('Auto : T00001, T00002…')}
            hint={t('Laissez vide pour génération automatique.')}
          />
          <TextAreaField
            label={t('Observations')}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          <div className="form-actions">
            <Button type="submit" loading={saving}>
              {editing ? t('Enregistrer') : t("Créer l'apport")}
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
