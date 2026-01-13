import jsPDF from 'jspdf';

export const generateOfferPDF = async (data: any, results: any) => {
    // 1. Setup Document (A4)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const config = data.documentConfig || {};

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Helper to add text
    const text = (str: string, x: number, y: number, size: number = 10, align: 'left' | 'right' | 'center' = 'left', bold: boolean = false, italic: boolean = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : (italic ? "italic" : "normal"));
        doc.text(str || '', x, y, { align });
    };

    // Helper to format currency
    const fmt = (n: number) => (n || 0).toFixed(4) + " €";
    const fmtThousand = (n: number) => (n * 1000).toFixed(0) + " € / millar";

    // --- HEADER ---
    // Left: "Logo" (Text simulation)
    // "laboratorios" gray regular, "coper" blue bold big
    doc.setTextColor(128, 128, 128); // Gray
    doc.setFontSize(14);
    doc.text("laboratorios", margin, 25);

    doc.setTextColor(0, 0, 255); // Blue
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("coper", margin + 30, 25);

    // Right: Contact Info
    doc.setTextColor(0, 0, 0); // Black
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const contactLines = [
        "Miquel Torelló i Pagès, 33 – 35, Nau 9",
        "08750. Molins de Rei",
        "BARCELONA",
        "Telf. 936 804 858",
        "Fax. 936 804 859",
        "e-mail. laboratorioscoper@laboratorioscoper.com"
    ];
    let y = 15;
    contactLines.forEach(line => {
        doc.text(line, pageWidth - margin, y, { align: "right" });
        y += 4;
    });

    // --- ADDRESS BLOCK ---
    y = 50;
    const addressX = pageWidth / 2 + 10;

    const clientName = config.clientName || data.client || "CLIENTE";
    const contactName = config.contactName || data.responsableComercial || "Responsable";
    const addressStr = config.clientAddress || "Dirección Cliente (Simulada)\nCP Ciudad, Provincia";
    const vat = config.clientVat ? `NIF: ${config.clientVat}` : "";

    // Offer Ref / Version (Left Side)
    // Logo is at (margin, 20)
    // We place this below the logo approx y=50?
    // Address block starts at 'y' which is currently 50.

    // Left Box
    const leftX = margin;
    let leftY = y;

    const offerCode = data.code || 'BORRADOR';
    const offerRev = data.revision ?? data.version ?? 1;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Nº OFERTA: ${offerCode}`, leftX, leftY);
    leftY += 5;
    doc.text(`REVISIÓN: ${offerRev}`, leftX, leftY);

    // Right Box (Address)
    text(`A. / A. ${contactName}`, addressX, y, 11, 'left', true);
    y += 5;
    text(clientName.toUpperCase(), addressX, y, 11, 'left', true);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const addressLines = doc.splitTextToSize(addressStr, pageWidth - addressX - margin);
    doc.text(addressLines, addressX, y);
    y += (addressLines.length * 5);

    if (vat) {
        text(vat, addressX, y, 11);
        y += 5;
    }

    // --- DATE & INTRO ---
    y = Math.max(y + 10, 80);
    const dateStr = new Date().toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' });
    text(dateStr, margin, y, 11);

    y += 10;
    const intro = config.introText || "Nos satisface poder enviarle presupuesto aproximado en relación a los productos y servicios que relacionamos a continuación.";
    const splitIntro = doc.splitTextToSize(intro, pageWidth - 2 * margin);
    doc.text(splitIntro, margin, y);
    y += (splitIntro.length * 5) + 10;

    // --- TITLE ---
    const title = `${(data.product || "PRODUCTO").toUpperCase()} (- ${data.code || "N/A"})`;
    text(title, margin, y, 14, 'left', true);
    y += 10;

    // --- 1. ELABORACIÓN ---
    text("1. Elaboración del producto.", margin, y, 11, 'left', true);
    y += 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Materias primas: ", margin + 10, y);
    doc.setFont("helvetica", "normal");
    doc.text("Aportadas por Laboratorios Coper.", margin + 45, y);
    y += 10;

    const col1 = margin + 10;
    const col2 = col1 + 80;
    const col3 = col2 + 40;

    text("Concepto", col1, y, 10, 'left', true);
    text(`Cantidad (${data.totalBatchKg} Kg)`, col2, y, 10, 'left', true);
    text("Precio por Kg", col3, y, 10, 'left', true);
    y += 6;

    text("Coste Fórmula", col1, y, 10);
    text(`${data.totalBatchKg} Kg`, col2, y, 10);
    text(fmt(results.bulkCostUnit), col3, y, 10);
    y += 10;

    if (config.notesBulk) {
        const splitRef = doc.splitTextToSize(config.notesBulk, pageWidth - col1 - margin);
        doc.setFont("helvetica", "italic");
        doc.text(splitRef, col1, y);
        doc.setFont("helvetica", "normal");
        y += (splitRef.length * 5) + 5;
    }


    // --- 2. PRESENTACIÓN ---
    text("2. Presentación posible incluida:", margin, y, 11, 'left', true);
    y += 6;

    if (data.packaging && Array.isArray(data.packaging)) {
        data.packaging.forEach((p: any) => {
            text(`• ${p.name || "Componente"}`, margin + 10, y, 11);
            y += 5;
        });
    }
    y += 5;

    text("Cantidad:", col1, y, 10, 'left', true);
    text(`${results.derivedUnits?.toFixed(0)} unid.`, col2, y, 10, 'left', true);
    y += 6;
    text("Precio por millar (Materiales):", col1, y, 10, 'left', true);
    text(fmtThousand(results.packingCostUnit), col2, y, 10);
    y += 10;

    if (config.notesPacking) {
        const splitRef = doc.splitTextToSize(config.notesPacking, pageWidth - col1 - margin);
        doc.setFont("helvetica", "italic");
        doc.text(splitRef, col1, y);
        doc.setFont("helvetica", "normal");
        y += (splitRef.length * 5) + 5;
    }


    // --- 3. ENVASADO ---
    text(`3. Envasado en ${data.unitSize}ml.`, margin, y, 11, 'left', true);
    y += 6;

    const ops = ["Envasar producto.", "Colocar sistema de cierre.", "Etiquetar.", "Codificar lote.", "Embalar."];
    ops.forEach(op => {
        text(`• ${op}`, margin + 10, y, 11);
        y += 5;
    });
    y += 5;

    text("Cantidad a envasar:", col1, y, 10, 'left', true);
    text(`${results.derivedUnits?.toFixed(0)} unid.`, col2, y, 10, 'left', true);
    y += 6;
    text("Precio envasado:", col1, y, 10, 'left', true);
    text(fmtThousand(results.processCostUnit), col2, y, 10);
    y += 10;

    if (config.notesExtras) {
        const splitRef = doc.splitTextToSize(config.notesExtras, pageWidth - col1 - margin);
        doc.setFont("helvetica", "italic");
        doc.text(splitRef, col1, y);
        doc.setFont("helvetica", "normal");
        y += (splitRef.length * 5) + 5;
    }


    // --- SUMMARY ---
    y += 10;
    text(`Precio por unidad de ${data.unitSize}ml`, col1, y, 12, 'left', true);
    text(fmt(results.salePrice), col2, y, 12, 'left', true); // PVP
    y += 6;
    text(`(Coste Directo: ${fmt(results.directCost)})`, col1, y, 10);
    y += 15;


    // --- 8.5 SCENARIOS (ESCALADO) ---
    // Check if scenarios exist
    const scenarios = data.scenarios || [];
    if (scenarios.length > 0) {
        // Dynamically import helper
        const { calculateScenarioResults } = await import('@/lib/offerCalculations');

        if (y > pageHeight - 60) {
            doc.addPage();
            y = 30;
        }

        text("4. Escalado de Precios (Opciones):", margin, y, 11, 'left', true);
        y += 6;

        // Table Header
        const col1 = margin + 10;
        const col2 = col1 + 80;

        text("Cantidad", col1, y, 10, 'left', true);
        text("P. Venta Unit.", col2, y, 10, 'left', true);
        y += 6;

        // Main Scenario
        const mainScenario = {
            qty: results.derivedUnits,
            mode: 'UNITS',
            margin: data.marginPercent,
            label: "Lote Principal"
        };

        const allScenarios = [
            { ...mainScenario, isMain: true },
            ...scenarios.map((s: any) => ({ ...s, isMain: false }))
        ].sort((a, b) => {
            const getUnits = (s: any) => s.isMain ? s.qty : (s.mode === 'UNITS' ? s.qty : s.qty * 1000);
            return getUnits(a) - getUnits(b);
        });

        allScenarios.forEach((sc: any) => {
            let scResult;
            if (sc.isMain) {
                scResult = results;
            } else {
                // Ensure qty is a number before calculation
                const safeSc = { ...sc, qty: parseFloat(sc.qty) || 0 };
                // USE PASSED CONFIG
                const docConfig = data.snapshotConfig || {};
                scResult = calculateScenarioResults(safeSc, data, docConfig);
            }

            // Display Logic
            const qtyVal = parseFloat(sc.qty) || 0;
            let qtyDisplay = `${qtyVal.toLocaleString('es-ES')} `;
            if (sc.mode === 'KG') qtyDisplay += "Kg";
            else qtyDisplay += "uds";

            if (sc.isMain) qtyDisplay += " (Principal)";
            else if (sc.mode === 'KG') qtyDisplay += ` (~${scResult.derivedUnits?.toFixed(0)} uds)`;

            text(qtyDisplay, col1, y, 10);
            text(fmt(scResult.salePrice), col2, y, 10);
            y += 6;
        });

        y += 10;
    }


    // --- 9. CONDITIONS & FOOTER ---
    if (y > pageHeight - 60) {
        doc.addPage();
        y = 30;
    }

    // Conditions
    text("Condiciones Comerciales:", margin, y, 11, 'left', true);
    y += 6;

    const conditions = [];
    if (config.paymentTerms) conditions.push(`Forma de Pago: ${config.paymentTerms}`);
    if (config.validityText) conditions.push(`Validez: ${config.validityText}`);
    else conditions.push("Validez del presupuesto 30 días.");
    if (config.deliveryTime) conditions.push(`Plazo de Entrega: ${config.deliveryTime}`);
    if (config.incoterms) conditions.push(`Incoterms: ${config.incoterms}`);
    if (conditions.length === 0) conditions.push("Transporte y palets no incluidos.");

    conditions.forEach(c => {
        text(`• ${c}`, margin + 5, y, 10);
        y += 5;
    });
    y += 10;

    if (config.finalObservations) {
        const splitObs = doc.splitTextToSize(config.finalObservations, pageWidth - 2 * margin);
        doc.text(splitObs, margin, y);
        y += (splitObs.length * 5) + 10;
    }

    text("Deseando haber satisfecho sus necesidades al respecto y a la espera de sus gratas noticias,", margin, y, 10);
    y += 5;
    text("aprovecho la ocasión para enviarle un cordial saludo.", margin, y, 10);
    y += 15;
    text("Atentamente.", margin, y, 10);
    y += 5;
    text("Salvador Clarambo.", margin, y, 10);

    // --- SIGNATURES ---
    y += 20;
    const sigY = y;
    text("ACEPTADO CLIENTE:", margin, sigY, 10, 'left', true);
    text("Firma: ____________________", margin, sigY + 20, 10);
    text("Fecha: ..............................", margin, sigY + 30, 10);

    const aipX = pageWidth / 2 + 10;
    text("CONFORME AIP:", aipX, sigY, 10, 'left', true);
    text("Firma: ____________________", aipX, sigY + 20, 10);
    text(`Fecha: ${new Date().toLocaleDateString()}`, aipX, sigY + 30, 10);

    // Add Logo Images if we could... but we drew text logo.

    return doc.output('blob');
};
