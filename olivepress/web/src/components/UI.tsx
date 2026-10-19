import { CSSProperties, ReactNode } from 'react';
import { statusColors } from '../tokens';

export function Badge({ status, labelOverride }: { status: string; labelOverride?: string }) {
  const s = statusColors[status];
  const bg = s?.bg ?? '#E8E8E2';
  const fg = s?.fg ?? '#6B6B63';
  const label = labelOverride ?? s?.label ?? status;
  return (
    <span className="badge" style={{ background: bg, color: fg }}>
      {label}
    </span>
  );
}

export function Card({
  children,
  pad = true,
  className = '',
  style,
  onClick,
}: {
  children: ReactNode;
  pad?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div className={`card ${pad ? 'card-pad' : ''} ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-title">
      <span>{title}</span>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = 'var(--olive)',
}: {
  label: string;
  value: string;
  icon: ReactNode;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}1A`, color }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="value">{value}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
}

export function BarChart({
  data,
  unit = '',
  color = 'var(--olive)',
  decimals = 1,
}: {
  data: { label: string; value: number }[];
  unit?: string;
  color?: string;
  decimals?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 0.0001);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div className="bar-col" key={i}>
          <div className="bar-value">
            {d.value.toLocaleString('fr-FR', { maximumFractionDigits: decimals })}
            {unit}
          </div>
          <div
            className="bar"
            style={{ height: `${Math.max((d.value / max) * 100, 3)}%`, background: color }}
          />
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
