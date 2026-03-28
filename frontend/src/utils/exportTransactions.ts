import type { TxRow } from '@/hooks/useTransactionHistory';

function formatDate(raw: string | undefined): string {
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleString();
  } catch {
    return raw;
  }
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

/**
 * Export a list of transaction rows to a CSV file.
 * Automatically handles escaping special characters.
 * 
 * @param rows - Array of transaction data
 * @param filename - Optional custom filename
 */
export function exportToCSV(rows: TxRow[], filename = 'transactions.csv'): void {
  const headers = ['ID', 'Date', 'Type', 'Amount (XLM)', 'Member', 'Group', 'Status', 'Hash'];
  const escape = (v: string | number | undefined) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines = [
    headers.join(','),
    ...rows.map((tx) =>
      [
        tx.id,
        formatDate(tx.timestamp || tx.date),
        tx.type,
        tx.amount,
        tx.member,
        tx.groupName ?? tx.groupId,
        tx.status,
        tx.hash ?? '',
      ]
        .map(escape)
        .join(',')
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

/**
 * Export a list of transaction rows to a PDF file.
 * Uses dynamic imports for jsPDF to reduce initial bundle size.
 * 
 * @param rows - Array of transaction data
 * @param filename - Optional custom filename
 */
export async function exportToPDF(rows: TxRow[], filename = 'transactions.pdf'): Promise<void> {
  // Dynamic import keeps jspdf out of the initial bundle
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(14);
  doc.text('Transaction History', 14, 16);
  doc.setFontSize(9);
  doc.text(`Exported ${new Date().toLocaleString()} · ${rows.length} records`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [['Date', 'Type', 'Amount', 'Member', 'Group', 'Status']],
    body: rows.map((tx) => [
      formatDate(tx.timestamp || tx.date),
      tx.type,
      `${tx.amount} XLM`,
      tx.member,
      tx.groupName ?? tx.groupId,
      tx.status,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(filename);
}
