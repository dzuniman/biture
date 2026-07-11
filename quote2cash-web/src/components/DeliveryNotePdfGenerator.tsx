import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { DeliveryNote, QuoteItem } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

export const generateDeliveryNotePDF = async (deliveryNote: DeliveryNote, save: boolean = false) => {
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

  // Pre-load logo image
  const logoImg = new Image();
  logoImg.src = logo;
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = () => {
      console.error("PDF Generator: Could not load logo image from", logo);
      resolve(null);
    };
  });

  const allRows = (deliveryNote.quote?.items ?? [])
    .slice()
    .sort((a: QuoteItem, b: QuoteItem) => {
      const aNum = Number(a.itemNumber);
      const bNum = Number(b.itemNumber);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return String(a.itemNumber).localeCompare(String(b.itemNumber), undefined, { numeric: true });
    })
    .map((item: QuoteItem) => [item.itemNumber, item.quantity, item.description]);

  const MAX_ROWS_PER_PAGE = 24;
  const totalPages = Math.ceil(allRows.length / MAX_ROWS_PER_PAGE);
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 55;
  const summaryHeight = 20;
  const totalFooterHeight = summaryHeight + footerBlockHeight;

  for (let i = 0; i < allRows.length; i += MAX_ROWS_PER_PAGE) {
    const currentPage = Math.floor(i / MAX_ROWS_PER_PAGE) + 1;
    let chunk = allRows.slice(i, i + MAX_ROWS_PER_PAGE);

    while (chunk.length < MAX_ROWS_PER_PAGE) {
      chunk.push(['', '', '', '', '', '', '']);
    }

    const margin = 5;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = margin;

    // --- Company Info (Top Left) ---
    const companyInfoX = margin;
    let companyInfoY = currentY - 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BITURE (PTY) LTD   Reg: K2013/194395/07   VAT No: 4480272220', companyInfoX, companyInfoY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Cnr Fred Versepute and Asparagus Road Midrand 1685', companyInfoX, companyInfoY + 16);
    doc.text('Email: BetrothM@biture.co.za   Tel: +27 65 835 4371 | +27 83 249 8510', companyInfoX, companyInfoY + 20);

    // --- Logo (Top Right) ---
    const logoHeight = 15;
    let logoWidth = 0;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      logoWidth = logoHeight * aspectRatio;
      doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, currentY - 2, logoWidth, logoHeight);
    }

    // --- Bill To Box (below company info) ---
    let customerBoxY = companyInfoY + 23;
    const boxWidth = 70;
    const boxHeight = 33; // fixed height to match Tax Invoice block
    const boxX = companyInfoX;

    doc.setLineWidth(0.2);
    doc.rect(boxX, customerBoxY, boxWidth, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('SITE DETAILS:', boxX + 2, customerBoxY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let custTextY = customerBoxY + 7;

    if (deliveryNote.quote?.client) {
      // Build client lines WITHOUT representative
      const clientLines = [
        deliveryNote.quote.client.name,
        deliveryNote.quote.client.addressLine1,
        deliveryNote.quote.client.addressLine2,
        deliveryNote.quote.client.addressLine3,
        deliveryNote.quote.client.addressLine4,
        deliveryNote.quote.client.vatNumber ? `VAT No: ${deliveryNote.quote.client.vatNumber}` : null,
        deliveryNote.quote.client.email ? `Email: ${deliveryNote.quote.client.email}` : null
      ].filter(Boolean);

      // Draw normal client lines
      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });

      // Draw representative line separately (name left, number right, separator in middle)
      if (deliveryNote.quote.client.representativeName || deliveryNote.quote.client.representativeNumber) {
        const repLineY = custTextY;
        const separatorX = boxX + (boxWidth / 2);

        if (deliveryNote.quote.client.representativeName) {
          doc.text(deliveryNote.quote.client.representativeName, boxX + 2, repLineY);
        }

        if (deliveryNote.quote.client.representativeNumber) {
          doc.text(deliveryNote.quote.client.representativeNumber, boxX + boxWidth - 2, repLineY, { align: 'right' });
        }

        custTextY += 3;
      }

    }

    // --- Job Card Block (below logo, same height as Bill To) ---
    const deliveryNoteDetailsBlockWidth = 70;
    const deliveryNoteDetailsBlockX = pageWidth - margin - deliveryNoteDetailsBlockWidth;
    const deliveryNoteDetailsY = companyInfoY + logoHeight + 8;

    doc.setLineWidth(0.2);
    doc.rect(deliveryNoteDetailsBlockX, deliveryNoteDetailsY, deliveryNoteDetailsBlockWidth, boxHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY NOTE', pageWidth - margin - 2, deliveryNoteDetailsY + 4, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    let detailY = deliveryNoteDetailsY + 7;

    const adddeliveryNoteDetailRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, deliveryNoteDetailsBlockX + 2, detailY);

      doc.setFont('helvetica', 'normal');
      doc.text(value, deliveryNoteDetailsBlockX + deliveryNoteDetailsBlockWidth - 2, detailY, { align: 'right' });

      detailY += 4;
    };

    adddeliveryNoteDetailRow('DELIVERY NOTE NUMBER:', deliveryNote.deliveryNoteNumber);
    adddeliveryNoteDetailRow('DATE:', formatDate(deliveryNote.createdAt ? new Date(deliveryNote.createdAt) : undefined));
    adddeliveryNoteDetailRow('REFERENCE:', deliveryNote.reference || '—');
    adddeliveryNoteDetailRow('VENDOR NUMBER:', deliveryNote.quote?.client?.vendorNumber || '—');
    if (deliveryNote.quote?.poNumber) {
      adddeliveryNoteDetailRow('PO NUMBER:', deliveryNote.quote.poNumber);
    }
    adddeliveryNoteDetailRow('PAGE:', `${currentPage} of ${totalPages}` || '—');

    // --- Table Start ---
    currentY = Math.max(customerBoxY + boxHeight, deliveryNoteDetailsY + boxHeight) + 5;


    autoTable(doc, {
      startY: currentY,
      head: [['ITEM', 'QTY', 'DESCRIPTION']],
      body: chunk,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: { top: 0, right: 0.1, bottom: 0, left: 0.1 }, // verticals only
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 'auto' },
      }, didDrawCell: (data) => {
        if (
          data.section === 'body' &&
          data.row.index === chunk.length - 1 &&
          data.column.index === data.table.columns.length - 1
        ) {
          const y = data.cell.y + data.cell.height;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
        }
      },
      margin: margin,
    });

    // --- Summary + Footer + Payment Box (runs on every page) ---
    const table = (doc as any).lastAutoTable;
    currentY = Math.max(table.finalY + 8, pageHeight - margin - totalFooterHeight);
    currentY += 10;

    // Summary
    const summaryX = pageWidth - margin;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sub Total', summaryX - 45, currentY);
    doc.text(formatAmount(deliveryNote.quote?.subTotal), summaryX, currentY, { align: 'right' });
    currentY += 4;
    doc.text('VAT (15%)', summaryX - 45, currentY);
    doc.text(formatAmount(deliveryNote.quote?.vat), summaryX, currentY, { align: 'right' });
    currentY += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(51, 51, 51);
    doc.line(summaryX - 45, currentY, summaryX, currentY);
    currentY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', summaryX - 45, currentY);
    doc.text(formatAmount(deliveryNote.quote?.total), summaryX, currentY, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    // Approval + Terms
    currentY = Math.max(currentY + 5, pageHeight - margin - footerBlockHeight);
    currentY += -14;
    doc.setFontSize(8);
    doc.text('Received and Approved by: __________________________________________________________', margin, currentY);
    currentY += 8;
    doc.text('Signature: ________________________________________________________________________', margin, currentY);

    // Payment Details Box
    const paymentBoxX = margin;
    const paymentBoxY = pageHeight - 29;
    const paymentBoxWidth = pageWidth - (margin * 2);
    const paymentBoxHeight = 25;

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
    const paymentDetails = [
      'Bank: STANDARD BANK',
      'Branch: MIDRAND',
      'Branch Code: 123456',
      'Account Name: BITURE (PTY) LTD',
      'Account Number: 9876543210',
      'SWIFT Code: SBZAZAJJ'
    ];
    paymentDetails.forEach(line => {
      doc.text(line, paymentBoxX + 4, paymentTextY);
      paymentTextY += 3;
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Add new page if more chunks remain
    if (i + MAX_ROWS_PER_PAGE < allRows.length) {
      doc.addPage();
    }
  }

  if (save) {
    // Trigger a download
    doc.save(`DeliveryNote_${deliveryNote.deliveryNoteNumber}.pdf`);
    return ""; // nothing needed for preview in this case
  } else {
    // Return blob URL for preview
    const blob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(blob).toString();
    return pdfUrl;
  }
};
