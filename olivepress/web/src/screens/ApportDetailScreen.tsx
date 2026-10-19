import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Copy, Droplet, FileText, Pencil, Printer } from 'lucide-react';
import { apportsApi, facturesApi, productionApi } from '../api/services';
import { Apport, ApportStatus, Facture, ProductionRecord, StatusHistory } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Card, SectionHeader } from '../components/UI';
import { Button } from '../components/Form';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import { formatDateTime, formatKg, formatLiters, formatPercent, formatTND } from '../utils/format';
import { copyText, printTicket } from '../utils/pdf';
import { statusColors } from '../tokens';

const FLOW: ApportStatus[] = [
  'RECU',
  'EN_ATTENTE',
  'TRI',
  'PRESSAGE',
  'PRODUCTION_TERMINEE',
  'STOCKAGE',
  'LIVRAISON',
  'CLOTURE',
];

export default function ApportDetailScreen() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { toast } = useToast();
  const apportId = Number(id);

  const [apport, setApport] = useState<Apport | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [facture, setFacture] = useState<Facture | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  const load = useCallback(() => {
    setError('');
    Promise.all([
      apportsApi.get(apportId),
      apportsApi.history(apportId),
      productionApi.byApport(apportId),
      facturesApi.byApport(apportId).catch(() => null),
    ])
      .then(([a, h, p, f]) => {
        setApport(a);
        setHistory(h);
        setProductions(p);
        setFacture(f);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [apportId]);

  useEffect(load, [load]);

  const changeStatus = async (status: ApportStatus) => {
    if (!apport) return;
    if (status === 'ANOMALIE' && !window.confirm(t('Signaler une anomalie sur cet apport ?')))
      return;
    setChanging(true);
    try {
      await apportsApi.updateStatus(apport.id, status);
      toast(`Statut mis à jour : ${statusColors[status]?.label ?? status}`, 'success');
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setChanging(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!apport) return null;

  const flowIndex = FLOW.indexOf(apport.status);

  const shareTicket = async () => {
    const text = `Ticket d'apport ${apport.numero}\nClient : ${apport.clientName}\nTicket : ${apport.ticketNumber ?? '-'}\nPoids brut : ${formatKg(apport.grossWeightKg)}\nTare : ${formatKg(apport.tareKg)}\nPoids net : ${formatKg(apport.netWeightKg)}\nStatut : ${statusColors[apport.status]?.label ?? apport.status}`;
    await copyText(text);
    toast(t('Ticket copié dans le presse-papiers.'), 'success');
  };

  return (
    <div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{apport.numero}</div>
            <div className="muted">
              {apport.clientName}
              {apport.clientCode ? ` (${apport.clientCode})` : ''}
            </div>
          </div>
          <Badge status={apport.status} />
        </div>

        <div className="grid-3" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <div className="muted">{t('Poids brut')}</div>
            <div className="fw-800" style={{ fontSize: 16 }}>
              {formatKg(apport.grossWeightKg)}
            </div>
          </div>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <div className="muted">{t('Tare')}</div>
            <div className="fw-800" style={{ fontSize: 16 }}>
              {formatKg(apport.tareKg)}
            </div>
          </div>
          <div>
            <div className="muted">{t('Poids net')}</div>
            <div className="fw-800 text-olive" style={{ fontSize: 18 }}>
              {formatKg(apport.netWeightKg)}
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: 14, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.9 }}
        >
          <div>
            {t('Réception')} : {formatDateTime(apport.receivedAt)}
          </div>
          <div>
            {t('Ticket')} : {apport.ticketNumber ?? '—'}
          </div>
          {apport.employeeName && (
            <div>
              {t('Employé')} : {apport.employeeName}
            </div>
          )}
          {apport.observations && (
            <div>
              {t('Observations')} : {apport.observations}
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={shareTicket}>
            <Copy size={16} /> {t('Copier le ticket')}
          </Button>
          <Button variant="outline" onClick={() => printTicket(apport)}>
            <Printer size={16} /> {t('PDF')}
          </Button>
          {can('APPORT_WRITE') && (
            <Button variant="ghost" onClick={() => navigate(`/apports/${apport.id}/modifier`)}>
              <Pencil size={16} /> {t('Modifier')}
            </Button>
          )}
        </div>
      </Card>

      {facture && (
        <Card style={{ marginBottom: 18 }}>
          <SectionHeader title={t('Facture automatique')} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{facture.numero}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {facture.lines[0]?.description}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="fw-800 text-olive" style={{ fontSize: 17 }}>
                {formatTND(facture.totalAmount)}
              </div>
              <span
                className="badge"
                style={{
                  background: statusColors[facture.statut]?.bg,
                  color: statusColors[facture.statut]?.fg,
                }}
              >
                {t(statusColors[facture.statut]?.label ?? facture.statut)}
              </span>
            </div>
          </div>
          <div className="form-actions">
            <Link to={`/factures/${facture.id}`} style={{ width: '100%' }}>
              <Button variant="outline" block>
                <FileText size={16} /> {t('Voir la facture')}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {can('PRODUCTION_WRITE') && (
        <Card style={{ marginBottom: 18 }}>
          <SectionHeader title={t('Avancement de la production')} />
          <div className="stepper">
            {FLOW.map((s, i) => (
              <span
                key={s}
                className={`step-dot ${i < flowIndex ? 'done' : ''} ${i === flowIndex ? 'current' : ''}`}
              >
                {t(statusColors[s]?.label ?? s)}
              </span>
            ))}
          </div>
          <div className="chips" style={{ marginBottom: 0 }}>
            {FLOW.filter((s) => s !== apport.status).map((s) => (
              <button key={s} className="chip" disabled={changing} onClick={() => changeStatus(s)}>
                {t(statusColors[s]?.label ?? s)}
              </button>
            ))}
            <button
              className="chip"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              disabled={changing}
              onClick={() => changeStatus('ANOMALIE')}
            >
              <AlertTriangle size={13} style={{ verticalAlign: -2 }} /> {t('Signaler anomalie')}
            </button>
          </div>
          <div className="form-actions">
            <Link to={`/apports/${apport.id}/production`} style={{ width: '100%' }}>
              <Button block>
                <Droplet size={17} /> {t('Enregistrer la production & rendement')}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {productions.length > 0 && (
        <Card style={{ marginBottom: 18 }}>
          <SectionHeader title={t('Production enregistrée')} />
          {productions.map((p) => (
            <div key={p.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{formatDateTime(p.productionDate)}</strong>
                <span className="text-success fw-800">{formatPercent(p.yieldPercent)}</span>
              </div>
              <div className="muted">
                {t('{kg} traitées → {liters} d’huile', {
                  kg: formatKg(p.olivesProcessedKg),
                  liters: formatLiters(p.oilObtainedL),
                })}
              </div>
              {p.notes && <div className="muted">{p.notes}</div>}
            </div>
          ))}
        </Card>
      )}

      <Card>
        <SectionHeader title={t('Historique des étapes')} />
        {history.length === 0 ? (
          <p className="muted">{t("Aucun changement d'étape.")}</p>
        ) : (
          <div className="timeline">
            {history.map((h) => (
              <div key={h.id} className="timeline-item">
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {h.fromStatus ? `${statusColors[h.fromStatus]?.label ?? h.fromStatus} → ` : ''}
                  {t(statusColors[h.toStatus]?.label ?? h.toStatus)}
                </div>
                <div className="muted">
                  {formatDateTime(h.changedAt)} · {h.userName ?? t('Système')}
                </div>
                {h.comment && <div className="muted">{h.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
