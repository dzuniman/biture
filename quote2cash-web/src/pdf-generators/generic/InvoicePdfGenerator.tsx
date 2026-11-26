import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Invoice, QuoteItem } from '../../types';
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

export const generateInvoicePDF = async (invoice: Invoice, save: boolean = false, returnBlob = false) => {
  const { company, paymentDetails } = await getProjectInfo();
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const formatDate = (date?: Date) => {
    if (!date || isNaN(date.getTime()) || date.getFullYear() <= 1) return '—';
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const logoImg = new Image();
  logoImg.src = logo;
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = () => {
      console.error('PDF Generator: Could not load logo image from', logo);
      resolve(null);
    };
  });

  const itemsList = invoice.quote?.items ?? new Array<QuoteItem>();
  const allRows = itemsList
    .slice()
    .sort((a: QuoteItem, b: QuoteItem) => {
      const aNum = Number(a.itemNumber);
      const bNum = Number(b.itemNumber);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return a.itemNumber.toString().localeCompare(b.itemNumber.toString(), undefined, { numeric: true });
    })
    .map((item: QuoteItem) =>
      Array.of(
        item.itemNumber,
        item.quantity,
        item.code || '—',
        item.uom,
        item.description,
        formatAmount(item.unitPrice),
        formatAmount(item.totalPrice)
      )
    );

  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const paymentBoxHeight = 25;
  const paymentBoxY = pageHeight - paymentBoxHeight - margin;
  const footerRowTopY = paymentBoxY - 15;
  const signatureY = paymentBoxY - 3;
  const receivedByY = signatureY - 7;
  const tableStartY = 56;
  const tableMaxBottomY = footerRowTopY - 3;
  const bottomMargin = pageHeight - tableMaxBottomY;

  const colWidths = Array.of(12, 12, 18, 15, pageWidth - (margin * 2) - 107, 25, 25);
  let pageRowY = 35;

  const drawPageHeader = () => {
    const companyInfoX = margin;
    const companyInfoY = margin - 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(String(company.at(0) ?? ''), companyInfoX, companyInfoY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(company.at(1) ?? ''), companyInfoX, companyInfoY + 16);
    doc.text(String(company.at(2) ?? ''), companyInfoX, companyInfoY + 20);

    const logoHeight = 15;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      const logoWidth = logoHeight * aspectRatio;
      doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, margin - 2, logoWidth, logoHeight);
    }

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

    if (invoice.client) {
      const clientLines = Array.of(
        invoice.client.name,
        invoice.client.addressLine1,
        invoice.client.addressLine2,
        invoice.client.addressLine3,
        invoice.client.addressLine4,
        invoice.client.vatNumber ? `VAT No: ${invoice.client.vatNumber}` : null,
        invoice.client.email ? `Email: ${invoice.client.email}` : null
      ).filter(Boolean);

      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });

      if (invoice.client.representativeName || invoice.client.representativeNumber) {
        if (invoice.client.representativeName) {
          doc.text(invoice.client.representativeName, boxX + 2, custTextY);
        }
        if (invoice.client.representativeNumber) {
          doc.text(invoice.client.representativeNumber, boxX + boxWidth - 2, custTextY, { align: 'right' });
        }
      }
    }

    const invoiceDetailsBlockWidth = 70;
    const invoiceDetailsBlockX = pageWidth - margin - invoiceDetailsBlockWidth;
    const invoiceDetailsY = companyInfoY + logoHeight + 8;

    doc.setLineWidth(0.2);
    doc.rect(invoiceDetailsBlockX, invoiceDetailsY, invoiceDetailsBlockWidth, boxHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth - margin - 2, invoiceDetailsY + 4, { align: 'right' });

    doc.setFontSize(7);
    let detailY = invoiceDetailsY + 7;

    const addInvoiceDetailRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, invoiceDetailsBlockX + 2, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, invoiceDetailsBlockX + invoiceDetailsBlockWidth - 2, detailY, { align: 'right' });
      detailY += 4;
    };

    addInvoiceDetailRow('INVOICE NUMBER:', invoice.invoiceNumber);
    addInvoiceDetailRow('INVOICE DATE:', formatDate(invoice.createdAt ? new Date(invoice.createdAt) : undefined));
    addInvoiceDetailRow('DUE DATE:', formatDate(invoice.dueDate ? new Date(invoice.dueDate) : undefined));
    addInvoiceDetailRow('VENDOR NUMBER:', invoice.client?.vendorNumber || '—');
    if (invoice.quote?.poNumber) {
      addInvoiceDetailRow('PO NUMBER:', invoice.quote.poNumber);
    }

    pageRowY = detailY;
    doc.setFont('helvetica', 'bold');
    doc.text('PAGE:', invoiceDetailsBlockX + 2, detailY);
  };

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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Received and Approved by: _______________________________________________', margin, receivedByY);
    doc.text('Signature: _____________________________________________________________', margin, signatureY);

    const summaryX = pageWidth - margin;
    let sumY = footerRowTopY + 1;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sub Total', summaryX - 45, sumY);
    doc.text(formatAmount(invoice.quote?.subTotal), summaryX, sumY, { align: 'right' });
    sumY += 4;
    doc.text('VAT (15%)', summaryX - 45, sumY);
    doc.text(formatAmount(invoice.quote?.vat), summaryX, sumY, { align: 'right' });
    sumY += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(51, 51, 51);
    doc.line(summaryX - 45, sumY, summaryX, sumY);
    sumY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', summaryX - 45, sumY);
    doc.text(formatAmount(invoice.quote?.total), summaryX, sumY, { align: 'right' });

    const paymentBoxX = margin;
    const paymentBoxWidth = pageWidth - (margin * 2);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(paymentBoxX, paymentBoxY, paymentBoxWidth, paymentBoxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 0, 0);
    doc.text('OUR BANKING DETAILS ARE AS FOLLOWS:', paymentBoxX + 4, paymentBoxY + 5);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    let paymentTextY = paymentBoxY + 8;
    paymentDetails.forEach((line: string) => {
      doc.text(line, paymentBoxX + 4, paymentTextY);
      paymentTextY += 3;
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
    head: Array.of(Array.of('ITEM', 'QTY', 'CODE', 'UOM', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL')),
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
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
    },
    didDrawPage: () => {
      drawFullHeightTableBorders();
      drawPageHeader();
      drawFixedFooter();
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`${i} of ${totalPages}`, pageWidth - margin - 2, pageRowY, { align: 'right' });
  }

  if (save) {
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    return '';
  }

  if (returnBlob) {
    return doc.output('blob');
  } else {
    return doc.output('arraybuffer');
  }
};
