import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { DeliveryNote } from '../../types';

const project = import.meta.env.VITE_PROJECT;
const logo = new URL(`../../assets/logo-${project}.png`, import.meta.url).href;

async function getProjectInfo() {
  const module = await import(`../../project-info/${project}.ts`);
  return {
    paymentDetails: module.bankingDetails,
    company: module.company,
  };
}

export const generateDeliveryNotePDF = async (deliveryNote: DeliveryNote, save: boolean = false, returnBlob = false) => {
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

  // Pull items from deliveryNote.quote.items or fallback to deliveryNote.items
  const itemsList = deliveryNote.quote?.items ?? (deliveryNote as any).items ?? new Array<any>();
  const allRows = itemsList
    .slice()
    .sort((a: any, b: any) => {
      const aNum = Number(a.itemNumber);
      const bNum = Number(b.itemNumber);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return a.itemNumber.toString().localeCompare(b.itemNumber.toString(), undefined, { numeric: true });
    })
    .map((item: any) =>
      Array.of(
        item.itemNumber,
        item.quantity,
        item.code || '—',
        item.uom,
        item.description
      )
    );

  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm on A4

  // Fixed Y-coordinates locked at the bottom of every page
  const paymentBoxHeight = 25;
  const paymentBoxY = pageHeight - paymentBoxHeight - margin; // 267mm (Banking Details box at bottom)
  const signatureY = paymentBoxY - 3;                         // 264mm (Signature just above Banking box)
  const receivedByY = signatureY - 7;                         // 257mm (Received by just above Signature)
  const tableStartY = 56;                                     // Top of table below DELIVER TO / DELIVERY NOTE boxes
  const tableMaxBottomY = receivedByY - 4;                    // 253mm (Table spans down to just above Received By)
  const bottomMargin = pageHeight - tableMaxBottomY;

  // Column widths matching tableColumnStyles so vertical grid lines align down to tableMaxBottomY
  const colWidths = Array.of(12, 12, 18, 15, pageWidth - (margin * 2) - 57);
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

    // --- Deliver To Box (Left) ---
    const customerBoxY = companyInfoY + 23;
    const boxWidth = 70;
    const boxHeight = 33;
    const boxX = companyInfoX;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(boxX, customerBoxY, boxWidth, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DELIVER TO:', boxX + 2, customerBoxY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let custTextY = customerBoxY + 7;

    // Pull client from deliveryNote.client or fallback to deliveryNote.quote.client
    const client = deliveryNote.client || deliveryNote.quote?.client;
    if (client) {
      const clientLines = Array.of(
        client.name,
        client.addressLine1,
        client.addressLine2,
        client.addressLine3,
        client.addressLine4,
        client.vatNumber ? `VAT No: ${client.vatNumber}` : null,
        client.email ? `Email: ${client.email}` : null
      ).filter(Boolean);

      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });

      if (client.representativeName || client.representativeNumber) {
        if (client.representativeName) {
          doc.text(client.representativeName, boxX + 2, custTextY);
        }
        if (client.representativeNumber) {
          doc.text(client.representativeNumber, boxX + boxWidth - 2, custTextY, { align: 'right' });
        }
      }
    }

    // --- Delivery Note Block (Right) ---
    const dnDetailsBlockWidth = 70;
    const dnDetailsBlockX = pageWidth - margin - dnDetailsBlockWidth;
    const dnDetailsY = companyInfoY + logoHeight + 8;

    doc.setLineWidth(0.2);
    doc.rect(dnDetailsBlockX, dnDetailsY, dnDetailsBlockWidth, boxHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY NOTE', pageWidth - margin - 2, dnDetailsY + 4, { align: 'right' });

    doc.setFontSize(7);
    let detailY = dnDetailsY + 7;

    const addDetailRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, dnDetailsBlockX + 2, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, dnDetailsBlockX + dnDetailsBlockWidth - 2, detailY, { align: 'right' });
      detailY += 4;
    };

    const dnDateValue = deliveryNote.date || deliveryNote.createdAt;
    const formattedDate = dnDateValue
      ? new Date(dnDateValue).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    addDetailRow('DELIVERY NOTE NO:', `${deliveryNote.deliveryNoteNumber}`);
    addDetailRow('QUOTE NUMBER:', `${deliveryNote.quote?.quoteNumber || '—'}`);
    addDetailRow('REFERENCE:', `${deliveryNote.quote?.reference || '—'}`);
    addDetailRow('DATE:', formattedDate);
    addDetailRow('VENDOR NUMBER:', client?.vendorNumber || '—');

    // Label drawn here; right-aligned 'x of y' value drawn after autoTable completes
    pageRowY = detailY;
    doc.setFont('helvetica', 'bold');
    doc.text('PAGE:', dnDetailsBlockX + 2, detailY);
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

    // Bottom horizontal border right above Received By
    doc.setLineWidth(0.2);
    doc.line(margin, tableMaxBottomY, pageWidth - margin, tableMaxBottomY);
  };

  const drawFixedFooter = () => {
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);

    // 1. Received and Approved by + Signature (just above Banking Details)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Received and Approved by: __________________________________________________________', margin, receivedByY);
    doc.text('Signature: ________________________________________________________________________', margin, signatureY);

    // 2. Bottom: Banking Details Box pinned at bottom of page
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
    head: Array.of(Array.of('ITEM', 'QTY', 'CODE', 'UOM', 'DESCRIPTION')),
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
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 'auto' },
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
    doc.save(`DeliveryNote_${deliveryNote.deliveryNoteNumber}.pdf`);
    return '';
  }

  if (returnBlob) {
    return doc.output('blob');
  } else {
    return doc.output('arraybuffer');
  }
};
