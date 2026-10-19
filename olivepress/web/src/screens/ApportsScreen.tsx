import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { apportsApi } from '../api/services';
import { Apport, ApportStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Card } from '../components/UI';
import { Button, SearchBar } from '../components/Form';
import { EmptyState, ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatDateTime, formatKg } from '../utils/format';

const FILTERS: { label: string; status?: ApportStatus }[] = [
  { label: 'Tous' },
  { label: 'Reçus', status: 'RECU' },
  { label: 'En attente', status: 'EN_ATTENTE' },
  { label: 'Pressage', status: 'PRESSAGE' },
  { label: 'Terminés', status: 'PRODUCTION_TERMINEE' },
  { label: 'Anomalies', status: 'ANOMALIE' },
];

export default function ApportsScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [apports, setApports] = useState<Apport[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApportStatus | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    apportsApi
      .list({ query: query || undefined, status, size: 50 })
      .then((p) => setApports(p.content ?? []))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [query, status]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <SearchBar value={query} onChange={setQuery} placeholder={t('N° apport, client...')} />
        <div className="spacer" />
        {can('APPORT_WRITE') && (
          <Button onClick={() => navigate('/apports/nouveau')}>
            <Plus size={17} /> {t('Nouvel apport')}
          </Button>
        )}
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={`chip ${status === f.status ? 'active' : ''}`}
            onClick={() => setStatus(f.status)}
          >
            {t(f.label)}
          </button>
        ))}
      </div>

      <Card pad={false}>
        {apports.length === 0 ? (
          <EmptyState
            title={t('Aucun apport')}
            subtitle={t('Les apports enregistrés apparaîtront ici.')}
          />
        ) : (
          apports.map((a) => (
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
          ))
        )}
      </Card>
    </div>
  );
}
