export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value?: number | null, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatKg(value?: number | null): string {
  return `${formatNumber(value, 0)} kg`;
}

export function formatLiters(value?: number | null): string {
  return `${formatNumber(value, 1)} L`;
}

export function formatTND(value?: number | null): string {
  return `${formatNumber(value, 2)} DT`;
}

export function formatPercent(value?: number | null): string {
  return `${formatNumber(value, 2)} %`;
}

/** Convertit une date locale (YYYY-MM-DD) au format ISO attendu par l'API. */
export function toIsoStart(dateYYYYMMDD: string): string {
  return new Date(`${dateYYYYMMDD}T00:00:00`).toISOString();
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function initials(fullName?: string): string {
  if (!fullName) return '?';
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
