import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Printer, UserPlus } from 'lucide-react';
import { apportsApi, clientsApi, facturesApi, livraisonsApi } from '../api/services';
import { Apport, Client, Facture, Livraison } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Badge, Card, SectionHeader } from '../components/UI';
import { Button } from '../components/Form';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import {
  formatDate,
  formatDateTime,
  formatKg,
  formatLiters,
  formatTND,
  initials,
} from '../utils/format';
import { copyText, printClient } from '../utils/pdf';

export default function ClientDetailScreen() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const clientId = Number(id);

  const [client, setClient] = useState<Client | null>(null);
  const [apports, setApports] = useState<Apport[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setError('');
    setLoading(true);
    Promise.all([
      clientsApi.get(clientId),
      apportsApi.byClient(clientId),
      can('FACTURE_READ') ? facturesApi.byClient(clientId) : Promise.resolve([] as Facture[]),
      livraisonsApi.list({ clientId, size: 20 }),
    ])
      .then(([c, a, f, l]) => {
        setClient(c);
        setApports(a);
        setFactures(f);
        setLivraisons(l.content ?? []);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [clientId, can]);

  useEffect(load, [load]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!client) return null;

  const totalNetKg = apports.reduce((s, a) => s + (a.netWeightKg ?? 0), 0);

  const shareFiche = async () => {
    const text = `Fiche client ${client.fullName}\nTéléphone : ${client.phone}\nApports : ${apports.length} (${formatKg(totalNetKg)})\nFactures : ${factures.length}`;
    await copyText(text);
  };

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 18 }}>
        <Card>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              className="avatar"
              style={{
                width: 56,
                height: 56,
                fontSize: 20,
                background: 'var(--olive)',
                color: '#fff',
              }}
            >
              {initials(client.fullName)}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{client.fullName}</div>
              {client.code && <div className="muted">Code : {client.code}</div>}
              <div style={{ marginTop: 4 }}>
                <Badge
                  status={client.active ? 'RECU' : 'CLOTURE'}
                  labelOverride={client.active ? t('Actif') : t('Inactif')}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 13.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.9,
            }}
          >
            <div>📞 {client.phone}</div>
            {client.address && <div>📍 {client.address}</div>}
            <div>📅 {t('Client depuis le {date}', { date: formatDate(client.createdAt) })}</div>
          </div>
        </Card>

        <Card>
          <SectionHeader title={t('Résumé')} />
          <div className="grid-3">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{apports.length}</div>
              <div className="muted">{t('Apports')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--olive)' }}>
                {formatKg(totalNetKg)}
              </div>
              <div className="muted">{t('Poids net total')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{factures.length}</div>
              <div className="muted">{t('Factures')}</div>
            </div>
          </div>
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() =>
                printClient(client, {
                  apports: apports.length,
                  netWeightKg: totalNetKg,
                  factures: factures.length,
                })
              }
            >
              <Printer size={16} /> {t('Imprimer la fiche')}
            </Button>
            <Button variant="ghost" onClick={shareFiche}>
              {t('Copier le résumé')}
            </Button>
            {can('CLIENT_WRITE') && (
              <Button onClick={() => navigate(`/clients/${client.id}/modifier`)}>
                {t('Modifier')}
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Card pad={false} style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <SectionHeader
            title={`Apports (${apports.length})`}
            action={
              can('APPORT_WRITE') ? (
                <Link className="btn-link" to={`/apports/nouveau/${client.id}`}>
                  + {t('Nouveau')}
                </Link>
              ) : undefined
            }
          />
        </div>
        {apports.slice(0, 10).map((a) => (
          <div
            key={a.id}
            className="list-row"
            onClick={() => navigate(`/apports/${a.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="row-body">
              <div className="row-title">{a.numero}</div>
              <div className="row-sub">
                {formatKg(a.netWeightKg)} · {formatDateTime(a.receivedAt)}
              </div>
            </div>
            <div className="row-right">
              <Badge status={a.status} />
            </div>
          </div>
        ))}
        {apports.length === 0 && (
          <div className="empty-state">
            <p className="muted">{t('Aucun apport')}</p>
          </div>
        )}
      </Card>

      <div className="grid-2">
        <Card pad={false}>
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <SectionHeader title={`Livraisons (${livraisons.length})`} />
          </div>
          {livraisons.map((l) => (
            <div key={l.id} className="list-row">
              <div className="row-body">
                <div className="row-title">{l.numero}</div>
                <div className="row-sub">{formatDateTime(l.deliveredAt)}</div>
              </div>
              <span className="fw-800">{formatLiters(l.quantityL)}</span>
            </div>
          ))}
          {livraisons.length === 0 && (
            <div className="empty-state">
              <p className="muted">{t('Aucune livraison')}</p>
            </div>
          )}
        </Card>

        {can('FACTURE_READ') && (
          <Card pad={false}>
            <div className="card-pad" style={{ paddingBottom: 0 }}>
              <SectionHeader title={`Factures (${factures.length})`} />
            </div>
            {factures.map((f) => (
              <div
                key={f.id}
                className="list-row"
                onClick={() => navigate(`/factures/${f.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="row-body">
                  <div className="row-title">{f.numero}</div>
                  <div className="row-sub">
                    {t('Total : {value}', { value: formatTND(f.totalAmount) })} —{' '}
                    {t('Reste : {value}', { value: formatTND(f.remainingAmount) })}
                  </div>
                </div>
                <div className="row-right">
                  <Badge status={f.statut} />
                  {can('FACTURE_WRITE') && <UserPlus size={14} className="muted" />}
                </div>
              </div>
            ))}
            {factures.length === 0 && (
              <div className="empty-state">
                <p className="muted">{t('Aucune facture')}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
