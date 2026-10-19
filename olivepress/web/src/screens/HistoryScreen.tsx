import { useEffect, useState } from 'react';
import { ArrowLeftRight, CreditCard, LogIn, Pencil, Plus, Trash2 } from 'lucide-react';
import { historyApi } from '../api/services';
import { HistoryEntry } from '../types';
import { Card } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatDateTime } from '../utils/format';

const ICONS: Record<string, { icon: typeof Plus; label: string; color: string }> = {
  CREATE: { icon: Plus, label: 'Création', color: 'var(--success)' },
  UPDATE: { icon: Pencil, label: 'Modification', color: 'var(--info)' },
  DELETE: { icon: Trash2, label: 'Suppression', color: 'var(--danger)' },
  STATUS_CHANGE: { icon: ArrowLeftRight, label: 'Changement de statut', color: 'var(--warning)' },
  PAYMENT: { icon: CreditCard, label: 'Paiement', color: 'var(--success)' },
  LOGIN: { icon: LogIn, label: 'Connexion', color: 'var(--olive)' },
};

export default function HistoryScreen() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    historyApi
      .list({ size: 50 })
      .then((p) => setEntries(p.content ?? []))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      {entries.map((e) => {
        const conf = ICONS[e.action] ?? {
          icon: Pencil,
          label: e.action,
          color: 'var(--text-muted)',
        };
        const Icon = conf.icon;
        return (
          <Card key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="row-icon" style={{ color: conf.color }}>
                <Icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                  {t(conf.label)}
                  {e.entityType ? ` · ${e.entityType}` : ''}
                </div>
                {e.details && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.details}</div>
                )}
                <div className="muted" style={{ marginTop: 2 }}>
                  {e.userName ?? t('Système')} · {formatDateTime(e.createdAt)}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      {entries.length === 0 && (
        <Card>
          <p className="muted" style={{ textAlign: 'center' }}>
            {t("Aucune entrée d'historique.")}
          </p>
        </Card>
      )}
    </div>
  );
}
