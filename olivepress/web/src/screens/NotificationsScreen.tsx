import { useCallback, useEffect, useState } from 'react';
import { Bell, CircleDollarSign, Info, PackageMinus, Timer } from 'lucide-react';
import { notificationsApi } from '../api/services';
import { AppNotification } from '../types';
import { Card } from '../components/UI';
import { Button } from '../components/Form';
import { EmptyState, ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import { formatDateTime } from '../utils/format';

const ICONS: Record<string, typeof Bell> = {
  STOCK_LOW: PackageMinus,
  FACTURE_IMPAYEE: CircleDollarSign,
  APPORTS_EN_ATTENTE: Timer,
  INFO: Info,
};

export default function NotificationsScreen() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    notificationsApi
      .list({ page: 0 })
      .then((res) => {
        setItems(res.content);
        setPage(res.page.number);
        setHasMore(res.page.number + 1 < res.page.totalPages);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await notificationsApi.list({ page: page + 1 });
      setItems((ls) => [...ls, ...res.content]);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(load, [load]);

  const unread = items.filter((n) => !n.readFlag).length;

  const markRead = async (n: AppNotification) => {
    if (n.readFlag) return;
    try {
      await notificationsApi.markRead(n.id);
      setItems((ls) => ls.map((x) => (x.id === n.id ? { ...x, readFlag: true } : x)));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((ls) => ls.map((x) => ({ ...x, readFlag: true })));
      toast(t('Toutes les notifications sont marquées comme lues.'), 'success');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      {unread > 0 && (
        <div className="page-header">
          <div className="spacer" />
          <Button variant="ghost" onClick={markAll}>
            {t('Tout marquer comme lu ({count})', { count: unread })}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title={t('Aucune notification')}
            subtitle={t('Vous serez averti des événements importants ici.')}
          />
        </Card>
      ) : (
        items.map((n) => {
          const Icon = ICONS[n.type] ?? Info;
          return (
            <Card
              key={n.id}
              style={{
                marginBottom: 10,
                borderLeft: n.readFlag ? undefined : '4px solid var(--olive)',
                opacity: n.readFlag ? 0.75 : 1,
                cursor: n.readFlag ? 'default' : 'pointer',
              }}
              onClick={() => markRead(n)}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="row-icon">
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <strong style={{ fontSize: 14 }}>{n.title}</strong>
                    {!n.readFlag && (
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: 'var(--olive)',
                          marginTop: 6,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{n.message}</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {formatDateTime(n.createdAt)}
                  </div>
                </div>
              </div>
            </Card>
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
    </div>
  );
}
