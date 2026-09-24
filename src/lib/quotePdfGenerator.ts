/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '../types';

let cachedLogoBase64: string | null = null;

// Helper to fetch and convert /mvl.png to base64
async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  const candidates = ['/mvl.png', 'https://appdesignproyectos.com/mvl.png'];
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64) {
        cachedLogoBase64 = base64;
        return base64;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Generates an official MVL Sales Quote in PDF format using jsPDF & autoTable.
 * Returns the jsPDF instance and sanitized filename.
 */
export async function buildQuotePdf(quote: Quote): Promise<{ doc: jsPDF; fileName: string }> {
  // Letter size in mm: width 215.9, height 279.4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 13;
  const contentWidth = pageWidth - margin * 2; // 189.9 mm

  // Corporate Top Bar (#0196C1)
  doc.setFillColor(1, 150, 193);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Insert Logo if available
  const logoData = await getLogoBase64();
  let headerTextX = margin;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 7.5, 31, 13.5);
      headerTextX = margin + 33;
    } catch {
      headerTextX = margin;
    }
  }

  // Right Box: Folio & Date Badge (Defined early to calculate clear separation)
  const badgeW = 52;
  const badgeX = pageWidth - margin - badgeW;
  const badgeY = 7.5;
  const badgeH = 21.5;

  // Maximum width for issuer text to guarantee at least 10 mm of clear spacing before the badge
  const maxIssuerWidth = badgeX - headerTextX - 10;

  // Issuer Info (with controlled maxWidth and tailored sizing)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42); // slate-900
  const businessName = (quote.issuerPartnerBusinessName || 'MVL CONTROL Y MANTENIMIENTO INDUSTRIAL S.A. DE C.V.').toUpperCase();
  doc.text(businessName, headerTextX, 11, { maxWidth: maxIssuerWidth });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85); // slate-700
  const partnerName = quote.issuerPartnerName || 'Ing. Víctor Pedro Ramírez Barrios';
  const partnerRfc = quote.issuerPartnerRfc || 'RABV891002TF6';
  doc.text(`Razón Social: ${partnerName}  |  RFC: ${partnerRfc}`, headerTextX, 15, { maxWidth: maxIssuerWidth });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Régimen Fiscal: 612 Personas Físicas con Actividades Empresariales', headerTextX, 18.5, { maxWidth: maxIssuerWidth });
  doc.text('José Pérez Marañón #118 B, San José del Consuelo II, León, Gto.', headerTextX, 22, { maxWidth: maxIssuerWidth });
  doc.text('Tel: (477) 710-9900  |  Correo: contacto@mvlmaquinaria.com', headerTextX, 25.5, { maxWidth: maxIssuerWidth });

  // Draw Right Box: Folio & Date Badge
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(1, 150, 193); // #0196C1
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(1, 150, 193);
  doc.text('COTIZACIÓN INSTITUCIONAL', badgeX + badgeW / 2, badgeY + 4.5, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.folNum, badgeX + badgeW / 2, badgeY + 10.5, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`León, Gto. a ${quote.date || new Date().toISOString().split('T')[0]}`, badgeX + badgeW / 2, badgeY + 15, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('Vigencia: 30 Días Naturales', badgeX + badgeW / 2, badgeY + 19, { align: 'center' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, 31, pageWidth - margin, 31);

  // Client & Service Details Box
  const clientBoxY = 33;
  const clientBoxH = 25;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, clientBoxY, contentWidth, clientBoxH, 1.5, 1.5, 'FD');

  // Column 1: Client details
  const col1X = margin + 3;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('CLIENTE / RAZÓN SOCIAL:', col1X, clientBoxY + 4.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const clientNameText = doc.splitTextToSize(quote.clientName, 62);
  doc.text(clientNameText, col1X, clientBoxY + 8.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('RFC DEL CLIENTE:', col1X, clientBoxY + 16);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(quote.clientRfc || 'XAXX010101000', col1X, clientBoxY + 20);

  // Column 2: Plant & Contact
  const col2X = margin + 68;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PLANTA / SUCURSAL:', col2X, clientBoxY + 4.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const plantText = doc.splitTextToSize(quote.plantName || 'Planta Principal', 58);
  doc.text(plantText, col2X, clientBoxY + 8.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ATENCIÓN / CONTACTO:', col2X, clientBoxY + 16);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const contactText = quote.contactName
    ? `${quote.contactName} ${quote.contactRole ? `(${quote.contactRole})` : ''}`
    : (quote.whatsapp ? `Tel: ${quote.whatsapp}` : 'Gerencia de Mantenimiento / Planta');
  doc.text(doc.splitTextToSize(contactText, 58), col2X, clientBoxY + 20);

  // Column 3: Lead time & Agent
  const col3X = margin + 130;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('TIEMPO DE ENTREGA:', col3X, clientBoxY + 4.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(quote.deliveryLeadTime || 'Inmediata', col3X, clientBoxY + 8.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ASESOR RESPONSABLE:', col3X, clientBoxY + 16);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.agentName || 'Ing. Víctor Pedro Ramírez Barrios', col3X, clientBoxY + 20);

  let currentY = clientBoxY + clientBoxH + 2.5;

  // Equipment Box (if technical details are present)
  if (quote.equipmentDetails || quote.serviceHours) {
    const eqH = 9;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, currentY, contentWidth, eqH, 1, 1, 'FD');

    const brandModel = quote.equipmentDetails
      ? `${quote.equipmentDetails.brand || ''} ${quote.equipmentDetails.model || ''}`.trim()
      : 'Compresor / Maquinaria Industrial';
    const serial = quote.equipmentDetails?.serialNumber || 'N/D';
    const capacity = quote.equipmentDetails?.capacity || '50 HP';
    const hours = quote.serviceHours ? `${quote.serviceHours} Horas` : (quote.serviceTypeCategory?.toUpperCase() || 'Estándar');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(`EQUIPO: ${brandModel}    |    SERIE: ${serial}    |    CAPACIDAD: ${capacity}    |    SERVICIO: ${hours}`, margin + 3, currentY + 5.8);

    currentY += eqH + 2.5;
  }

  // Offer Concept Banner
  const bannerH = 9;
  doc.setFillColor(224, 242, 254); // sky-100
  doc.setDrawColor(1, 150, 193);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY, contentWidth, bannerH, 1, 1, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(1, 150, 193);
  const conceptText = `PROPUESTA TÉCNICA Y ECONÓMICA: ${quote.concept.toUpperCase()}`;
  doc.text(doc.splitTextToSize(conceptText, contentWidth - 6), margin + 3, currentY + 5.8);

  currentY += bannerH + 3;

  // Items Table
  const items = quote.itemsTable && quote.itemsTable.length > 0
    ? quote.itemsTable
    : (quote.items || []);

  const tableRows = items.map((it, idx) => [
    it.partida || idx + 1,
    it.description || 'Servicio especializado',
    it.brand || 'MVL',
    `${it.quantity || 1} ${it.unit || 'pza'}`,
    it.partNumber || '-',
    `$${(it.catalogPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `$${(it.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Descripción Técnica del Servicio / Suministro', 'Marca', 'Cant.', 'No. Parte', 'P. Unitario', 'Total MXN']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [1, 150, 193], // #0196C1 corporate cyan
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      valign: 'middle',
      cellPadding: 2
    },
    styles: {
      font: 'Helvetica',
      fontSize: 7.2,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 84 },
      2: { cellWidth: 20 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 22, fontStyle: 'bold', textColor: [71, 85, 105] },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
    },
    margin: { left: margin, right: margin }
  });

  const finalY = (doc as any).lastAutoTable.finalY || currentY + 30;
  let sectionY = finalY + 4;

  // If running out of room on current page, add new page
  if (sectionY > 215) {
    doc.addPage();
    // Top cyan bar on second page too
    doc.setFillColor(1, 150, 193);
    doc.rect(0, 0, pageWidth, 3, 'F');
    sectionY = 14;
  }

  // Totals Box (Right aligned)
  const totalsW = 75;
  const totalsX = pageWidth - margin - totalsW;
  const totalsH = quote.discountRequested ? 26 : 21;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(totalsX, sectionY, totalsW, totalsH, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', totalsX + 4, sectionY + 5);
  doc.setFont('Helvetica', 'bold');
  doc.text(`$${quote.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + totalsW - 4, sectionY + 5, { align: 'right' });

  let curTotalOffset = 5;
  if (quote.discountRequested && quote.discountRequested > 0) {
    curTotalOffset += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(4, 120, 87);
    doc.text(`Descuento Comercial (${quote.discountRequested}%):`, totalsX + 4, sectionY + curTotalOffset);
    const discAmount = quote.discountAmount || (quote.subtotal * (quote.discountRequested / 100));
    doc.setFont('Helvetica', 'bold');
    doc.text(`-$${discAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + totalsW - 4, sectionY + curTotalOffset, { align: 'right' });
  }

  curTotalOffset += 5;
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('IVA (16%):', totalsX + 4, sectionY + curTotalOffset);
  doc.setFont('Helvetica', 'bold');
  doc.text(`$${quote.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + totalsW - 4, sectionY + curTotalOffset, { align: 'right' });

  curTotalOffset += 5;
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX + 3, sectionY + curTotalOffset - 1.5, totalsX + totalsW - 3, sectionY + curTotalOffset - 1.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(1, 150, 193);
  doc.text('TOTAL:', totalsX + 4, sectionY + curTotalOffset + 1);
  doc.setFontSize(9.5);
  doc.text(`$${quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, totalsX + totalsW - 4, sectionY + curTotalOffset + 1, { align: 'right' });

  // Commercial Terms & Bank Box (Left of totals or full width below)
  const termsY = sectionY + totalsH + 4;

  if (termsY < 235) {
    const termsH = 22;
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, termsY, contentWidth, termsH, 1, 1, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CONDICIONES COMERCIALES DE VENTA Y PAGO:', margin + 3, termsY + 4);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`• Tiempo de Entrega: ${quote.deliveryLeadTime || 'Inmediata'}`, margin + 3, termsY + 8);
    doc.text(`• Moneda: Pesos Mexicanos (MXN) con IVA del 16% incluido.`, margin + 3, termsY + 11.5);
    doc.text(`• Garantía: 3 a 6 meses en refacciones originales y mano de obra técnica certificada.`, margin + 3, termsY + 15);
    doc.text(`• Transferencias a: BBVA Bancomer | Beneficiario: Víctor Pedro Ramírez Barrios / MVL | CLABE: 012 225 01548962314 8`, margin + 3, termsY + 18.5);

    // Signatures Area
    const sigY = termsY + termsH + 6;
    if (sigY < 255) {
      const sigColW = 80;

      // Left Signature: Asesor MVL
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, sigY + 8, margin + 10 + sigColW, sigY + 8);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(quote.agentName || 'Ing. Víctor Pedro Ramírez Barrios', margin + 10 + sigColW / 2, sigY + 11.5, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Asesor Técnico Responsable  |  MVL Maquinaria', margin + 10 + sigColW / 2, sigY + 14.5, { align: 'center' });

      // Right Signature: Visto Bueno Cliente
      const sigRightX = pageWidth - margin - sigColW - 10;
      doc.line(sigRightX, sigY + 8, sigRightX + sigColW, sigY + 8);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Aceptación y Visto Bueno del Cliente', sigRightX + sigColW / 2, sigY + 11.5, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Firma, Sello y Orden de Compra (OC)', sigRightX + sigColW / 2, sigY + 14.5, { align: 'center' });
    }
  }

  // Page Numbers and Corporate Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'MVL Control y Mantenimiento Industrial  •  Calidad y Servicio Garantizado  •  www.mvlmaquinaria.com',
      margin,
      pageHeight - 6
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Sanitize filename
  const sanitizedConcept = (quote.concept || 'Cotizacion')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const fileName = `${quote.folNum}_${sanitizedConcept}.pdf`;

  return { doc, fileName };
}

/**
 * Downloads the official MVL Quote PDF directly to disk with 1-click.
 */
export async function downloadQuoteAsPdf(quote: Quote): Promise<void> {
  const { doc, fileName } = await buildQuotePdf(quote);
  doc.save(fileName);
}

/**
 * Generates an in-memory PDF Blob and File instance, ideal for Web Share API file attachments.
 */
export async function generateQuotePdfBlob(quote: Quote): Promise<{ blob: Blob; fileName: string; file: File }> {
  const { doc, fileName } = await buildQuotePdf(quote);
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });
  return { blob, fileName, file };
}

/**
 * Generates base64 string for direct server-side email dispatch with attachments.
 */
export async function generateQuotePdfBase64(quote: Quote): Promise<{ base64: string; fileName: string }> {
  const { doc, fileName } = await buildQuotePdf(quote);
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] || '';
  return { base64, fileName };
}
