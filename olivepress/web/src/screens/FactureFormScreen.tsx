import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { clientsApi, facturesApi } from '../api/services';
import { Client } from '../types';
import { Button, DateField, SelectField, TextAreaField, TextField } from '../components/Form';
import { Card, SectionHeader } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { formatTND, todayISODate } from '../utils/format';

interface LineState {
  description: string;
  quantity: string;
  unitPrice: string;
}

function parseNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? NaN : n;
}

export default function FactureFormScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | ''>('');
  const [invoiceDate, setInvoiceDate] = useState(todayISODate());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineState[]>([
    { description: '', quantity: '', unitPrice: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    clientsApi
      .list(undefined, true)
      .then(setClients)
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const lineTotal = (l: LineState) => {
    const q = parseNum(l.quantity);
    const p = parseNum(l.unitPrice);
    if (isNaN(q) || isNaN(p)) return 0;
    return q * p;
  };

  const total = useMemo(() => lines.reduce((s, l) => s + lineTotal(l), 0), [lines]);

  const setLine = (i: number, patch: Partial<LineState>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast(t('Sélectionnez un client.'), 'error');
      return;
    }
    const valid = lines
      .filter((l) => l.description.trim() && parseNum(l.quantity) > 0 && parseNum(l.unitPrice) > 0)
      .map((l) => ({
        description: l.description.trim(),
        quantity: parseNum(l.quantity),
        unitPrice: parseNum(l.unitPrice),
      }));
    if (!valid.length) {
      toast(t('Ajoutez au moins une ligne valide (description, quantité, prix).'), 'error');
      return;
    }
    setSaving(true);
    try {
      await facturesApi.create({
        clientId: Number(clientId),
        invoiceDate,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        lines: valid,
      });
      toast(t('Facture créée.'), 'success');
      navigate('/factures');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div style={{ maxWidth: 640 }}>
      <Card>
        <form onSubmit={submit}>
          <SelectField
            label={t('Client')}
            required
            value={clientId}
            onChange={setClientId}
            options={clients.map((c) => ({ value: c.id, label: `${c.fullName} · ${c.phone}` }))}
            placeholder={t('— Choisir un client —')}
          />
          <div className="form-row">
            <DateField
              label={t('Date de facture')}
              required
              value={invoiceDate}
              onChange={setInvoiceDate}
            />
            <DateField
              label={t('Échéance (facultatif)')}
              value={dueDate}
              onChange={setDueDate}
              clearable
            />
          </div>

          <SectionHeader title={t('Prestations & tarifs')} />
          {lines.map((l, i) => (
            <div key={i} className="card" style={{ padding: 14, marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 13 }}>{t('Ligne {n}', { n: i + 1 })}</strong>
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <TextField
                label={t('Description')}
                value={l.description}
                onChange={(e) => setLine(i, { description: e.target.value })}
                placeholder={t('ex : Prestation de pressage')}
              />
              <div className="form-row">
                <TextField
                  label={t('Quantité (L)')}
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  inputMode="decimal"
                />
                <TextField
                  label={t('Prix unitaire (DT)')}
                  value={l.unitPrice}
                  onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                  inputMode="decimal"
                />
              </div>
              <div className="muted" style={{ fontWeight: 700 }}>
                {t('Sous-total : {value}', { value: formatTND(lineTotal(l)) })}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setLines((ls) => [...ls, { description: '', quantity: '', unitPrice: '' }])
            }
          >
            <Plus size={16} /> {t('Ajouter une ligne')}
          </Button>

          <TextAreaField
            label={t('Notes (facultatif)')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ marginTop: 14 }}
          />

          <div
            className="info-box"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontWeight: 700 }}>{t('Total facture')}</span>
            <span className="big" style={{ fontSize: 22 }}>
              {formatTND(total)}
            </span>
          </div>

          <div className="form-actions">
            <Button type="submit" loading={saving}>
              {t('Créer la facture')}
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
