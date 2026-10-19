import { useEffect, useState } from 'react';
import {
  Download,
  Leaf,
  Scale,
  TrendingUp,
  Package,
  ArrowDown,
  ArrowUp,
  Receipt,
  Wallet,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { reportsApi } from '../api/services';
import { Button, DateField } from '../components/Form';
import { Card, SectionHeader, StatCard } from '../components/UI';
import { EmptyState, ErrorState, LoadingView } from '../components/Feedback';
import { errorMessage } from '../api/client';
import { useI18n } from '../i18n';
import { formatKg, formatLiters, formatNumber, formatTND, todayISODate } from '../utils/format';
import { printReport } from '../utils/pdf';

type ReportType = 'global' | 'reception' | 'production' | 'stock' | 'facturation';

const TYPES: { value: ReportType; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'reception', label: 'Réception' },
  { value: 'production', label: 'Production' },
  { value: 'stock', label: 'Stock' },
  { value: 'facturation', label: 'Facturation' },
];

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function ReportsScreen() {
  const { t } = useI18n();
  const [type, setType] = useState<ReportType>('global');
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayISODate());
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    reportsApi
      .get(type, from, to)
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [type, from, to]);

  return (
    <div>
      <div className="chips">
        {TYPES.map((rt) => (
          <button
            key={rt.value}
            className={`chip ${type === rt.value ? 'active' : ''}`}
            onClick={() => setType(rt.value)}
          >
            {t(rt.label)}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: 18 }}>
        <div className="form-row">
          <DateField label={t('Du')} value={from} onChange={setFrom} />
          <DateField label={t('Au')} value={to} onChange={setTo} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <p className="muted mb-0">{t('Le rapport affiché peut être téléchargé en PDF.')}</p>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || loading}
            onClick={() => data && printReport(data, type, from, to)}
          >
            <Download size={15} /> {t('Télécharger PDF')}
          </Button>
        </div>
      </Card>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <EmptyState title={t('Aucune donnée')} />
      ) : (
        <>
          {data.reception && (
            <>
              <SectionHeader title={t('Réception')} />
              <div className="stat-grid" style={{ marginBottom: 14 }}>
                <StatCard
                  label={t('Apports')}
                  value={formatNumber(data.reception.nombreApports)}
                  icon={<Download size={20} />}
                />
                <StatCard
                  label={t('Poids net')}
                  value={formatKg(data.reception.poidsNetTotalKg)}
                  icon={<Scale size={20} />}
                />
              </div>
              {data.reception.parStatut && (
                <Card>
                  {Object.entries(data.reception.parStatut as Record<string, number>).map(
                    ([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <span className="muted">{k}</span>
                        <span className="fw-800">{formatNumber(v)}</span>
                      </div>
                    ),
                  )}
                </Card>
              )}
            </>
          )}

          {data.production && (
            <>
              <SectionHeader title={t('Production')} />
              <div className="stat-grid" style={{ marginBottom: 14 }}>
                <StatCard
                  label={t('Olives traitées')}
                  value={formatKg(data.production.olivesTraiteesKg)}
                  icon={<Leaf size={20} />}
                />
                <StatCard
                  label={t('Huile produite')}
                  value={formatLiters(data.production.huileProduiteL)}
                  icon={<Package size={20} />}
                />
                <StatCard
                  label={t('Rendement moyen')}
                  value={`${formatNumber(data.production.rendementMoyenPourcent, 2)} %`}
                  icon={<TrendingUp size={20} />}
                  color="var(--olive)"
                />
              </div>
            </>
          )}

          {data.stock && (
            <>
              <SectionHeader title={t('Stock')} />
              <div className="stat-grid" style={{ marginBottom: 14 }}>
                <StatCard
                  label={t('Disponible')}
                  value={formatLiters(data.stock.stockDisponibleL)}
                  icon={<Package size={20} />}
                />
                <StatCard
                  label={t('Entrées')}
                  value={formatLiters(data.stock.entreesL)}
                  icon={<ArrowDown size={20} />}
                  color="var(--success)"
                />
                <StatCard
                  label={t('Sorties')}
                  value={formatLiters(data.stock.sortiesL)}
                  icon={<ArrowUp size={20} />}
                  color="var(--danger)"
                />
              </div>
            </>
          )}

          {data.facturation && (
            <>
              <SectionHeader title={t('Facturation')} />
              <div className="stat-grid">
                <StatCard
                  label={t('Total facturé')}
                  value={formatTND(data.facturation.totalFacture)}
                  icon={<Receipt size={20} />}
                />
                <StatCard
                  label={t('Encaissé')}
                  value={formatTND(data.facturation.totalEncaisse)}
                  icon={<Wallet size={20} />}
                  color="var(--success)"
                />
                <StatCard
                  label={t('Reste à payer')}
                  value={formatTND(data.facturation.resteAPayer)}
                  icon={<AlertCircle size={20} />}
                  color="var(--danger)"
                />
                <StatCard
                  label={t('Factures impayées')}
                  value={formatNumber(data.facturation.facturesImpayees)}
                  icon={<FileText size={20} />}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
