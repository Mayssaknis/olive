import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Apport, Client, Facture, Livraison } from '../types';
import { formatDate, formatDateTime, formatKg, formatLiters, formatNumber, formatTND } from './format';
import { statusColors } from '../theme';

export type PdfLocale = 'fr' | 'ar';

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
  issuedOn: string;
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

const LABELS: Record<PdfLocale, Labels> = {
  fr: {
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
    issuedOn: 'Émise le',
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
  },
  ar: {
    pressName: 'زيتون بريس',
    invoice: 'فاتورة',
    ticket: 'وصل استلام',
    delivery: 'وصل تسليم',
    client: 'الحريف',
    clientCode: 'رقم الحريف',
    clientCard: 'بطاقة الحريف',
    phone: 'الهاتف',
    address: 'العنوان',
    status: 'الحالة',
    date: 'التاريخ',
    dueDate: 'تاريخ الاستحقاق',
    issuedOn: 'صدرت في',
    ticketNo: 'رقم الوصل',
    receivedOn: 'الاستلام',
    employee: 'الموظف',
    grossWeight: 'الوزن الإجمالي',
    tare: 'الفارغ',
    netWeight: 'الوزن الصافي',
    description: 'الوصف',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    lineTotal: 'المجموع',
    total: 'المجموع',
    paid: 'المدفوع',
    remaining: 'الباقي',
    observations: 'ملاحظات',
    lot: 'الدفعة',
    quantityL: 'الكمية',
    notes: 'ملاحظات',
    payments: 'المدفوعات',
    amount: 'المبلغ',
    mode: 'طريقة الدفع',
    ref: 'المرجع',
  },
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function baseStyles(dir: 'rtl' | 'ltr'): string {
  return `
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #283D2B; margin: 0; padding: 32px 36px;
      direction: ${dir}; text-align: ${dir === 'rtl' ? 'right' : 'left'};
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #556B2F; padding-bottom: 16px; }
    .brand { font-size: 26px; font-weight: 800; color: #556B2F; }
    .doc-title { font-size: 18px; font-weight: 700; color: #283D2B; text-align: ${dir === 'rtl' ? 'left' : 'right'}; }
    .doc-num { background: #556B2F; color: #fff; border-radius: 8px; padding: 4px 12px; font-weight: 700; display: inline-block; margin-top: 6px; }
    .meta { margin-top: 20px; font-size: 13px; color: #6B6B63; }
    .meta div { padding: 3px 0; }
    .meta strong { color: #283D2B; }
    table { width: 100%; border-collapse: collapse; margin-top: 22px; font-size: 13px; }
    th { background: #F7F4EC; color: #283D2B; text-align: ${dir === 'rtl' ? 'right' : 'left'}; padding: 10px; border-bottom: 1px solid #E8E8E2; }
    td { padding: 10px; border-bottom: 1px solid #E8E8E2; }
    td.num, th.num { text-align: ${dir === 'rtl' ? 'left' : 'right'}; }
    .totals { margin-top: 20px; width: 100%; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .row.grand { border-top: 2px solid #283D2B; margin-top: 6px; padding-top: 10px; font-size: 17px; font-weight: 800; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .section-title { margin-top: 26px; font-size: 15px; font-weight: 800; color: #556B2F; }
    .notes { margin-top: 10px; font-size: 13px; color: #6B6B63; white-space: pre-wrap; }
    .footer { margin-top: 40px; font-size: 11px; color: #9A9A90; text-align: center; border-top: 1px solid #E8E8E2; padding-top: 12px; }
  `;
}

function htmlDocument(title: string, body: string, locale: PdfLocale): string {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return `<!DOCTYPE html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${baseStyles(dir)}</style></head><body>${body}</body></html>`;
}

function clientLine(name: string | undefined, code: string | undefined, L: Labels): string {
  return `<div><strong>${escapeHtml(L.client)} :</strong> ${escapeHtml(name ?? '-')}${code ? ` &nbsp; <strong>${escapeHtml(L.clientCode)} :</strong> ${escapeHtml(code)}` : ''}</div>`;
}

function header(title: string, numero: string, L: Labels): string {
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

export function buildFactureHtml(facture: Facture, payments: { amount: number; mode: string; paidAt: string; reference?: string }[] = [], locale: PdfLocale = 'fr'): string {
  const L = LABELS[locale];
  const rows = facture.lines
    .map(
      (l) => `<tr>
        <td>${escapeHtml(l.description)}</td>
        <td class="num">${formatNumber(l.quantity, 2)}</td>
        <td class="num">${formatTND(l.unitPrice)}</td>
        <td class="num">${formatTND(l.total)}</td>
      </tr>`
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
             </tr>`
           )
           .join('')}</tbody>
       </table>`
    : '';

  const body = `
    ${header(L.invoice, facture.numero, L)}
    <div class="meta">
      ${clientLine(facture.clientName, facture.clientCode, L)}
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

  return htmlDocument(`${L.invoice} ${facture.numero}`, body, locale);
}

export function buildTicketHtml(apport: Apport, locale: PdfLocale = 'fr'): string {
  const L = LABELS[locale];
  const body = `
    ${header(L.ticket, apport.numero, L)}
    <div class="meta">
      ${clientLine(apport.clientName, apport.clientCode, L)}
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

  return htmlDocument(`${L.ticket} ${apport.numero}`, body, locale);
}

export function buildLivraisonHtml(livraison: Livraison, locale: PdfLocale = 'fr'): string {
  const L = LABELS[locale];
  const body = `
    ${header(L.delivery, livraison.numero, L)}
    <div class="meta">
      ${clientLine(livraison.clientName, livraison.clientCode, L)}
      <div><strong>${escapeHtml(L.date)} :</strong> ${formatDateTime(livraison.deliveredAt)}</div>
      ${livraison.lotNumber ? `<div><strong>${escapeHtml(L.lot)} :</strong> ${escapeHtml(livraison.lotNumber)}</div>` : ''}
      ${livraison.employeeName ? `<div><strong>${escapeHtml(L.employee)} :</strong> ${escapeHtml(livraison.employeeName)}</div>` : ''}
    </div>
    <div class="totals">
      <div class="row grand"><span>${escapeHtml(L.quantityL)}</span><span>${formatLiters(livraison.quantityL)}</span></div>
    </div>
    ${livraison.observations ? `<div class="section-title">${escapeHtml(L.observations)}</div><div class="notes">${escapeHtml(livraison.observations)}</div>` : ''}
    <div class="footer">${escapeHtml(L.pressName)} — ${escapeHtml(L.delivery)} ${escapeHtml(livraison.numero)}</div>`;

  return htmlDocument(`${L.delivery} ${livraison.numero}`, body, locale);
}

export function buildClientHtml(
  client: Client,
  stats?: { apports?: number; netWeightKg?: number; factures?: number },
  locale: PdfLocale = 'fr'
): string {
  const L = LABELS[locale];
  const statsBlock = stats
    ? `<div class="totals" style="margin-top:24px">
        <div class="row"><span>Apports</span><span>${escapeHtml(formatNumber(stats.apports ?? 0, 0))}</span></div>
        <div class="row"><span>${escapeHtml(L.netWeight)}</span><span>${escapeHtml(formatKg(stats.netWeightKg ?? 0))}</span></div>
        <div class="row grand"><span>Factures</span><span>${escapeHtml(formatNumber(stats.factures ?? 0, 0))}</span></div>
      </div>`
    : '';

  const body = `
    ${header(L.clientCard, client.code ?? '', L)}
    <div class="meta">
      <div><strong>${escapeHtml(L.client)} :</strong> ${escapeHtml(client.fullName)}</div>
      ${client.code ? `<div><strong>${escapeHtml(L.clientCode)} :</strong> ${escapeHtml(client.code)}</div>` : ''}
      <div><strong>${escapeHtml(L.phone)} :</strong> ${escapeHtml(client.phone)}</div>
      ${client.address ? `<div><strong>${escapeHtml(L.address)} :</strong> ${escapeHtml(client.address)}</div>` : ''}
      <div><strong>${escapeHtml(L.status)} :</strong> ${client.active ? 'Actif' : 'Inactif'}</div>
    </div>
    ${statsBlock}
    <div class="footer">${escapeHtml(L.pressName)} — ${escapeHtml(L.clientCard)} ${escapeHtml(client.code ?? '')}</div>`;

  return htmlDocument(`${L.clientCard} ${client.fullName}`, body, locale);
}

async function shareHtmlAsPdf(html: string, dialogTitle: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function shareFacturePdf(
  facture: Facture,
  payments: { amount: number; mode: string; paidAt: string; reference?: string }[] = [],
  locale: PdfLocale = 'fr'
): Promise<void> {
  await shareHtmlAsPdf(buildFactureHtml(facture, payments, locale), `Facture ${facture.numero}`);
}

export async function shareTicketPdf(apport: Apport, locale: PdfLocale = 'fr'): Promise<void> {
  await shareHtmlAsPdf(buildTicketHtml(apport, locale), `Ticket ${apport.numero}`);
}

export async function shareLivraisonPdf(livraison: Livraison, locale: PdfLocale = 'fr'): Promise<void> {
  await shareHtmlAsPdf(buildLivraisonHtml(livraison, locale), `Livraison ${livraison.numero}`);
}

export async function shareClientPdf(
  client: Client,
  stats?: { apports?: number; netWeightKg?: number; factures?: number },
  locale: PdfLocale = 'fr'
): Promise<void> {
  await shareHtmlAsPdf(buildClientHtml(client, stats, locale), `Fiche client ${client.fullName}`);
}

interface ReportLabels {
  period: string;
  generatedOn: string;
  reception: string;
  apports: string;
  netWeight: string;
  production: string;
  processedOlives: string;
  oilProduced: string;
  avgYield: string;
  stock: string;
  available: string;
  entries: string;
  exits: string;
  billing: string;
  totalBilled: string;
  collected: string;
  remaining: string;
  unpaid: string;
  reportGlobal: string;
  reportReception: string;
  reportProduction: string;
  reportStock: string;
  reportBilling: string;
}

const REPORT_LABELS: Record<PdfLocale, ReportLabels> = {
  fr: {
    period: 'Période',
    generatedOn: 'Généré le',
    reception: 'Réception',
    apports: 'Apports',
    netWeight: 'Poids net',
    production: 'Production',
    processedOlives: 'Olives traitées',
    oilProduced: 'Huile produite',
    avgYield: 'Rendement moyen',
    stock: 'Stock',
    available: 'Disponible',
    entries: 'Entrées',
    exits: 'Sorties',
    billing: 'Facturation',
    totalBilled: 'Total facturé',
    collected: 'Encaissé',
    remaining: 'Reste à payer',
    unpaid: 'Factures impayées',
    reportGlobal: 'RAPPORT GLOBAL',
    reportReception: 'RAPPORT RÉCEPTION',
    reportProduction: 'RAPPORT PRODUCTION',
    reportStock: 'RAPPORT STOCK',
    reportBilling: 'RAPPORT FACTURATION',
  },
  ar: {
    period: 'الفترة',
    generatedOn: 'تاريخ الإصدار',
    reception: 'الاستقبال',
    apports: 'الإيداعات',
    netWeight: 'الوزن الصافي',
    production: 'الإنتاج',
    processedOlives: 'الزيتون المعالج',
    oilProduced: 'الزيت المنتج',
    avgYield: 'متوسط المردود',
    stock: 'المخزون',
    available: 'المتاح',
    entries: 'الإدخال',
    exits: 'الإخراج',
    billing: 'الفوترة',
    totalBilled: 'إجمالي الفوترة',
    collected: 'المحصّل',
    remaining: 'المتبقي',
    unpaid: 'فواتير غير مدفوعة',
    reportGlobal: 'تقرير عام',
    reportReception: 'تقرير الاستقبال',
    reportProduction: 'تقرير الإنتاج',
    reportStock: 'تقرير المخزون',
    reportBilling: 'تقرير الفوترة',
  },
};

function reportTitle(type: string, L: ReportLabels): string {
  switch (type) {
    case 'reception':
      return L.reportReception;
    case 'production':
      return L.reportProduction;
    case 'stock':
      return L.reportStock;
    case 'facturation':
      return L.reportBilling;
    default:
      return L.reportGlobal;
  }
}

function reportSection(title: string, rows: { label: string; value: string }[]): string {
  if (!rows.length) return '';
  return `
    <div class="section-title">${escapeHtml(title)}</div>
    <table style="margin-top:10px">
      <tbody>
        ${rows
          .map((r) => `<tr><td>${escapeHtml(r.label)}</td><td class="num">${escapeHtml(r.value)}</td></tr>`)
          .join('')}
      </tbody>
    </table>`;
}

export function buildReportHtml(
  data: Record<string, any>,
  type: string,
  from: string,
  to: string,
  locale: PdfLocale = 'fr'
): string {
  const L = REPORT_LABELS[locale];
  const sections: string[] = [];

  if (data.reception) {
    const r = data.reception;
    const rows: { label: string; value: string }[] = [
      { label: L.apports, value: formatNumber(r.nombreApports) },
      { label: L.netWeight, value: formatKg(r.poidsNetTotalKg) },
    ];
    if (r.parStatut) {
      Object.entries(r.parStatut as Record<string, number>).forEach(([k, v]) =>
        rows.push({ label: k, value: formatNumber(v) })
      );
    }
    sections.push(reportSection(L.reception, rows));
  }

  if (data.production) {
    const p = data.production;
    sections.push(
      reportSection(L.production, [
        { label: L.processedOlives, value: formatKg(p.olivesTraiteesKg) },
        { label: L.oilProduced, value: formatLiters(p.huileProduiteL) },
        { label: L.avgYield, value: `${formatNumber(p.rendementMoyenPourcent, 2)} %` },
      ])
    );
  }

  if (data.stock) {
    const s = data.stock;
    sections.push(
      reportSection(L.stock, [
        { label: L.available, value: formatLiters(s.stockDisponibleL) },
        { label: L.entries, value: formatLiters(s.entreesL) },
        { label: L.exits, value: formatLiters(s.sortiesL) },
      ])
    );
  }

  if (data.facturation) {
    const f = data.facturation;
    sections.push(
      reportSection(L.billing, [
        { label: L.totalBilled, value: formatTND(f.totalFacture) },
        { label: L.collected, value: formatTND(f.totalEncaisse) },
        { label: L.remaining, value: formatTND(f.resteAPayer) },
        { label: L.unpaid, value: formatNumber(f.facturesImpayees) },
      ])
    );
  }

  const title = reportTitle(type, L);
  const body = `
    ${header(title, `${from} → ${to}`, LABELS[locale])}
    <div class="meta">
      <div><strong>${escapeHtml(L.period)} :</strong> ${escapeHtml(from)} → ${escapeHtml(to)}</div>
      <div><strong>${escapeHtml(L.generatedOn)} :</strong> ${escapeHtml(new Date().toLocaleString('fr-TN'))}</div>
    </div>
    ${sections.join('')}
    <div class="footer">${escapeHtml(LABELS[locale].pressName)} — ${escapeHtml(title)}</div>`;

  return htmlDocument(title, body, locale);
}

export async function shareReportPdf(
  data: Record<string, any>,
  type: string,
  from: string,
  to: string,
  locale: PdfLocale = 'fr'
): Promise<void> {
  await shareHtmlAsPdf(buildReportHtml(data, type, from, to, locale), 'Rapport');
}
