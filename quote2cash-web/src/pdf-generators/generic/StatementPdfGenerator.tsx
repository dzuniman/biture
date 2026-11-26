import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Statement, Invoice, Client, CreditNote } from '../../types';
import { formatAmount } from '../../../formatters';

const project = import.meta.env.VITE_PROJECT;
const logo = new URL(`../../assets/logo-${project}.png`, import.meta.url).href;

async function getProjectInfo() {
  const module = await import(`../../project-info/${project}.ts`);
  return {
    paymentDetails: module.bankingDetails,
    company: module.company,
  };
}

export const generateStatementPDF = async (
  statement: Statement,
  invoices: Array<Invoice>,
  creditNotes: Array<CreditNote> = new Array<CreditNote>(),
  save: boolean = false,
  returnBlob = false
) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });
  const { company, paymentDetails } = await getProjectInfo();

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return '—';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Pre-load logo image
  const logoImg = new Image();
  logoImg.src = logo;
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = () => {
      console.error('PDF Generator: Could not load logo image from', logo);
      resolve(null);
    };
  });

  const items = statement.items || (statement as any).Items || new Array<any>();

  const invoiceMap: Record<string, Invoice> = {};
  invoices.forEach(inv => { invoiceMap[inv.id] = inv; });

  const creditNoteMap: Record<string, CreditNote> = {};
  creditNotes.forEach(cn => { creditNoteMap[cn.id] = cn; });

  const paymentsByInvoice: Record<string, number> = {};
  items.forEach((item: any) => {
    const id = item.invoiceId || item.InvoiceId;
    if (id) paymentsByInvoice[id] = (paymentsByInvoice[id] || 0) + (item.paymentAmount || item.PaymentAmount || 0);
  });

  const uniqueInvoiceIds = Array.from(
    new Set(
      items.filter((i: any) => !!(i.invoiceId || i.InvoiceId)).map((i: any) => i.invoiceId || i.InvoiceId)
    )
  ) as Array<string>;

  const uniqueCreditNoteIds = Array.from(
    new Set(
      items.filter((i: any) => !!(i.creditNoteId || i.CreditNoteId)).map((i: any) => i.creditNoteId || i.CreditNoteId)
    )
  ) as Array<string>;

  // Invoice rows
  const invoiceRows = uniqueInvoiceIds.map(id => {
    const inv = invoiceMap[id];
    const paid = paymentsByInvoice[id] || 0;
    const outstanding = (inv?.amount ?? 0) - paid;
    const poNumber = (inv as any)?.quote?.poNumber || (inv as any)?.Quote?.PoNumber || '—';
    return Array.of(
      inv?.invoiceNumber || '—',
      formatDate(inv?.dueDate),
      'INVOICE',
      poNumber,
      formatAmount(inv?.amount ?? 0),
      formatAmount(outstanding)
    );
  });

  // Credit Note rows
  const creditNoteRows = uniqueCreditNoteIds.map(id => {
    const cn = creditNoteMap[id];
    const cnAmount = cn?.amount ?? 0;
    return Array.of(
      cn?.creditNoteNumber || '—',
      '',
      'CREDIT NOTE',
      '',
      formatAmount(cnAmount),
      `(${formatAmount(cnAmount)})`
    );
  });

  const allRows = invoiceRows.concat(creditNoteRows);

  // Totals & Aging calculations
  let totalOutstanding = uniqueInvoiceIds.reduce((sum, id) => {
    const invAmount = invoiceMap[id]?.amount ?? 0;
    return sum + (invAmount - (paymentsByInvoice[id] || 0));
  }, 0);
  uniqueCreditNoteIds.forEach(id => { totalOutstanding -= creditNoteMap[id]?.amount ?? 0; });

  let overdue30 = 0;
  let overdue60 = 0;
  let overdue90 = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  uniqueInvoiceIds.forEach(id => {
    const inv = invoiceMap[id];
    if (!inv) return;

    const outstanding = inv?.amount ?? 0;
    if (outstanding <= 0) return;

    const dueDate = new Date(inv.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 30 && diffDays < 60) {
      overdue30 += outstanding;
    } else if (diffDays >= 60 && diffDays < 90) {
      overdue60 += outstanding;
    } else if (diffDays >= 90) {
      overdue90 += outstanding;
    }
  });

  const margin = 5;
  const bottomEdgeMargin = 5; // Restored 5mm margin from bottom edge of A4 (297mm)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // Raised slightly up (~6mm higher than before)
  const paymentBoxHeight = 22;
  const paymentBoxY = pageHeight - paymentBoxHeight - bottomEdgeMargin; // 270mm (Banking Details box)
  const signatureY = paymentBoxY - 2.5;                                 // 267.5mm (Signature)
  const receivedByY = signatureY - 5.5;                                 // 262mm (Received and Approved by)
  const agingTableHeight = 11;
  const agingTableY = receivedByY - 3 - agingTableHeight;                 // 248mm (Payment Analysis table)
  const agingTitleY = agingTableY - 1.5;                                  // 246.5mm ('PAYMENT ANALYSIS' & 'Total Outstanding:')
  const tableStartY = 56;                                                 // Top of main table
  const tableMaxBottomY = agingTitleY - 6;                              // 243mm (Bottom edge of main table)
  const bottomMargin = pageHeight - tableMaxBottomY;

  const colWidths = Array.of(28, 30, 28, pageWidth - (margin * 2) - 142, 28, 28);
  let pageRowY = 35;

  const drawPageHeader = () => {
    const companyInfoX = margin;
    const companyInfoY = margin - 10;

    // --- Company Info (Top Left) ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(String(company.at(0) ?? ''), companyInfoX, companyInfoY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(company.at(1) ?? ''), companyInfoX, companyInfoY + 16);
    doc.text(String(company.at(2) ?? ''), companyInfoX, companyInfoY + 20);

    // --- Logo (Top Right) ---
    const logoHeight = 15;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      const logoWidth = logoHeight * aspectRatio;
      doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, margin - 2, logoWidth, logoHeight);
    }

    // --- Bill To Box (Left) ---
    const customerBoxY = companyInfoY + 23;
    const boxWidth = 70;
    const boxHeight = 33;
    const boxX = companyInfoX;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(boxX, customerBoxY, boxWidth, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('BILL TO:', boxX + 2, customerBoxY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let custTextY = customerBoxY + 7;

    if (statement.client) {
      const clientLines = Array.of(
        statement.client.name,
        statement.client.addressLine1,
        statement.client.addressLine2,
        statement.client.addressLine3,
        statement.client.addressLine4,
        statement.client.vatNumber ? `VAT No: ${statement.client.vatNumber}` : null,
        statement.client.email ? `Email: ${statement.client.email}` : null
      ).filter(Boolean);

      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });

      if (statement.client.representativeName || statement.client.representativeNumber) {
        if (statement.client.representativeName) {
          doc.text(statement.client.representativeName, boxX + 2, custTextY);
        }
        if (statement.client.representativeNumber) {
          doc.text(statement.client.representativeNumber, boxX + boxWidth - 2, custTextY, { align: 'right' });
        }
      }
    }

    // --- Statement Details Block (Right) ---
    const statementDetailsBlockWidth = 70;
    const statementDetailsBlockX = pageWidth - margin - statementDetailsBlockWidth;
    const statementDetailsY = companyInfoY + logoHeight + 8;

    doc.setLineWidth(0.2);
    doc.rect(statementDetailsBlockX, statementDetailsY, statementDetailsBlockWidth, boxHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('STATEMENT OF ACCOUNT', pageWidth - margin - 2, statementDetailsY + 4, { align: 'right' });

    doc.setFontSize(7);
    let detailY = statementDetailsY + 7;

    const addStatementDetailRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, statementDetailsBlockX + 2, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, statementDetailsBlockX + statementDetailsBlockWidth - 2, detailY, { align: 'right' });
      detailY += 4;
    };

    const client: Client | null = statement.client || (statement as any).Client;

    addStatementDetailRow('STATEMENT NO:', statement.statementNumber || (statement as any).StatementNumber || '—');
    addStatementDetailRow('STATEMENT DATE:', formatDate(statement.createdAt || (statement as any).CreatedAt));
    addStatementDetailRow('ACCOUNT TYPE:', `${statement.dueDays || (statement as any).dueDays} DAYS`);
    addStatementDetailRow('VENDOR NUMBER:', client?.vendorNumber || '-');

    pageRowY = detailY;
    doc.setFont('helvetica', 'bold');
    doc.text('PAGE:', statementDetailsBlockX + 2, detailY);
  };

  // Draws full-height vertical column borders and bottom border down to tableMaxBottomY on every page
  const drawFullHeightTableBorders = () => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);

    let currentX = margin;
    doc.line(currentX, tableStartY, currentX, tableMaxBottomY);
    colWidths.forEach((w) => {
      currentX += w;
      doc.line(currentX, tableStartY, currentX, tableMaxBottomY);
    });

    doc.setLineWidth(0.2);
    doc.line(margin, tableMaxBottomY, pageWidth - margin, tableMaxBottomY);
  };

  const drawFixedFooter = () => {
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);

    // 1. Payment Analysis Header (Left) & Total Outstanding (Right) right below main table
    const summaryX = pageWidth - margin;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT ANALYSIS', margin, agingTitleY);
    doc.text('Total Outstanding:', summaryX - 55, agingTitleY);
    doc.text(formatAmount(totalOutstanding), summaryX, agingTitleY, { align: 'right' });

    // 2. Payment Analysis Table
    const agingColWidth = (pageWidth - (margin * 2)) / 4;
    const agingHeaders = Array.of('Current', '30 Days Overdue', '60 Days Overdue', '90+ Days Overdue');
    const agingValues = Array.of(
      formatAmount(totalOutstanding),
      formatAmount(overdue30),
      formatAmount(overdue60),
      formatAmount(overdue90)
    );

    const headerRowHeight = 4.5;
    const bodyRowHeight = 5.5;

    doc.setFillColor(243, 244, 246);
    doc.setLineWidth(0.1);
    doc.rect(margin, agingTableY, pageWidth - (margin * 2), headerRowHeight, 'FD');
    doc.rect(margin, agingTableY + headerRowHeight, pageWidth - (margin * 2), bodyRowHeight, 'S');

    for (let c = 0; c < 4; c++) {
      const colLeftX = margin + (c * agingColWidth);
      const colRightX = colLeftX + agingColWidth - 2;
      if (c > 0) {
        doc.line(colLeftX, agingTableY, colLeftX, agingTableY + headerRowHeight + bodyRowHeight);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(String(agingHeaders.at(c) ?? ''), colRightX, agingTableY + 3.3, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.text(String(agingValues.at(c) ?? ''), colRightX, agingTableY + headerRowHeight + 3.8, { align: 'right' });
    }

    // 3. Received and Approved by + Signature (just above Banking Details)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Received and Approved by: __________________________________________________________', margin, receivedByY);
    doc.text('Signature: ________________________________________________________________________', margin, signatureY);

    // 4. Banking Details Box pinned at bottom of page
    const paymentBoxX = margin;
    const paymentBoxWidth = pageWidth - (margin * 2);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(paymentBoxX, paymentBoxY, paymentBoxWidth, paymentBoxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 0, 0);
    doc.text('OUR BANKING DETAILS ARE AS FOLLOWS:', paymentBoxX + 4, paymentBoxY + 4);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);

    let paymentTextY = paymentBoxY + 7;
    paymentDetails.forEach((line: string) => {
      doc.text(line, paymentBoxX + 4, paymentTextY);
      paymentTextY += 2.4;
    });
  };

  autoTable(doc, {
    startY: tableStartY,
    margin: {
      top: tableStartY,
      bottom: bottomMargin,
      left: margin,
      right: margin,
    },
    head: Array.of(Array.of('Document No', 'Due Date', 'Document Type', 'PO Number', 'Amount', 'Outstanding')),
    body: allRows,
    rowPageBreak: 'avoid',
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: '#000000',
      lineColor: '#000000',
      lineWidth: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    headStyles: {
      fillColor: '#F3F4F6',
      textColor: '#000000',
      fontStyle: 'bold',
      lineWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 30 },
      2: { cellWidth: 28 },
      3: { cellWidth: 'auto', halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    didDrawPage: () => {
      drawFullHeightTableBorders();
      drawPageHeader();
      drawFixedFooter();
    },
  });

  // Draw right-aligned 'x of y' on every page after total page count is known
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`${i} of ${totalPages}`, pageWidth - margin - 2, pageRowY, { align: 'right' });
  }

  if (save) {
    doc.save(`Statement_${statement.statementNumber}.pdf`);
    return '';
  }

  if (returnBlob) {
    return doc.output('blob');
  } else {
    return doc.output('arraybuffer');
  }
};
