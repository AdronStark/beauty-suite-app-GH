import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Offer Seeding 2025 (Matched with Excel Rules)...');

    // 1. Clean existing Offers
    await prisma.offer.deleteMany({});
    console.log('Deleted existing offers.');

    // Templates MATCHING EXCEL KEYS ("AD HOC")
    const templates = [
        {
            type: 'PREMIUM',
            productBase: 'Crema Facial',
            input: {
                totalBatchKg: 500, unitSize: 50, density: 0.98, bulkCostMode: 'formula', manufacturingTime: 240, marginPercent: 35,
                formula: [
                    { name: "Aqua Purificata", percentage: 65, costPerKg: 0.05 },
                    { name: "Glycerin", percentage: 5, costPerKg: 1.50 },
                    { name: "Caprylic/Capric Triglyceride", percentage: 10, costPerKg: 4.20 },
                    { name: "Butyrospermum Parkii Butter", percentage: 5, costPerKg: 12.00 },
                    { name: "Sodium Hyaluronate", percentage: 5, costPerKg: 45.00 },
                    { name: "Parfum", percentage: 1, costPerKg: 35.00, imputeSurplus: true, minPurchase: 25 }
                ],
                packaging: [
                    { name: "Tarro Vidrio 50ml", costPerUnit: 0.45, wastePercent: 3 },
                    { name: "Tapa Aluminio", costPerUnit: 0.15, wastePercent: 2 },
                    { name: "Estuche Premium", costPerUnit: 0.35, wastePercent: 5 }
                ],
                // EXCEL MAPPING: Jar -> Tarros, Glass -> Estándar (Only Estándar exists), Op -> Envasado + estuchado
                selectedOperations: ['Envasado + estuchado'],
                containerType: 'Tarros',
                subtype: 'Estándar',
                capacity: 50
            }
        },
        {
            type: 'MASS',
            productBase: 'Agua Micelar',
            input: {
                totalBatchKg: 2000, unitSize: 400, density: 1.01, bulkCostMode: 'formula', manufacturingTime: 180, marginPercent: 25,
                formula: [
                    { name: "Aqua", percentage: 92, costPerKg: 0.02 },
                    { name: "Hexylene Glycol", percentage: 3, costPerKg: 3.20 },
                    { name: "Poloxamer 184", percentage: 1.5, costPerKg: 6.50 }
                ],
                packaging: [
                    { name: "Botella PET 400ml", costPerUnit: 0.18, wastePercent: 2 },
                    { name: "Tapón Flip-Top", costPerUnit: 0.06, wastePercent: 2 },
                    { name: "Etiqueta Frontal", costPerUnit: 0.03, wastePercent: 4 }
                ],
                // EXCEL MAPPING: Bottle -> Frascos, Plastic -> Estándar, Op -> Envasado (or Etiquetado separately?)
                // Excel has "Envasado" (Filling) and "Etiquetado..." separate often, but also "Envasado + Estuchado". 
                // Let's use "Envasado" for basic filling. Note: Excel might assume Envasado includes basic labelling if not specified? 
                // Or "Etiquetado plano plástico" is separate.
                // Let's use 'Envasado' + 'Etiquetado plano plástico' to be robust if valid.
                selectedOperations: ['Envasado', 'Etiquetado plano plástico'],
                containerType: 'Frascos',
                subtype: 'Estándar',
                capacity: 400
            }
        },
        {
            type: 'SERUM',
            productBase: 'Serum Antiedad',
            input: {
                totalBatchKg: 100, unitSize: 30, density: 1.02, bulkCostMode: 'formula', manufacturingTime: 300, marginPercent: 45,
                formula: [
                    { name: "Aqua", percentage: 80, costPerKg: 0.05 },
                    { name: "Niacinamide", percentage: 10, costPerKg: 18.00 },
                    { name: "Propylene Glycol", percentage: 5, costPerKg: 2.80 },
                    { name: "Zinc PCA", percentage: 1, costPerKg: 35.00 }
                ],
                packaging: [
                    { name: "Frasco Vidrio 30ml", costPerUnit: 0.35, wastePercent: 5 },
                    { name: "Pipeta", costPerUnit: 0.45, wastePercent: 5, clientSupplied: true }
                ],
                // EXCEL MAPPING: Bottle -> Frascos, Glass -> Estándar
                selectedOperations: ['Envasado + estuchado'], // Estuchado implies box, but serum usually has box
                containerType: 'Frascos',
                subtype: 'Estándar',
                capacity: 30
            }
        }
    ];

    const clients = ["DermaLuxe S.L.", "BeautyMarket Dist.", "SkinScience Labs", "Farmacia Moderna", "Organic Blends", "Cosmética del Sur"];
    const statuses = ["Borrador", "Pendiente de validar", "Validada", "Enviada", "Adjudicada", "Rechazada"];
    const responsables = ["Ana García", "Carlos Ruiz", "Lucía Méndez", "Pedro Martínez"];

    // Generate 10 sequential offers
    for (let i = 1; i <= 10; i++) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        const client = clients[Math.floor(Math.random() * clients.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const responsable = responsables[Math.floor(Math.random() * responsables.length)];

        const code = `OF25${i.toString().padStart(4, '0')}`;
        const month = Math.floor(Math.random() * 3);
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(2025, month, day);

        // Approximate results (UI will recalc real ones)
        let results: any = {};
        if (template.type === 'PREMIUM') {
            results = { directCost: 2.59, salePrice: 3.98 };
        } else if (template.type === 'MASS') {
            results = { directCost: 0.78, salePrice: 1.04 };
        } else {
            results = { directCost: 2.05, salePrice: 3.72 };
        }

        // Calculate Total Value
        const units = Math.floor((template.input.totalBatchKg * 1000) / template.input.unitSize);
        results.totalValue = results.salePrice * units;

        // CREATE REV 0
        await prisma.offer.create({
            data: {
                client: client,
                product: `${template.productBase} ${template.type === 'MASS' ? 'Basic' : 'Pro'} V${i}`,
                status: (i === 4 || i === 8) ? "Rechazada" : status,
                code: code,
                revision: 0,
                inputData: JSON.stringify(template.input),
                resultsSummary: JSON.stringify(results),
                responsableComercial: responsable,
                responsableTecnico: "Departamento I+D",
                createdAt: date,
                updatedAt: date
            }
        });
        console.log(`Created ${code} Rev 0 - ${client}`);

        // SPECIAL LOGIC FOR OF250004
        if (i === 4) {
            // Rev 1
            const inputRev1 = JSON.parse(JSON.stringify(template.input));
            inputRev1.marginPercent = 20;
            await prisma.offer.create({
                data: {
                    client: client,
                    product: `${template.productBase} ${template.type === 'MASS' ? 'Basic' : 'Pro'} V${i}`,
                    code: code, revision: 1, status: "Rechazada",
                    inputData: JSON.stringify(inputRev1), resultsSummary: JSON.stringify(results),
                    responsableComercial: responsable, responsableTecnico: "Departamento I+D",
                    createdAt: date, updatedAt: date
                }
            });

            // Rev 2 (Adjudicada)
            const inputRev2 = JSON.parse(JSON.stringify(template.input));
            inputRev2.marginPercent = 30;
            // Remove Estuchado from packaging list AND Operations for saving cost
            inputRev2.packaging = inputRev2.packaging.filter((p: any) => !p.name.toLowerCase().includes('estuche'));
            if (template.type === 'PREMIUM') {
                inputRev2.selectedOperations = ['Envasado']; // Downgrade from Envasado + Estuchado
            }
            await prisma.offer.create({
                data: {
                    client: client,
                    product: `${template.productBase} ${template.type === 'MASS' ? 'Basic' : 'Pro'} V${i}`,
                    code: code, revision: 2, status: "Adjudicada",
                    inputData: JSON.stringify(inputRev2), resultsSummary: JSON.stringify(results),
                    responsableComercial: responsable, responsableTecnico: "Departamento I+D",
                    createdAt: date, updatedAt: date
                }
            });
        }

        // SPECIAL LOGIC FOR OF250008
        if (i === 8) {
            const inputRev1 = JSON.parse(JSON.stringify(template.input));
            inputRev1.totalBatchKg = inputRev1.totalBatchKg * 2;
            await prisma.offer.create({
                data: {
                    client: client,
                    product: `${template.productBase} ${template.type === 'MASS' ? 'Basic' : 'Pro'} V${i}`,
                    code: code, revision: 1, status: "Enviada",
                    inputData: JSON.stringify(inputRev1), resultsSummary: JSON.stringify(results),
                    responsableComercial: responsable, responsableTecnico: "Departamento I+D",
                    createdAt: date, updatedAt: date
                }
            });
        }
    }
    console.log('✅ Seeding 2025 Completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
