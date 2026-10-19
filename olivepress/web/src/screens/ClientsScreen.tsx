import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { clientsApi } from '../api/services';
import { Client } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Button, SearchBar } from '../components/Form';
import { Card, SectionHeader } from '../components/UI';
import { EmptyState, ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatDate, initials } from '../utils/format';

export default function ClientsScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback((q?: string) => {
    setError('');
    clientsApi
      .page({ query: q, page: 0 })
      .then((res) => {
        setClients(res.content);
        setPage(res.page.number);
        setTotal(res.page.totalElements);
        setHasMore(res.page.number + 1 < res.page.totalPages);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await clientsApi.page({ query, page: page + 1 });
      setClients((ls) => [...ls, ...res.content]);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={() => load(query)} />;

  return (
    <div>
      <div className="page-header">
        <SearchBar value={query} onChange={setQuery} placeholder={t('Rechercher un client...')} />
        <div className="spacer" />
        {can('CLIENT_WRITE') && (
          <Button onClick={() => navigate('/clients/nouveau')}>
            <UserPlus size={17} /> {t('Nouveau client')}
          </Button>
        )}
      </div>

      <Card pad={false}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <SectionHeader title={`Clients (${total})`} />
        </div>
        {clients.length === 0 ? (
          <EmptyState title={t('Aucun client')} subtitle={t('Ajoutez votre premier client.')} />
        ) : (
          clients.map((c) => (
            <div
              key={c.id}
              className="list-row"
              onClick={() => navigate(`/clients/${c.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="avatar"
                style={{ background: 'var(--olive-soft)', color: 'var(--olive-dark)' }}
              >
                {initials(c.fullName)}
              </div>
              <div className="row-body">
                <div className="row-title">
                  {c.fullName} {c.code && <span className="muted">({c.code})</span>}
                </div>
                <div className="row-sub">
                  {c.phone}
                  {c.address ? ` · ${c.address}` : ''}
                </div>
              </div>
              <div className="row-right">
                <span className="muted">{formatDate(c.createdAt)}</span>
                <Users size={16} className="muted" />
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <Button variant="ghost" loading={loadingMore} onClick={loadMore}>
              {t('Charger plus')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
