import { Apport, Client, Facture, Livraison } from '../types';
import {
  formatDate,
  formatDateTime,
  formatKg,
  formatLiters,
  formatNumber,
  formatTND,
} from './format';
import { statusColors } from '../tokens';

interface Labels {
  pressName: string;
  invoice: string;
  ticket: string;
  delivery: string;
  client: string;
  clientCode: string;
  clientCard: string;
  phone: string;
  address: string;
  status: string;
  date: string;
  dueDate: string;
  ticketNo: string;
  receivedOn: string;
  employee: string;
  grossWeight: string;
  tare: string;
  netWeight: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  total: string;
  paid: string;
  remaining: string;
  observations: string;
  lot: string;
  quantityL: string;
  notes: string;
  payments: string;
  amount: string;
  mode: string;
  ref: string;
}

const L: Labels = {
  pressName: 'OlivePress',
  invoice: 'FACTURE',
  ticket: "TICKET D'APPORT",
  delivery: 'BON DE LIVRAISON',
  client: 'Client',
  clientCode: 'Code client',
  clientCard: 'FICHE CLIENT',
  phone: 'Téléphone',
  address: 'Adresse',
  status: 'Statut',
  date: 'Date',
  dueDate: 'Échéance',
  ticketNo: 'Ticket',
  receivedOn: 'Réception',
  employee: 'Employé',
  grossWeight: 'Poids brut',
  tare: 'Tare',
  netWeight: 'Poids net',
  description: 'Description',
  quantity: 'Qté',
  unitPrice: 'Prix unitaire',
  lineTotal: 'Total',
  total: 'Total',
  paid: 'Payé',
  remaining: 'Reste',
  observations: 'Observations',
  lot: 'Lot',
  quantityL: 'Quantité',
  notes: 'Notes',
  payments: 'Paiements',
  amount: 'Montant',
  mode: 'Mode',
  ref: 'Référence',
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function baseStyles(): string {
  return `
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #283D2B; margin: 0; padding: 32px 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #556B2F; padding-bottom: 16px; }
    .brand { font-size: 26px; font-weight: 800; color: #556B2F; }
    .doc-title { font-size: 18px; font-weight: 700; color: #283D2B; text-align: right; }
    .doc-num { background: #556B2F; color: #fff; border-radius: 8px; padding: 4px 12px; font-weight: 700; display: inline-block; margin-top: 6px; }
    .meta { margin-top: 20px; font-size: 13px; color: #6B6B63; }
    .meta div { padding: 3px 0; }
    .meta strong { color: #283D2B; }
    table { width: 100%; border-collapse: collapse; margin-top: 22px; font-size: 13px; }
    th { background: #F7F4EC; color: #283D2B; text-align: left; padding: 10px; border-bottom: 1px solid #E8E8E2; }
    td { padding: 10px; border-bottom: 1px solid #E8E8E2; }
    td.num, th.num { text-align: right; }
    .totals { margin-top: 20px; width: 100%; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .row.grand { border-top: 2px solid #283D2B; margin-top: 6px; padding-top: 10px; font-size: 17px; font-weight: 800; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .section-title { margin-top: 26px; font-size: 15px; font-weight: 800; color: #556B2F; }
    .notes { margin-top: 10px; font-size: 13px; color: #6B6B63; white-space: pre-wrap; }
    .footer { margin-top: 40px; font-size: 11px; color: #9A9A90; text-align: center; border-top: 1px solid #E8E8E2; padding-top: 12px; }
  `;
}

function htmlDocument(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${baseStyles()}</style></head><body>${body}</body></html>`;
}

function clientLine(name: string | undefined, code: string | undefined): string {
  return `<div><strong>${escapeHtml(L.client)} :</strong> ${escapeHtml(name ?? '-')}${code ? ` &nbsp; <strong>${escapeHtml(L.clientCode)} :</strong> ${escapeHtml(code)}` : ''}</div>`;
}

function header(title: string, numero: string): string {
  return `
    <div class="header">
      <div class="brand">${escapeHtml(L.pressName)}</div>
      <div style="text-align:inherit">
        <div class="doc-title">${escapeHtml(title)}</div>
        <div class="doc-num">${escapeHtml(numero)}</div>
      </div>
    </div>`;
}

function statusBadge(status: string): string {
  const conf = statusColors[status];
  const label = conf?.label ?? status;
  const bg = conf?.bg ?? '#E8E8E2';
  const fg = conf?.fg ?? '#6B6B63';
  return `<span class="badge" style="background:${bg};color:${fg}">${escapeHtml(label)}</span>`;
}

export function buildFactureHtml(
  facture: Facture,
  payments: { amount: number; mode: string; paidAt: string; reference?: string }[] = [],
): string {
  const rows = facture.lines
    .map(
      (l) => `<tr>
        <td>${escapeHtml(l.description)}</td>
        <td class="num">${formatNumber(l.quantity, 2)}</td>
        <td class="num">${formatTND(l.unitPrice)}</td>
        <td class="num">${formatTND(l.total)}</td>
      </tr>`,
    )
    .join('');

  const paymentsBlock = payments.length
    ? `<div class="section-title">${escapeHtml(L.payments)}</div>
       <table>
         <thead><tr><th>${escapeHtml(L.date)}</th><th>${escapeHtml(L.mode)}</th><th>${escapeHtml(L.ref)}</th><th class="num">${escapeHtml(L.amount)}</th></tr></thead>
         <tbody>${payments
           .map(
             (p) => `<tr>
               <td>${escapeHtml(formatDateTime(p.paidAt))}</td>
               <td>${escapeHtml(p.mode)}</td>
               <td>${escapeHtml(p.reference ?? '-')}</td>
               <td class="num">${formatTND(p.amount)}</td>
             </tr>`,
           )
           .join('')}</tbody>
       </table>`
    : '';

  const body = `
    ${header(L.invoice, facture.numero)}
    <div class="meta">
      ${clientLine(facture.clientName, facture.clientCode)}
      <div><strong>${escapeHtml(L.date)} :</strong> ${formatDate(facture.invoiceDate)}${facture.dueDate ? ` &nbsp; <strong>${escapeHtml(L.dueDate)} :</strong> ${formatDate(facture.dueDate)}` : ''}</div>
      <div><strong>${escapeHtml(L.status)} :</strong> ${statusBadge(facture.statut)}</div>
    </div>
    <table>
      <thead><tr>
        <th>${escapeHtml(L.description)}</th>
        <th class="num">${escapeHtml(L.quantity)}</th>
        <th class="num">${escapeHtml(L.unitPrice)}</th>
        <th class="num">${escapeHtml(L.lineTotal)}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>${escapeHtml(L.total)}</span><span>${formatTND(facture.totalAmount)}</span></div>
      <div class="row"><span>${escapeHtml(L.paid)}</span><span>${formatTND(facture.paidAmount)}</span></div>
      <div class="row grand"><span>${escapeHtml(L.remaining)}</span><span>${formatTND(facture.remainingAmount)}</span></div>
    </div>
    ${paymentsBlock}
    ${facture.notes ? `<div class="section-title">${escapeHtml(L.notes)}</div><div class="notes">${escapeHtml(facture.notes)}</div>` : ''}
    <div class="footer">${escapeHtml(L.pressName)} — ${escapeHtml(L.invoice)} ${escapeHtml(facture.numero)}</div>`;

  return htmlDocument(`${L.invoice} ${facture.numero}`, body);
}

export function buildTicketHtml(apport: Apport): string {
  const body = `
    ${header(L.ticket, apport.numero)}
    <div class="meta">
      ${clientLine(apport.clientName, apport.clientCode)}
      <div><strong>${escapeHtml(L.ticketNo)} :</strong> ${escapeHtml(apport.ticketNumber ?? '-')}</div>
      <div><strong>${escapeHtml(L.receivedOn)} :</strong> ${formatDateTime(apport.receivedAt)}</div>
      ${apport.employeeName ? `<div><strong>${escapeHtml(L.employee)} :</strong> ${escapeHtml(apport.employeeName)}</div>` : ''}
      <div><strong>${escapeHtml(L.status)} :</strong> ${statusBadge(apport.status)}</div>
    </div>
    <div class="totals">
      <div class="row"><span>${escapeHtml(L.grossWeight)}</span><span>${formatKg(apport.grossWeightKg)}</span></div>
      <div class="row"><span>${escapeHtml(L.tare)}</span><span>${formatKg(apport.tareKg)}</span></div>
      <div class="row grand"><span>${escapeHtml(L.netWeight)}</span><span>${formatKg(apport.netWeightKg)}</span></div>
    </div>
    ${apport.observations ? `<div class="section-title">${escapeHtml(L.observations)}</div><div class="notes">${escapeHtml(apport.observations)}</div>` : ''}
    <div class="footer">${escapeHtml(L.pressName)} — ${escapeHtml(L.ticket)} ${escapeHtml(apport.numero)}</div>`;

  return htmlDocument(`${L.ticket} ${apport.numero}`, body);
}

export function buildLivraisonHtml(livraison: Livraison): string {
  const body = `
    ${header(L.delivery, livraison.numero)}
    <div class="meta">
      ${clientLine(livraison.clientName, livraison.clientCode)}
      <div><strong>${escapeHtml(L.date)} :</strong> ${formatDateTime(livraison.deliveredAt)}</div>
      ${livraison.lotNumber ? `<div><strong>${escapeHtml(L.lot)} :</strong> ${escapeHtml(livraison.lotNumber)}</div>` : ''}
      ${livraison.employeeName ? `<div><strong>${escapeHtml(L.employee)} :</strong> ${escapeHtml(livraison.employeeName)}</div>` : ''}
    </div>
    <div class="totals">
      <div class="row grand"><span>${escapeHtml(L.quantityL)}</span><span>${formatLiters(livraison.quantityL)}</span></div>
    </div>
    ${livraison.observations ? `<div class="section-title">${escapeHtml(L.observations)}</div><div class="notes">${escapeHtml(livraison.observations)}</div>` : ''}
    <div class="footer">${escapeHtml(L.pressName)} — ${escapeHtml(L.delivery)} ${escapeHtml(livraison.numero)}</div>`;

  return htmlDocument(`${L.delivery} ${livraison.numero}`, body);
}

export function buildClientHtml(
  client: Client,
  stats?: { apports?: number; netWeightKg?: number; factures?: number },
): string {
  const statsBlock = stats
    ? `<div class="totals" style="margin-top:24px">
        <div class="row"><span>Apports</span><span>${escapeHtml(formatNumber(stats.apports ?? 0, 0))}</span></div>
        <div class="row"><span>${escapeHtml(L.netWeight)}</span><span>${escapeHtml(formatKg(stats.netWeightKg ?? 0))}</span></div>
        <div class="row grand"><span>Factures</span><span>${escapeHtml(formatNumber(stats.factures ?? 0, 0))}</span></div>
      </div>`
    : '';

  const body = `
    ${header(L.clientCard, client.code ?? '')}
    <div class="meta">
      <div><strong>${escapeHtml(L.client)} :</strong> ${escapeHtml(client.fullName)}</div>
      ${client.code ? `<div><strong>${escapeHtml(L.clientCode)} :</strong> ${escapeHtml(client.code)}</div>` : ''}
      <div><strong>${escapeHtml(L.phone)} :</strong> ${escapeHtml(client.phone)}</div>
      ${client.address ? `<div><strong>${escapeHtml(L.address)} :</strong> ${escapeHtml(client.address)}</div>` : ''}
      <div><strong>${escapeHtml(L.status)} :</strong> ${client.active ? 'Actif' : 'Inactif'}</div>
    </div>
    ${statsBlock}
    <div class="footer">${escapeHtml(L.pressName)} — ${escapeHtml(L.clientCard)} ${escapeHtml(client.code ?? '')}</div>`;

  return htmlDocument(`${L.clientCard} ${client.fullName}`, body);
}

/** Ouvre le HTML dans une fenêtre d'impression (l'utilisateur choisit PDF ou papier). */
export function printHtml(html: string): void {
  const win = window.open('', '_blank', 'width=820,height=960');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}

export function printFacture(
  facture: Facture,
  payments: { amount: number; mode: string; paidAt: string; reference?: string }[] = [],
): void {
  printHtml(buildFactureHtml(facture, payments));
}

export function printTicket(apport: Apport): void {
  printHtml(buildTicketHtml(apport));
}

export function printLivraison(livraison: Livraison): void {
  printHtml(buildLivraisonHtml(livraison));
}

export function printClient(
  client: Client,
  stats?: { apports?: number; netWeightKg?: number; factures?: number },
): void {
  printHtml(buildClientHtml(client, stats));
}

const REPORT_TITLES: Record<string, string> = {
  global: 'RAPPORT GLOBAL',
  reception: 'RAPPORT RÉCEPTION',
  production: 'RAPPORT PRODUCTION',
  stock: 'RAPPORT STOCK',
  facturation: 'RAPPORT FACTURATION',
};

function reportSection(title: string, rows: { label: string; value: string }[]): string {
  if (!rows.length) return '';
  return `
    <div class="section-title">${escapeHtml(title)}</div>
    <table style="margin-top:10px">
      <tbody>
        ${rows
          .map(
            (r) =>
              `<tr><td>${escapeHtml(r.label)}</td><td class="num">${escapeHtml(r.value)}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

export function buildReportHtml(
  data: Record<string, any>,
  type: string,
  from: string,
  to: string,
): string {
  const sections: string[] = [];

  if (data.reception) {
    const r = data.reception;
    const rows: { label: string; value: string }[] = [
      { label: 'Apports', value: formatNumber(r.nombreApports) },
      { label: 'Poids net', value: formatKg(r.poidsNetTotalKg) },
    ];
    if (r.parStatut) {
      Object.entries(r.parStatut as Record<string, number>).forEach(([k, v]) =>
        rows.push({ label: k, value: formatNumber(v) }),
      );
    }
    sections.push(reportSection('Réception', rows));
  }

  if (data.production) {
    const p = data.production;
    sections.push(
      reportSection('Production', [
        { label: 'Olives traitées', value: formatKg(p.olivesTraiteesKg) },
        { label: 'Huile produite', value: formatLiters(p.huileProduiteL) },
        { label: 'Rendement moyen', value: `${formatNumber(p.rendementMoyenPourcent, 2)} %` },
      ]),
    );
  }

  if (data.stock) {
    const s = data.stock;
    sections.push(
      reportSection('Stock', [
        { label: 'Disponible', value: formatLiters(s.stockDisponibleL) },
        { label: 'Entrées', value: formatLiters(s.entreesL) },
        { label: 'Sorties', value: formatLiters(s.sortiesL) },
      ]),
    );
  }

  if (data.facturation) {
    const f = data.facturation;
    sections.push(
      reportSection('Facturation', [
        { label: 'Total facturé', value: formatTND(f.totalFacture) },
        { label: 'Encaissé', value: formatTND(f.totalEncaisse) },
        { label: 'Reste à payer', value: formatTND(f.resteAPayer) },
        { label: 'Factures impayées', value: formatNumber(f.facturesImpayees) },
      ]),
    );
  }

  const title = REPORT_TITLES[type] ?? 'RAPPORT';
  const body = `
    ${header(title, `${from} → ${to}`)}
    <div class="meta">
      <div><strong>Période :</strong> ${escapeHtml(from)} → ${escapeHtml(to)}</div>
      <div><strong>Généré le :</strong> ${escapeHtml(new Date().toLocaleString('fr-TN'))}</div>
    </div>
    ${sections.join('')}
    <div class="footer">OlivePress — ${escapeHtml(title)}</div>`;

  return htmlDocument(title, body);
}

export function printReport(
  data: Record<string, any>,
  type: string,
  from: string,
  to: string,
): void {
  printHtml(buildReportHtml(data, type, from, to));
}

/** Copie un resume texte dans le presse-papiers (equivalent du partage mobile). */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}
