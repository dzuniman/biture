import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Quote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

export const generateQuotePDF = async (quote: Quote, save: boolean = false) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  // Get all row items
  let allRows = quote.items
    .slice()
    .sort((a, b) => {
      const aNum = Number(a.itemNumber);
      const bNum = Number(b.itemNumber);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return a.itemNumber
        .toString()
        .localeCompare(b.itemNumber.toString(), undefined, { numeric: true });
    })
    .map(item => [
      item.itemNumber,
      item.quantity,
      item.code || '—',
      item.uom,
      item.description,
      formatAmount(item.unitPrice),
      formatAmount(item.totalPrice),
    ]);

  const MAX_ROWS_PER_PAGE = 24;
  const totalPages = Math.ceil(allRows.length / MAX_ROWS_PER_PAGE);
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 55;
  const summaryHeight = 20;
  const totalFooterHeight = summaryHeight + footerBlockHeight;

  // Split into chunks of 24 rows
  for (let i = 0; i < allRows.length; i += MAX_ROWS_PER_PAGE) {
    const currentPage = Math.floor(i / MAX_ROWS_PER_PAGE) + 1;
    let chunk = allRows.slice(i, i + MAX_ROWS_PER_PAGE);

    // Pad with empty rows if less than 24
    while (chunk.length < MAX_ROWS_PER_PAGE) {
      chunk.push(['', '', '', '', '', '', '']);
    }

    const margin = 5;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin; // Unified Y cursor for sequential content flow

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

    // --- Top Section: Logo (Left), Company Info (next to logo), Quote Details (Right) ---
    const companyInfoStartX = margin;
    let companyInfoY = currentY;

    // Logo (top left)
    const logoHeight = 15;
    let logoWidth = 0;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      logoWidth = logoHeight * aspectRatio;
      doc.addImage(logoImg, 'PNG', companyInfoStartX, companyInfoY, logoWidth, logoHeight);
    }
    companyInfoY += 5; // small offset for text alignment

    // Company Info (next to logo)
    const companyTextX = companyInfoStartX;
    let companyTextY = companyInfoY + 12;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BITURE (PTY) LTD   Reg: K2013/194395/07   VAT No: 4480272220', companyTextX, companyTextY);
    companyTextY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Cnr Fred Versepute and Asparagus Road Midrand 1685', companyTextX, companyTextY);
    companyTextY += 4;
    doc.text('Email: BetrothM@biture.co.za   Tel: +2765 835 4371 | +2783 249 8510', companyTextX, companyTextY);

    // Quote Details Block (Right)
    const quoteDetailsBlockWidth = 70;
    const quoteDetailsBlockX = pageWidth - margin - quoteDetailsBlockWidth;
    let quoteDetailsY = currentY;

    doc.setLineWidth(0.2);
    doc.rect(quoteDetailsBlockX, quoteDetailsY, quoteDetailsBlockWidth, 35); // box around sales quotation

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES QUOTATION', pageWidth - margin - 2, quoteDetailsY + 6, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    let detailY = quoteDetailsY + 12;

    const addQuoteDetailRow = (label: string, value: string) => {
      // Label left-aligned
      doc.setFont('helvetica', 'bold');
      doc.text(label, quoteDetailsBlockX + 2, detailY);

      // Value right-aligned
      doc.setFont('helvetica', 'normal');
      doc.text(value, quoteDetailsBlockX + quoteDetailsBlockWidth - 2, detailY, { align: 'right' });

      detailY += 4; // move down for next row
    };

    addQuoteDetailRow('QUOTE NUMBER:', `${quote.quoteNumber}`);
    addQuoteDetailRow('REFERENCE:', quote.reference);
    addQuoteDetailRow('DATE:', new Date(quote.date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }));
    addQuoteDetailRow('VALIDITY:', `${quote.validityDays} Days`);
    addQuoteDetailRow('VENDOR NUMBER:', quote.vendorNumber || '—');
    addQuoteDetailRow('PAGE:', `${currentPage} of ${totalPages}` || '—');

    // Second Logo (below sales quotation block, far right)
    const secondLogoY = quoteDetailsY + 40;
    doc.addImage(logoImg, 'PNG', quoteDetailsBlockX, secondLogoY, logoWidth, logoHeight);

    // Customer Box (below first logo, far left)
    let customerBoxY = companyInfoY + logoHeight + 8;
    const boxWidth = 70;
    const boxX = companyInfoStartX;

    if (quote.client) {
      const clientLines = [
        quote.client.name,
        quote.client.addressLine1,
        quote.client.addressLine2,
        quote.client.addressLine3,
        quote.client.addressLine4,
        quote.client.vatNumber ? `VAT No: ${quote.client.vatNumber}` : null,
        quote.client.email ? `Email: ${quote.client.email}` : null,
        quote.client.representativeName ? `${quote.client.representativeName} | ${quote.client.representativeNumber}` : null
      ].filter(Boolean);

      const boxHeight = 6 + (clientLines.length * 3);

      doc.setLineWidth(0.2);
      doc.rect(boxX, customerBoxY, boxWidth, boxHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('BILL TO:', boxX + 2, customerBoxY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      let custTextY = customerBoxY + 7;

      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });
    }

    // Update currentY for table start
    currentY = Math.max(companyInfoY, secondLogoY + logoHeight);
    currentY += 5;
    // Render this chunk as a table
    autoTable(doc, {
      startY: currentY,
      head: [['ITEM', 'QTY', 'CODE', 'UOM', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL']],
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
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
      },
      didDrawCell: (data) => {
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

    // Summary
    const summaryX = pageWidth - margin;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sub Total', summaryX - 45, currentY);
    doc.text(formatAmount(quote.subTotal), summaryX, currentY, { align: 'right' });
    currentY += 4;
    doc.text('VAT (15%)', summaryX - 45, currentY);
    doc.text(formatAmount(quote.vat), summaryX, currentY, { align: 'right' });
    currentY += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(51, 51, 51);
    doc.line(summaryX - 45, currentY, summaryX, currentY);
    currentY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', summaryX - 45, currentY);
    doc.text(formatAmount(quote.total), summaryX, currentY, { align: 'right' });
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
      'Bank: Standard Bank',
      'Branch: Midrand',
      'Branch Code: 123456',
      'Account Name: Biture (Pty) Ltd',
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
    doc.save(`Quote_${quote.quoteNumber}_${quote.reference}.pdf`);
    return ""; // nothing needed for preview in this case
  } else {
    // Return blob URL for preview
    const blob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(blob).toString();
    return pdfUrl;
  }
};