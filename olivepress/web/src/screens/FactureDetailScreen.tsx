import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Printer, Wallet } from 'lucide-react';
import { facturesApi } from '../api/services';
import { Facture, Paiement, PaymentMode } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Card, SectionHeader } from '../components/UI';
import { Button, SelectField, TextField } from '../components/Form';
import { ErrorState, LoadingView, Modal } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { formatDate, formatDateTime, formatNumber, formatTND } from '../utils/format';
import { copyText, printFacture } from '../utils/pdf';

const MODES: { value: PaymentMode; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'CARTE', label: 'Carte' },
  { value: 'AUTRE', label: 'Autre' },
];

const MODE_LABELS: Record<PaymentMode, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  CARTE: 'Carte',
  AUTRE: 'Autre',
};

export default function FactureDetailScreen() {
  const { t } = useI18n();
  const { id } = useParams();
  const { can } = useAuth();
  const { toast } = useToast();
  const factureId = Number(id);

  const [facture, setFacture] = useState<Facture | null>(null);
  const [payments, setPayments] = useState<Paiement[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('ESPECES');
  const [reference, setReference] = useState('');
  const [amountError, setAmountError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError('');
    Promise.all([facturesApi.get(factureId), facturesApi.payments(factureId)])
      .then(([f, p]) => {
        setFacture(f);
        setPayments(p);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [factureId]);

  useEffect(load, [load]);

  const openPay = () => {
    setAmount(facture ? String(facture.remainingAmount) : '');
    setMode('ESPECES');
    setReference('');
    setAmountError('');
    setPayOpen(true);
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount.replace(',', '.'));
    if (isNaN(a) || a <= 0) {
      setAmountError(t('Montant invalide.'));
      return;
    }
    setSaving(true);
    try {
      await facturesApi.pay(factureId, a, mode, reference.trim() || undefined);
      toast(t('Paiement enregistré.'), 'success');
      setPayOpen(false);
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!facture) return null;

  const share = async () => {
    const text = `Facture ${facture.numero}\nClient : ${facture.clientName}\nÉmise le : ${formatDate(facture.invoiceDate)}\nTotal : ${formatTND(facture.totalAmount)}\nPayé : ${formatTND(facture.paidAmount)}\nReste : ${formatTND(facture.remainingAmount)}`;
    await copyText(text);
    toast(t('Facture copiée dans le presse-papiers.'), 'success');
  };

  return (
    <div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{facture.numero}</div>
            <div className="muted">
              {facture.clientName}
              {facture.clientCode ? ` (${facture.clientCode})` : ''}
            </div>
            <div className="muted" style={{ marginTop: 4 }}>
              {t('Émise le {date}', { date: formatDate(facture.invoiceDate) })}
              {facture.dueDate
                ? ` · ${t('échéance {date}', { date: formatDate(facture.dueDate) })}`
                : ''}
            </div>
          </div>
          <Badge status={facture.statut} />
        </div>

        <div className="grid-3" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <div className="muted">{t('Total')}</div>
            <div className="fw-800" style={{ fontSize: 16 }}>
              {formatTND(facture.totalAmount)}
            </div>
          </div>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <div className="muted">{t('Payé')}</div>
            <div className="fw-800 text-success" style={{ fontSize: 16 }}>
              {formatTND(facture.paidAmount)}
            </div>
          </div>
          <div>
            <div className="muted">{t('Reste')}</div>
            <div className="fw-800 text-danger" style={{ fontSize: 16 }}>
              {formatTND(facture.remainingAmount)}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={share}>
            <Copy size={16} /> {t('Copier la facture')}
          </Button>
          <Button variant="outline" onClick={() => printFacture(facture, payments)}>
            <Printer size={16} /> {t('PDF')}
          </Button>
          {can('FACTURE_WRITE') && facture.remainingAmount > 0 && (
            <Button onClick={openPay}>
              <Wallet size={16} /> {t('Encaisser')}
            </Button>
          )}
        </div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <SectionHeader title={t('Détail des prestations')} />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('Description')}</th>
                <th className="td-num">{t('Qté × prix unit.')}</th>
                <th className="td-num">{t('Total')}</th>
              </tr>
            </thead>
            <tbody>
              {facture.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.description}</td>
                  <td className="td-num">
                    {formatNumber(l.quantity, 2)} × {formatTND(l.unitPrice)}
                  </td>
                  <td className="td-num fw-800">{formatTND(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionHeader title={`Paiements (${payments.length})`} />
        {payments.length === 0 ? (
          <p className="muted">{t('Aucun paiement enregistré.')}</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="list-row" style={{ cursor: 'default' }}>
              <div className="row-body">
                <div className="row-title text-success">{formatTND(p.amount)}</div>
                <div className="row-sub">
                  {t(MODE_LABELS[p.mode as PaymentMode] ?? p.mode)} · {formatDateTime(p.paidAt)}
                  {p.reference ? ` · ${p.reference}` : ''}
                  {p.employeeName ? ` · ${p.employeeName}` : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal
        title={t('Encaisser un paiement')}
        open={payOpen}
        onClose={() => setPayOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>
              {t('Annuler')}
            </Button>
            <Button onClick={submitPayment} loading={saving}>
              {t('Valider le paiement')}
            </Button>
          </>
        }
      >
        <form onSubmit={submitPayment}>
          <p className="muted" style={{ marginTop: 0 }}>
            {t('Reste à payer : {value}', { value: formatTND(facture.remainingAmount) })}
          </p>
          <TextField
            label={t('Montant (DT)')}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={amountError}
            inputMode="decimal"
          />
          <SelectField
            label={t('Mode de paiement')}
            value={mode}
            onChange={setMode}
            options={MODES.map((o) => ({ ...o, label: t(o.label) }))}
          />
          <TextField
            label={t('Référence')}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t('N° chèque, virement…')}
          />
        </form>
      </Modal>
    </div>
  );
}
