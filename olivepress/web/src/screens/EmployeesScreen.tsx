import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserPlus } from 'lucide-react';
import { employeesApi } from '../api/services';
import { User } from '../types';
import { Card } from '../components/UI';
import { Button } from '../components/Form';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';

export default function EmployeesScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    employeesApi
      .list()
      .then(setUsers)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const toggle = async (u: User) => {
    try {
      await employeesApi.toggle(u.id);
      toast(u.active ? t('Compte désactivé.') : t('Compte activé.'), 'success');
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <div className="spacer" />
        <Button onClick={() => navigate('/employes/nouveau')}>
          <UserPlus size={17} /> {t('Nouvel employé')}
        </Button>
      </div>

      <Card pad={false}>
        {users.map((u) => (
          <div
            key={u.id}
            className="list-row"
            onClick={() => navigate(`/employes/${u.id}/modifier`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="row-icon">
              {u.role === 'ADMIN' ? <Shield size={18} /> : <span style={{ fontSize: 16 }}>👤</span>}
            </div>
            <div className="row-body">
              <div className="row-title">{u.fullName}</div>
              <div className="row-sub">
                @{u.username} · {u.role === 'ADMIN' ? t('Administrateur') : t('Employé')}
                {u.phone ? ` · ${u.phone}` : ''}
              </div>
            </div>
            <div className="row-right">
              <button
                className="chip"
                style={{
                  borderColor: u.active ? 'var(--success)' : 'var(--border)',
                  color: u.active ? 'var(--success)' : 'var(--text-muted)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(u);
                }}
              >
                {u.active ? t('Actif') : t('Inactif')}
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="empty-state">
            <p className="muted">{t('Aucun employé.')}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
