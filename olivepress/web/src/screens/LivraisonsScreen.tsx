import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Printer } from 'lucide-react';
import { livraisonsApi } from '../api/services';
import { Livraison } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/UI';
import { Button } from '../components/Form';
import { EmptyState, ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatDateTime, formatLiters } from '../utils/format';
import { printLivraison } from '../utils/pdf';

export default function LivraisonsScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    livraisonsApi
      .list({ size: 50 })
      .then((p) => setLivraisons(p.content ?? []))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <div className="spacer" />
        {can('LIVRAISON_WRITE') && (
          <Button onClick={() => navigate('/livraisons/nouvelle')}>
            <Plus size={17} /> {t('Nouvelle livraison')}
          </Button>
        )}
      </div>

      <Card pad={false}>
        {livraisons.length === 0 ? (
          <EmptyState
            title={t('Aucune livraison')}
            subtitle={t('Les bons de livraison apparaîtront ici.')}
          />
        ) : (
          livraisons.map((l) => (
            <div key={l.id} className="list-row" style={{ cursor: 'default' }}>
              <div className="row-body">
                <div className="row-title">
                  {l.numero} · {l.clientName}
                </div>
                <div className="row-sub">
                  {formatLiters(l.quantityL)} · {formatDateTime(l.deliveredAt)}
                  {l.lotNumber ? ` · Lot ${l.lotNumber}` : ''}
                </div>
              </div>
              <div className="row-right">
                <Button variant="outline" size="sm" onClick={() => printLivraison(l)}>
                  <Printer size={14} /> {t('PDF')}
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
