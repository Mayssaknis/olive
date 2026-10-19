import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Droplets,
  FileText,
  Package,
  Scale,
  Timer,
  Truck,
  Wallet,
  Wheat,
} from 'lucide-react';
import { dashboardApi } from '../api/services';
import { Dashboard } from '../types';
import { useAuth } from '../auth/AuthContext';
import { BarChart, Badge, Card, SectionHeader, StatCard } from '../components/UI';
import { ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatDateTime, formatKg, formatLiters, formatPercent, formatTND } from '../utils/format';

export default function DashboardScreen() {
  const { t } = useI18n();
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    dashboardApi
      .get()
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingView label={t('Chargement du tableau de bord...')} />;

  const productionChart = (data.productionByDay ?? []).slice(-7).map((d) => ({
    label: d.date.slice(5),
    value: d.oilL,
  }));
  const yieldChart = (data.yieldByDay ?? []).slice(-7).map((d) => ({
    label: d.date.slice(5),
    value: d.yieldPercent,
  }));

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          {t('Bonjour, {value} 👋', { value: user?.fullName?.split(' ')[0] ?? '' })}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          {t("Voici l'activité de votre huilerie aujourd'hui.")}
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard
          label={t('Apports du jour')}
          value={String(data.apportsToday)}
          icon={<Truck size={20} />}
        />
        <StatCard
          label={t('Poids net du jour')}
          value={formatKg(data.netWeightTodayKg)}
          icon={<Scale size={20} />}
        />
        <StatCard
          label={t('Olives traitées')}
          value={formatKg(data.olivesProcessedTotalKg)}
          icon={<Wheat size={20} />}
        />
        <StatCard
          label={t('Huile produite')}
          value={formatLiters(data.oilProducedTotalL)}
          icon={<Droplets size={20} />}
          color="var(--success)"
        />
        <StatCard
          label={t('Rendement moyen')}
          value={formatPercent(data.avgYieldPercent)}
          icon={<BarChart3 size={20} />}
          color="var(--info)"
        />
        <StatCard
          label={t('Opérations en attente')}
          value={String(data.pendingOperations)}
          icon={<Timer size={20} />}
          color="var(--warning)"
        />
        <StatCard
          label={t("Stock d'huile")}
          value={formatLiters(data.availableStockL)}
          icon={<Package size={20} />}
        />
        {can('FACTURE_READ') && (
          <>
            <StatCard
              label={t('Total facturé')}
              value={formatTND(data.totalInvoiced)}
              icon={<FileText size={20} />}
            />
            <StatCard
              label={t('Encaissé')}
              value={formatTND(data.totalCollected)}
              icon={<Wallet size={20} />}
              color="var(--success)"
            />
            <StatCard
              label={t('Reste à payer')}
              value={formatTND(data.totalRemaining)}
              icon={<FileText size={20} />}
              color="var(--danger)"
            />
          </>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <Card>
          <SectionHeader title={t("Production d'huile (7 jours)")} />
          <BarChart data={productionChart} unit=" L" decimals={1} />
        </Card>
        <Card>
          <SectionHeader title={t('Rendement (7 jours)')} />
          <BarChart data={yieldChart} unit=" %" color="var(--success)" decimals={1} />
        </Card>
      </div>

      {data.pendingList?.length > 0 && (
        <Card pad={false} style={{ marginBottom: 20 }}>
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <SectionHeader title={`Opérations en cours (${data.pendingList.length})`} />
          </div>
          {data.pendingList.slice(0, 8).map((p) => (
            <div
              key={p.apportId}
              className="list-row"
              onClick={() => navigate(`/apports/${p.apportId}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="row-body">
                <div className="row-title">
                  {p.numero} · {p.clientName}
                </div>
                <div className="row-sub">{formatKg(p.netWeightKg)}</div>
              </div>
              <div className="row-right">
                <Badge status={p.status} />
              </div>
            </div>
          ))}
        </Card>
      )}

      <div className="grid-2">
        <Card pad={false}>
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <SectionHeader
              title={t('Derniers apports')}
              action={
                <Link className="btn-link" to="/apports">
                  {t('Voir tout')}
                </Link>
              }
            />
          </div>
          {(data.recentApports ?? []).slice(0, 5).map((a) => (
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
                <div className="row-sub">{formatDateTime(a.receivedAt)}</div>
              </div>
              <div className="row-right">
                <span className="fw-800">{formatKg(a.netWeightKg)}</span>
                <Badge status={a.status} />
              </div>
            </div>
          ))}
        </Card>

        {can('FACTURE_READ') && (data.unpaidInvoices ?? []).length > 0 && (
          <Card pad={false}>
            <div className="card-pad" style={{ paddingBottom: 0 }}>
              <SectionHeader
                title={t('Factures impayées')}
                action={
                  <Link className="btn-link" to="/factures">
                    {t('Voir tout')}
                  </Link>
                }
              />
            </div>
            {data.unpaidInvoices.slice(0, 5).map((f) => (
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
                    {t('Total : {value}', { value: formatTND(f.totalAmount) })}
                  </div>
                </div>
                <div className="row-right">
                  <span className="text-danger fw-800">{formatTND(f.remainingAmount)}</span>
                  <Badge status={f.statut} />
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      <p className="muted" style={{ textAlign: 'center', marginTop: 24 }}>
        {t('Statistiques calculées en direct depuis la base de données.')}
      </p>
    </div>
  );
}
