import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apportsApi } from '../api/services';
import { Apport } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Card, SectionHeader } from '../components/UI';
import { EmptyState, ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatDateTime, formatKg } from '../utils/format';

const CLOSED = ['LIVRAISON', 'CLOTURE'];

export default function ProductionScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [apports, setApports] = useState<Apport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apportsApi
      .list({ size: 100 })
      .then((p) => setApports(p.content ?? []))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} />;

  const inProgress = apports.filter((a) => !CLOSED.includes(a.status));
  const finished = apports.filter((a) => CLOSED.includes(a.status));

  const renderRows = (list: Apport[]) =>
    list.map((a) => (
      <div
        key={a.id}
        className="list-row"
        onClick={() => navigate(`/apports/${a.id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div className="row-body">
          <div className="row-title">
            {a.numero} · {a.clientName}
          </div>
          <div className="row-sub">
            {formatKg(a.netWeightKg)} · {formatDateTime(a.receivedAt)}
          </div>
        </div>
        <div className="row-right">
          <Badge status={a.status} />
        </div>
      </div>
    ));

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('Suivi de production — suivez chaque apport du réception au stockage.')}
      </p>
      {!can('PRODUCTION_WRITE') && (
        <div className="info-box">
          {t('Consultation seule : votre rôle ne permet pas de modifier la production.')}
        </div>
      )}
      <Card pad={false} style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <SectionHeader title={t('En cours ({count})', { count: inProgress.length })} />
        </div>
        {inProgress.length === 0 ? (
          <EmptyState title={t('Aucune opération en cours')} />
        ) : (
          renderRows(inProgress)
        )}
      </Card>
      <Card pad={false}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <SectionHeader title={t('Terminés / livrés ({count})', { count: finished.length })} />
        </div>
        {finished.length === 0 ? (
          <EmptyState title={t('Aucune opération terminée')} />
        ) : (
          renderRows(finished.slice(0, 20))
        )}
      </Card>
    </div>
  );
}
