import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Quote } from '../../types';
import { formatAmount } from '../../../formatters';
import { getQuoteItemImageUrl } from '../../api';

const project = import.meta.env.VITE_PROJECT;
const logo = new URL(`../../assets/logo-${project}.png`, import.meta.url).href;

async function getProjectInfo() {
  const module = await import(`../../project-info/${project}.ts`);
  return {
    paymentDetails: module.bankingDetails,
    company: module.company,
  };
}

export const generateQuotePDF = async (quote: Quote, save: boolean = false, returnBlob = false) => {
  const { company, paymentDetails } = await getProjectInfo();
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

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

  // Sort items so rowImages index matches allRows index
  const sortedItems = quote.items.slice().sort((a, b) => {
    const aNum = Number(a.itemNumber);
    const bNum = Number(b.itemNumber);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return a.itemNumber.toString().localeCompare(b.itemNumber.toString(), undefined, { numeric: true });
  });

  // Fetch item images as base64
  const rowImages = new Array<string | null>();
  for (const item of sortedItems) {
    if (item.imagePath) {
      try {
        const url = getQuoteItemImageUrl(item.imagePath);
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
          rowImages.push(base64);
        } else {
          rowImages.push(null);
        }
      } catch {
        rowImages.push(null);
      }
    } else {
      rowImages.push(null);
    }
  }

  const hasAnyImage = rowImages.some(img => img !== null);

  // Build rows without manual chunking
  const allRows = sortedItems.map(item => {
    const row = new Array<any>();
    row.push(item.itemNumber);
    if (hasAnyImage) row.push('');
    row.push(
      item.quantity,
      item.code || '\u2014',
      item.uom,
      item.description,
      formatAmount(item.unitPrice),
      formatAmount(item.totalPrice)
    );
    return row;
  });

  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm on A4

  // Fixed Y-coordinates locked at the bottom of every page
  const paymentBoxHeight = 25;
  const paymentBoxY = pageHeight - paymentBoxHeight - margin; // 267mm (Banking Details box at bottom)
  const footerRowTopY = paymentBoxY - 15;                     // 252mm (Top of Totals & Received By row)
  const signatureY = paymentBoxY - 3;                         // 264mm (Signature just above Banking box)
  const receivedByY = signatureY - 7;                         // 257mm (Received by just above Signature)
  const tableStartY = 56;                                     // Top of table below BILL TO / QUOTATION boxes
  const tableMaxBottomY = footerRowTopY - 3;                  // 249mm (Table spans down to just above Totals & Received By)
  const bottomMargin = pageHeight - tableMaxBottomY;

  // Column widths matching tableColumnStyles so vertical grid lines align down to tableMaxBottomY
  const colWidths = hasAnyImage
    ? Array.of(12, 15, 10, 16, 12, pageWidth - (margin * 2) - 109, 22, 22)
    : Array.of(12, 12, 18, 15, pageWidth - (margin * 2) - 107, 25, 25);

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

    if (quote.client) {
      const clientLines = Array.of(
        quote.client.name,
        quote.client.addressLine1,
        quote.client.addressLine2,
        quote.client.addressLine3,
        quote.client.addressLine4,
        quote.client.vatNumber ? `VAT No: ${quote.client.vatNumber}` : null,
        quote.client.email ? `Email: ${quote.client.email}` : null
      ).filter(Boolean);

      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });

      if (quote.client.representativeName || quote.client.representativeNumber) {
        if (quote.client.representativeName) {
          doc.text(quote.client.representativeName, boxX + 2, custTextY);
        }
        if (quote.client.representativeNumber) {
          doc.text(quote.client.representativeNumber, boxX + boxWidth - 2, custTextY, { align: 'right' });
        }
      }
    }

    // --- Quote Details Block (Right) ---
    const quoteDetailsBlockWidth = 70;
    const quoteDetailsBlockX = pageWidth - margin - quoteDetailsBlockWidth;
    const quoteDetailsY = companyInfoY + logoHeight + 8;

    doc.setLineWidth(0.2);
    doc.rect(quoteDetailsBlockX, quoteDetailsY, quoteDetailsBlockWidth, boxHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', pageWidth - margin - 2, quoteDetailsY + 4, { align: 'right' });

    doc.setFontSize(7);
    let detailY = quoteDetailsY + 7;

    const addQuoteDetailRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, quoteDetailsBlockX + 2, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, quoteDetailsBlockX + quoteDetailsBlockWidth - 2, detailY, { align: 'right' });
      detailY += 4;
    };

    addQuoteDetailRow('QUOTE NUMBER:', `${quote.quoteNumber}`);
    addQuoteDetailRow('REFERENCE:', quote.reference);
    addQuoteDetailRow('DATE:', new Date(quote.date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }));
    addQuoteDetailRow('VALIDITY:', `${quote.validityDays} Days`);
    addQuoteDetailRow('VENDOR NUMBER:', quote.client?.vendorNumber || '—');

    // Label drawn here; right-aligned 'x of y' value drawn after autoTable completes
    doc.setFont('helvetica', 'bold');
    doc.text('PAGE:', quoteDetailsBlockX + 2, detailY);
  };

  // Draws full-height vertical column borders and bottom border down to tableMaxBottomY on every page
  const drawFullHeightTableBorders = () => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);

    let currentX = margin;
    doc.line(currentX, tableStartY, currentX, tableMaxBottomY); // Left outer border
    colWidths.forEach((w) => {
      currentX += w;
      doc.line(currentX, tableStartY, currentX, tableMaxBottomY);
    });

    // Bottom horizontal border right above Totals & Received By
    doc.setLineWidth(0.2);
    doc.line(margin, tableMaxBottomY, pageWidth - margin, tableMaxBottomY);
  };

  const drawFixedFooter = () => {
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);

    // 1. Left Side: Received and Approved by + Signature (just above Banking Details)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Received and Approved by: _______________________________________________', margin, receivedByY);
    doc.text('Signature: _____________________________________________________________', margin, signatureY);

    // 2. Right Side: Summary (Sub Total, VAT, Total) just above Banking Details
    const summaryX = pageWidth - margin;
    let sumY = footerRowTopY + 1;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sub Total', summaryX - 45, sumY);
    doc.text(formatAmount(quote.subTotal), summaryX, sumY, { align: 'right' });
    sumY += 4;
    doc.text('VAT (15%)', summaryX - 45, sumY);
    doc.text(formatAmount(quote.vat), summaryX, sumY, { align: 'right' });
    sumY += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(51, 51, 51);
    doc.line(summaryX - 45, sumY, summaryX, sumY);
    sumY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', summaryX - 45, sumY);
    doc.text(formatAmount(quote.total), summaryX, sumY, { align: 'right' });

    // 3. Bottom: Banking Details Box pinned at bottom of page
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

  const imgColIndex = 1;
  const tableHead = Array.of(
    hasAnyImage
      ? Array.of('ITEM', 'IMG', 'QTY', 'CODE', 'UOM', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL')
      : Array.of('ITEM', 'QTY', 'CODE', 'UOM', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL')
  );

  const tableColumnStyles: any = hasAnyImage
    ? {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
    }
    : {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
    };

  autoTable(doc, {
    startY: tableStartY,
    margin: {
      top: tableStartY,
      bottom: bottomMargin,
      left: margin,
      right: margin,
    },
    head: tableHead,
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
      fillColor: '#D3D3D3',
      textColor: '#000000',
      fontStyle: 'bold',
      lineWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: tableColumnStyles,
    didParseCell: (data) => {
      if (data.section === 'body' && hasAnyImage) {
        if (rowImages.at(data.row.index)) {
          data.cell.styles.minCellHeight = 16;
        }
      }
    },
    didDrawCell: (data) => {
      if (hasAnyImage && data.section === 'body' && data.column.index === imgColIndex) {
        const imgBase64 = rowImages.at(data.row.index);
        if (imgBase64) {
          const imgSize = 12;
          const x = data.cell.x + (data.cell.width - imgSize) / 2;
          const y = data.cell.y + (data.cell.height - imgSize) / 2;
          try {
            doc.addImage(imgBase64, 'JPEG', x, y, imgSize, imgSize);
          } catch {
            // Silently ignore unsupported image formats
          }
        }
      }
    },
    didDrawPage: () => {
      drawFullHeightTableBorders();
      drawPageHeader();
      drawFixedFooter();
    },
  });

  // Draw right-aligned 'x of y' on every page after total page count is known
  const totalPages = doc.getNumberOfPages();
  const pageValueY = (margin - 10) + 15 + 8 + 7 + (5 * 4);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`${i} of ${totalPages}`, pageWidth - margin - 2, pageValueY, { align: 'right' });
  }

  if (save) {
    doc.save(`Quote_${quote.quoteNumber}_${quote.reference}.pdf`);
    return '';
  }

  if (returnBlob) {
    return doc.output('blob');
  } else {
    return doc.output('arraybuffer');
  }
};
