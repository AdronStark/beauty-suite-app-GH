import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, VerticalAlign } from "docx";

import { calculateOfferCosts, calculateScenarioResults } from '@/lib/offerCalculations';

export const generateOfferDocument = async (offerData: any, items: any[]) => {
    const config = offerData.documentConfig || {};

    // Helper to format currency
    const fmt = (n: number) => (n || 0).toFixed(4) + " €";

    // Helper for cost per thousand (common in the example)
    const fmtThousand = (n: number) => (n * 1000).toFixed(0) + " € / millar";

    // Styles
    const font = "Arial";
    const titleSize = 28; // 14pt
    const textSize = 22; // 11pt
    const smallSize = 18; // 9pt

    // Helper for bold text
    const boldText = (text: string, size: number = textSize, color?: string) => new Paragraph({
        children: [new TextRun({ text, bold: true, size, font, color })]
    });

    const normalText = (text: string, size: number = textSize) => new Paragraph({
        children: [new TextRun({ text, size, font })]
    });

    // --- 1. HEADER (Logo + Company Info) ---
    const contactInfo = [
        "Miquel Torelló i Pagès, 33 – 35, Nau 9",
        "08750. Molins de Rei",
        "BARCELONA",
        "Telf. 936 804 858",
        "Fax. 936 804 859",
        "e-mail. laboratorioscoper@laboratorioscoper.com"
    ].join("\n");

    const headerTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "laboratorios", size: 20, font: "Arial", color: "808080" }),
                                    new TextRun({ text: " coper", size: 48, font: "Arial", bold: true, color: "0000FF" })
                                ]
                            })
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: contactInfo, size: 16, font: "Arial" })],
                                alignment: "right"
                            })
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                    })
                ]
            })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
    });

    // --- 2. ADDRESS BLOCK ---
    const clientName = config.clientName || offerData.client || "CLIENTE";
    const clientAddressLines = (config.clientAddress || "Dirección Cliente (Simulada)\nCP Ciudad (Provincia)").split('\n');
    const contactName = config.contactName || offerData.responsableComercial || "Responsable";
    const vat = config.clientVat ? `NIF/CIF: ${config.clientVat}` : "";

    const addressChildren = [
        boldText(`A. / A. ${contactName}`, textSize),
        boldText(clientName.toUpperCase(), textSize),
        ...clientAddressLines.map((line: string) => normalText(line, textSize))
    ];

    if (vat) addressChildren.push(normalText(vat, textSize));

    // Offer Ref / Version Block (Left Side)
    const offerCode = offerData.code || 'BORRADOR';
    const offerRev = offerData.revision ?? offerData.version ?? 1;

    // Formatting Ref Box
    const refCode = boldText(`Nº OFERTA: ${offerCode}`, textSize); // Or just Code
    const refRev = boldText(`REVISIÓN: ${offerRev}`, textSize);

    const addressBlock = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "", size: 8 })], spacing: { after: 300 } }), // Spacer
                            refCode,
                            refRev
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                    }),
                    new TableCell({
                        children: addressChildren,
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                    })
                ]
            })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });

    // --- 3. DATE & GREETING ---
    const dateLine = new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' }), size: textSize, font })],
        spacing: { before: 400, after: 400 }
    });

    const introText = config.introText || "Nos satisface poder enviarle presupuesto aproximado en relación a los productos y servicios que relacionamos a continuación.";
    const greeting = new Paragraph({
        children: [new TextRun({ text: introText, size: textSize, font })],
        spacing: { after: 400 }
    });

    // --- 4. TITLE ---
    const title = new Paragraph({
        children: [new TextRun({ text: `${(offerData.description || "OFERTA").toUpperCase()} (- ${offerData.code || "N/A"})`, bold: true, size: 28, font })],
        spacing: { after: 300 }
    });

    // --- 5. PRODUCTS LOOP ---
    const productSections: any[] = [];

    items.forEach((item, index) => {
        const data = item.inputData || {};
        const productConfig = data.snapshotConfig || {};
        const results = calculateOfferCosts(data, productConfig);

        // Product Title
        productSections.push(new Paragraph({
            children: [new TextRun({ text: `${index + 1}. ${item.productName || data.product || 'Producto ' + (index + 1)}`, bold: true, size: 24, font, color: "0000FF" })],
            spacing: { before: 400, after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "e2e8f0" } }
        }));

        // 1. Elaboración
        const section1Header = boldText("1. Elaboración del producto.", textSize);
        const materialsNote = new Paragraph({
            children: [
                new TextRun({ text: "Materias primas: ", bold: true, size: textSize, font }),
                new TextRun({ text: "Aportadas por Laboratorios Coper.", size: textSize, font })
            ],
            indent: { left: 300 }
        });

        const bulkTable = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [boldText("Concepto", smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [boldText(`Cantidad (${data.totalBatchKg} Kg)`, smallSize)], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [boldText("Precio por Kg", smallSize)], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [normalText("Coste Fórmula", smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [normalText(`${data.totalBatchKg} Kg`, smallSize)], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [normalText(fmt(results.bulkCostUnit), smallSize)], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    ]
                })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            indent: { size: 300, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
        });

        const bulkNotes = config.notesBulk ? new Paragraph({
            children: [new TextRun({ text: config.notesBulk, size: smallSize, font, italics: true })],
            spacing: { before: 200 }
        }) : new Paragraph({});

        productSections.push(section1Header, materialsNote, bulkTable, bulkNotes);

        // 2. Presentación (Packaging)
        const section2Header = new Paragraph({
            children: [new TextRun({ text: "2. Presentación posible incluida:", bold: true, size: textSize, font })],
            spacing: { before: 300 }
        });

        const packagingItems: Paragraph[] = [];
        if (data.packaging && Array.isArray(data.packaging)) {
            data.packaging.forEach((p: any) => {
                packagingItems.push(new Paragraph({
                    children: [new TextRun({ text: `• ${p.name || "Componente"}`, size: textSize, font })],
                    indent: { left: 720 }
                }));
            });
        }

        const pkgCostTable = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [boldText("Cantidad:", smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [boldText(`${results.derivedUnits?.toFixed(0)} unid.`, smallSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [boldText("Precio por millar (Materiales):", smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [normalText(fmtThousand(results.packingCostUnit), smallSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    ]
                })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            indent: { size: 300, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
        });

        const packingNotes = config.notesPacking ? new Paragraph({
            children: [new TextRun({ text: config.notesPacking, size: smallSize, font, italics: true })],
            spacing: { before: 200 }
        }) : new Paragraph({});

        productSections.push(section2Header, ...packagingItems, pkgCostTable, packingNotes);

        // 3. Envasado
        const section3Header = new Paragraph({
            children: [new TextRun({ text: `3. Envasado en ${data.unitSize}ml.`, bold: true, size: textSize, font })],
            spacing: { before: 300 }
        });

        const operationsList = [
            "Envasar producto.",
            "Colocar sistema de cierre.",
            "Etiquetar.",
            "Codificar lote.",
            "Embalar."
        ].map(op => new Paragraph({
            children: [new TextRun({ text: `• ${op}`, size: textSize, font })],
            indent: { left: 720 }
        }));

        const fillingCostTable = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [boldText("Cantidad a envasar:", smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [boldText(`${results.derivedUnits?.toFixed(0)} unid.`, smallSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [boldText("Precio envasado:", smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [normalText(fmtThousand(results.processCostUnit), smallSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    ]
                })
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            indent: { size: 300, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
        });

        productSections.push(section3Header, ...operationsList, fillingCostTable);

        const extrasNotes = config.notesExtras ? new Paragraph({
            children: [new TextRun({ text: config.notesExtras, size: smallSize, font, italics: true })],
            spacing: { before: 200 }
        }) : new Paragraph({});

        productSections.push(extrasNotes);

        // 4. Escalado (Scenarios) & Summary
        const scenarios = data.scenarios || [];
        if (scenarios.length > 0) {
            // ... (Logic for scenarios, already imported calculateScenarioResults at top)
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
                const getUnits = (s: any) => s.isMain ? s.qty : (s.mode === 'UNITS' ? s.qty : s.qty * 1000); // Crude approx
                return getUnits(a) - getUnits(b);
            });

            const scenarioRows = allScenarios.map((sc: any) => {
                let scResult;
                if (sc.isMain) {
                    scResult = results;
                } else {
                    const safeSc = { ...sc, qty: parseFloat(sc.qty) || 0 };
                    // Use item specific config
                    scResult = calculateScenarioResults(safeSc, data, productConfig);
                }

                const qtyVal = parseFloat(sc.qty) || 0;
                let qtyDisplay = `${qtyVal.toLocaleString('es-ES')} `;
                if (sc.mode === 'KG') qtyDisplay += "Kg";
                else qtyDisplay += "uds";

                if (sc.isMain) qtyDisplay += " (Principal)";
                else if (sc.mode === 'KG') qtyDisplay += ` (~${scResult.derivedUnits?.toFixed(0)} uds)`;

                return new TableRow({
                    children: [
                        new TableCell({ children: [normalText(qtyDisplay, smallSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [normalText(fmt(scResult.salePrice), smallSize)], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    ]
                });
            });

            const scenariosTable = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [boldText("Cantidad", smallSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [boldText("P. Venta Unit.", smallSize)], width: { size: 30, type: WidthType.PERCENTAGE } }),
                        ]
                    }),
                    ...scenarioRows
                ],
                width: { size: 80, type: WidthType.PERCENTAGE },
                indent: { size: 300, type: WidthType.DXA },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
            });

            productSections.push(new Paragraph({ text: "", spacing: { after: 200 } }));
            productSections.push(boldText("4. Escalado de Precios:", textSize));
            productSections.push(scenariosTable);

        } else {
            // If no scenarios, show standard summary table for this product
            const totalTable = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [boldText(`Precio por unidad de ${data.unitSize}ml`, textSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [boldText(fmt(results.salePrice), textSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [normalText(`(Coste Directo: ${fmt(results.directCost)})`, smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [], width: { size: 40, type: WidthType.PERCENTAGE } }),
                        ]
                    })
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
                indent: { size: 300, type: WidthType.DXA },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            });
            productSections.push(new Paragraph({ text: "", spacing: { after: 200 } }));
            productSections.push(totalTable);
        }

        productSections.push(new Paragraph({ text: "", spacing: { after: 400 } })); // Spacer between products
    });


    // --- 9. CONDITIONS & FOOTER ---

    // Conditions Table
    const conditionsRows = [];
    if (config.paymentTerms) conditionsRows.push(["Forma de Pago:", config.paymentTerms]);
    if (config.validityText) conditionsRows.push(["Validez:", config.validityText]);
    if (config.deliveryTime) conditionsRows.push(["Plazo de Entrega:", config.deliveryTime]);
    if (config.incoterms) conditionsRows.push(["Incoterms:", config.incoterms]);

    // Defaults if missing
    if (conditionsRows.length === 0) {
        conditionsRows.push(["Transporte y Palets:", "No incluidos"]);
        conditionsRows.push(["Validez:", "30 días"]);
    }

    const conditionsTable = new Table({
        rows: conditionsRows.map(([label, value]) => new TableRow({
            children: [
                new TableCell({ children: [boldText(label || "", smallSize)], width: { size: 40, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [normalText(value || "", smallSize)], width: { size: 60, type: WidthType.PERCENTAGE } }),
            ]
        })),
        width: { size: 80, type: WidthType.PERCENTAGE },
        indent: { size: 720, type: WidthType.DXA }, // Indent a bit
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
    });

    const conditionsHeader = new Paragraph({
        children: [new TextRun({ text: "Condiciones Comerciales:", bold: true, size: textSize, font })],
        spacing: { before: 400, after: 100 }
    });


    // Final Observations
    const finalObs = config.finalObservations ? new Paragraph({
        children: [new TextRun({ text: config.finalObservations, size: smallSize, font })],
        spacing: { before: 300, after: 300 }
    }) : new Paragraph({ spacing: { after: 300 } });


    const footerText = [
        "Deseando haber satisfecho sus necesidades al respecto y a la espera de sus gratas noticias,",
        "aprovecho la ocasión para enviarle un cordial saludo.",
        "",
        "Atentamente.",
        "Salvador Clarambo."
    ].map(line => new Paragraph({ children: [new TextRun({ text: line, size: textSize, font })] }));

    // --- FINAL ASSEMBLY ---
    const childrenElements = [
        headerTable,
        new Paragraph({ text: "" }),
        addressBlock,
        dateLine,
        greeting,
        title,
        ...productSections, // Insert the product loop sections
        conditionsHeader,
        conditionsTable,
        finalObs,
        ...footerText
    ];

    // Document Assembly
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: childrenElements,
            },
        ],
    });

    return await Packer.toBlob(doc);
};
