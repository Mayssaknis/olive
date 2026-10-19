import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { facturesApi } from '../api/services';
import { Facture, FactureStatut } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Card } from '../components/UI';
import { Button } from '../components/Form';
import { EmptyState, ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatDate, formatTND } from '../utils/format';

const FILTERS: { label: string; statut?: FactureStatut }[] = [
  { label: 'Toutes' },
  { label: 'Impayées', statut: 'IMPAYEE' },
  { label: 'Partielles', statut: 'PARTIELLE' },
  { label: 'Payées', statut: 'PAYEE' },
];

export default function FacturesScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [statut, setStatut] = useState<FactureStatut | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    facturesApi
      .list({ statut, size: 50 })
      .then((p) => setFactures(p.content ?? []))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [statut]);

  useEffect(load, [load]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <div className="spacer" />
        {can('FACTURE_WRITE') && (
          <Button onClick={() => navigate('/factures/nouvelle')}>
            <Plus size={17} /> {t('Nouvelle facture')}
          </Button>
        )}
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={`chip ${statut === f.statut ? 'active' : ''}`}
            onClick={() => setStatut(f.statut)}
          >
            {t(f.label)}
          </button>
        ))}
      </div>

      <Card pad={false}>
        {factures.length === 0 ? (
          <EmptyState
            title={t('Aucune facture')}
            subtitle={t('Les factures émises apparaîtront ici.')}
          />
        ) : (
          factures.map((f) => (
            <div
              key={f.id}
              className="list-row"
              onClick={() => navigate(`/factures/${f.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="row-body">
                <div className="row-title">
                  {f.numero} — {f.clientName}
                </div>
                <div className="row-sub">
                  {formatDate(f.invoiceDate)} —{' '}
                  {t('Total : {value}', { value: formatTND(f.totalAmount) })} —{' '}
                  {t('Reste : {value}', { value: formatTND(f.remainingAmount) })}
                </div>
              </div>
              <div className="row-right">
                <Badge status={f.statut} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
