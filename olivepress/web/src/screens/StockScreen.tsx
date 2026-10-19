import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { clientsApi, stockApi } from '../api/services';
import { Client, MovementType, StockMovement, StockSummary } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Button, SelectField, TextField, TextAreaField } from '../components/Form';
import { Card, SectionHeader, StatCard } from '../components/UI';
import { EmptyState, ErrorState, LoadingView, Modal } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { useToast } from '../components/Toast';
import { formatDateTime, formatLiters } from '../utils/format';

const TYPES: { value: MovementType; label: string }[] = [
  { value: 'ENTREE', label: 'Entrée' },
  { value: 'SORTIE', label: 'Sortie' },
  { value: 'AJUSTEMENT_POSITIF', label: 'Ajustement positif' },
  { value: 'AJUSTEMENT_NEGATIF', label: 'Ajustement négatif' },
];

const TYPE_LABELS: Record<MovementType, string> = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
  AJUSTEMENT_POSITIF: 'Ajustement positif',
  AJUSTEMENT_NEGATIF: 'Ajustement négatif',
};

export default function StockScreen() {
  const { t } = useI18n();
  const { can } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MovementType>('ENTREE');
  const [qty, setQty] = useState('');
  const [lot, setLot] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [qtyError, setQtyError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError('');
    Promise.all([stockApi.summary(), stockApi.movements({ page: 0 })])
      .then(([s, m]) => {
        setSummary(s);
        setMovements(m.content);
        setPage(m.page.number);
        setHasMore(m.page.number + 1 < m.page.totalPages);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await stockApi.movements({ page: page + 1 });
      setMovements((ls) => [...ls, ...res.content]);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
    clientsApi
      .list(undefined, true)
      .then(setClients)
      .catch(() => {});
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const q = parseFloat(qty.replace(',', '.'));
    if (isNaN(q) || q <= 0) {
      setQtyError(t('Quantité invalide.'));
      return;
    }
    setQtyError('');
    setSaving(true);
    try {
      await stockApi.move({
        movementType: type,
        quantityL: q,
        lotNumber: lot.trim() || undefined,
        clientId: clientId === '' ? undefined : Number(clientId),
        reason: reason.trim() || undefined,
      });
      toast(t('Mouvement enregistré.'), 'success');
      setOpen(false);
      setQty('');
      setLot('');
      setClientId('');
      setReason('');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard
          label={t('Stock disponible')}
          value={formatLiters(summary?.availableL)}
          icon={<Plus size={20} />}
        />
        <StatCard
          label={t('Total entrées')}
          value={formatLiters(summary?.totalInL)}
          icon={<ArrowDownLeft size={20} />}
          color="var(--success)"
        />
        <StatCard
          label={t('Total sorties')}
          value={formatLiters(summary?.totalOutL)}
          icon={<ArrowUpRight size={20} />}
          color="var(--danger)"
        />
      </div>

      {can('STOCK_WRITE') && (
        <div className="page-header">
          <Button onClick={() => setOpen(true)}>
            <Plus size={17} /> {t('Enregistrer un mouvement')}
          </Button>
        </div>
      )}

      <Card pad={false}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <SectionHeader title={t('Derniers mouvements')} />
        </div>
        {movements.length === 0 ? (
          <EmptyState title={t('Aucun mouvement')} />
        ) : (
          movements.map((m) => {
            const positive = m.signedQuantity >= 0;
            return (
              <div key={m.id} className="list-row" style={{ cursor: 'default' }}>
                <div
                  className="row-icon"
                  style={{ color: positive ? 'var(--success)' : 'var(--danger)' }}
                >
                  {positive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="row-body">
                  <div className="row-title">
                    {t(TYPE_LABELS[m.movementType])} · {formatLiters(Math.abs(m.quantityL))}
                  </div>
                  <div className="row-sub">
                    {formatDateTime(m.createdAt)}
                    {m.lotNumber ? ` · Lot ${m.lotNumber}` : ''}
                    {m.reason ? ` · ${m.reason}` : ''}
                  </div>
                </div>
                <span className={`fw-800 ${positive ? 'text-success' : 'text-danger'}`}>
                  {positive ? '+' : '−'}
                  {formatLiters(Math.abs(m.signedQuantity))}
                </span>
              </div>
            );
          })
        )}

        {hasMore && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <Button variant="ghost" loading={loadingMore} onClick={loadMore}>
              {t('Charger plus')}
            </Button>
          </div>
        )}
      </Card>

      <Modal
        title={t('Nouveau mouvement de stock')}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('Annuler')}
            </Button>
            <Button onClick={submit} loading={saving}>
              {t('Enregistrer')}
            </Button>
          </>
        }
      >
        <form onSubmit={submit}>
          <SelectField
            label={t('Type')}
            value={type}
            onChange={setType}
            options={TYPES.map((o) => ({ ...o, label: t(o.label) }))}
          />
          <TextField
            label={t('Quantité (litres)')}
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            error={qtyError}
            inputMode="decimal"
          />
          <TextField label={t('N° de lot')} value={lot} onChange={(e) => setLot(e.target.value)} />
          <SelectField
            label={t('Client (facultatif)')}
            value={clientId}
            onChange={setClientId}
            options={clients.map((c) => ({ value: c.id, label: c.fullName }))}
            placeholder={t('— Aucun —')}
          />
          <TextAreaField
            label={t('Motif')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="field">
            <label>{t('Stock disponible actuel')}</label>
            <div className="info-box mb-0" style={{ marginBottom: 0 }}>
              <span className="big" style={{ fontSize: 20 }}>
                {formatLiters(summary?.availableL)}
              </span>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
