import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate random date in 2026
// Helper to generate random date in 2026 (up to today/simulated current date)
function randomDate2026() {
    const start = new Date(2026, 0, 1);
    // Use fixed "today" for simulation consistency or actual new Date() 
    // Since we are in 2026 dev mode, let's assume "today" is roughly early Jan 2026
    // But user wants "real" dates relative to executing the seed. 
    // If the system clock is 2026, new Date() is perfect.
    // If real world is 2025, we might need to fake it.
    // Given the context of "Proyectos AG", let's use the current system date as the cap.
    const end = new Date();

    // Safety check: if start > end (e.g. running in 2025), fallback to Jan 1-8 2026
    if (start > end) {
        return new Date(2026, 0, 1 + Math.floor(Math.random() * 8));
    }

    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to pick random item from array
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Data pools
const CLIENTS = [
    'Mercadona', 'Carrefour', 'El Corte Inglés', 'Primor', 'Druni',
    'Lidl', 'Aldi', 'Dia', 'Amazon Beauty', 'Douglas',
    'Sephora', 'Kiko Milano', 'Clarel', 'Bodybell', 'Perfumerías If'
];

const PRODUCTS = [
    'Champú Anticaída', 'Crema Hidratante Facial', 'Gel de Baño Infantil',
    'Mascarilla Capilar', 'Serum Antiedad', 'Loción Corporal',
    'Acondicionador Nutritivo', 'Exfoliante Facial', 'Crema de Manos',
    'Protector Solar SPF50', 'Aceite Corporal', 'Agua Micelar',
    'Tónico Facial', 'Contorno de Ojos', 'BB Cream'
];

const CATEGORIES = ['Capilar', 'Facial', 'Corporal', 'Solar', 'Infantil', 'Masculino'];
const STATUSES_OFFER = ['Borrador', 'Pendiente de validar', 'Validada', 'Enviada', 'Adjudicada', 'Rechazada'];
const STATUSES_BRIEFING = ['Borrador', 'En Desarrollo', 'Pendiente Cliente', 'Aprobado', 'Rechazado'];
const FORMULA_STATUSES = ['Active', 'In Development', 'Archived'];

const USERS_COMMERCIAL = ['Ana García', 'Carlos López', 'María Fernández'];
const USERS_TECHNICAL = ['Pedro Martínez', 'Laura Sánchez', 'Javier Ruiz'];

async function main() {
    console.log('🌱 Starting 2026 Seed...\n');

    // --- 0. CLEANUP existing 2026 data to avoid conflicts ---
    console.log('🧹 Cleaning up existing 2026 Offers...');
    await prisma.offer.deleteMany({
        where: { code: { startsWith: 'OF26' } }
    });
    console.log('   ✓ Deleted existing OF26 offers');


    // --- 1. BRIEFINGS (15) ---
    console.log('📋 Creating Briefings...');
    const briefings = [];
    for (let i = 1; i <= 15; i++) {
        const client = pick(CLIENTS);
        const product = pick(PRODUCTS);
        const category = pick(CATEGORIES);
        const status = pick(STATUSES_BRIEFING);

        const b = await prisma.briefing.create({
            data: {
                // No code - let it be null to avoid unique constraint issues
                revision: 0,
                clientName: client,
                productName: `${product} - ${client}`,
                category,
                status,
                responsableComercial: pick(USERS_COMMERCIAL),
                responsableTecnico: pick(USERS_TECHNICAL),
                targetDate: randomDate2026(),
                formData: JSON.stringify({
                    packaging: pick(['Tubo 200ml', 'Bote 500ml', 'Frasco 100ml', 'Dispensador 250ml']),
                    fragrance: pick(['Floral', 'Cítrico', 'Neutro', 'Amaderado', 'Frutal']),
                    color: pick(['Blanco', 'Transparente', 'Rosa', 'Azul', 'Verde']),
                    texture: pick(['Crema', 'Gel', 'Loción', 'Espuma', 'Aceite']),
                    notes: `Briefing de prueba ${i} para ${client}`
                }),
                imagePaths: '[]'
            }
        });
        briefings.push(b);
        console.log(`  ✓ Briefing ${i}: ${b.productName}`);
    }

    // --- 2. FORMULAS (15) ---
    console.log('\n🧪 Creating Formulas...');
    const formulas = [];
    for (let i = 1; i <= 15; i++) {
        const category = pick(CATEGORIES);
        const status = pick(FORMULA_STATUSES);
        const briefing = i <= 10 ? briefings[i - 1] : null; // First 10 linked to briefings

        const ingredients = [
            { name: 'Agua Desionizada', percentage: 60 + Math.random() * 20, phase: 'A' },
            { name: pick(['Glicerina', 'Propilenglicol', 'Sorbitol']), percentage: 3 + Math.random() * 5, phase: 'A' },
            { name: pick(['Cetearyl Alcohol', 'Cetyl Alcohol', 'Stearyl Alcohol']), percentage: 2 + Math.random() * 3, phase: 'B' },
            { name: pick(['Cera de Abeja', 'Parafina', 'Lanolina']), percentage: 1 + Math.random() * 2, phase: 'B' },
            { name: pick(['Phenoxyethanol', 'Sodium Benzoate', 'Potassium Sorbate']), percentage: 0.5 + Math.random() * 0.5, phase: 'C' },
            { name: pick(['Perfume', 'Fragancia', 'Aceite Esencial']), percentage: 0.3 + Math.random() * 0.7, phase: 'C' },
        ];

        const f = await prisma.formula.create({
            data: {
                // No code - let it be null to avoid unique constraint issues
                revision: 0,
                name: `Formula ${category} ${i}`,
                category,
                description: `Fórmula de prueba para categoría ${category}. Versión inicial.`,
                status,
                ingredients: JSON.stringify(ingredients),
                briefingId: briefing?.id || null
            }
        });
        formulas.push(f);
        console.log(`  ✓ Formula ${i}: ${f.name} (${status})`);

        // Add Stability Tests (2-4 per formula)
        const testCount = 2 + Math.floor(Math.random() * 3);
        for (let t = 0; t < testCount; t++) {
            await prisma.stabilityTest.create({
                data: {
                    formulaId: f.id,
                    type: pick(['T0', 'T1M', 'T3M', 'T6M', 'Estufa 40C', 'Nevera 4C']),
                    temperature: pick(['25°C', '40°C', '4°C', 'Ambiente']),
                    ph: (5 + Math.random() * 2).toFixed(1),
                    viscosity: `${(5000 + Math.random() * 15000).toFixed(0)} cP`,
                    appearance: pick(['OK', 'Estable', 'Sin cambios', 'Leve separación']),
                    aroma: pick(['Característico', 'Sin cambios', 'Intensificado', 'Atenuado']),
                    notes: t === 0 ? 'Punto inicial' : null,
                    date: new Date(2026, t * 2, 15) // Spread across months
                }
            });
        }

        // Add Samples (1-3 per formula)
        const sampleCount = 1 + Math.floor(Math.random() * 3);
        for (let s = 0; s < sampleCount; s++) {
            await prisma.sample.create({
                data: {
                    formulaId: f.id,
                    recipient: pick(CLIENTS),
                    status: pick(['Pending', 'Approved', 'Rejected', 'Changes Required']),
                    feedback: s > 0 ? pick(['Muy bien', 'Ajustar textura', 'Cambiar fragancia', 'Perfecto para producción']) : null,
                    dateSent: randomDate2026()
                }
            });
        }
    }

    // --- 3. OFFERS 2026 (10) with COMPLETE realistic data ---
    console.log('\n💼 Creating 2026 Offers (Complete Data)...');

    // Offer templates with COMPLETE inputData structure (matching app expectations)
    const offerTemplates = [
        {
            productBase: 'Crema Hidratante Facial',
            input: {
                totalBatchKg: 800, unitSize: 50, density: 0.98, bulkCostMode: 'formula', manufacturingTime: 240, marginPercent: 35,
                formula: [
                    { name: "Agua Desionizada", percentage: 68, costPerKg: 0.05 },
                    { name: "Glicerina", percentage: 8, costPerKg: 1.50 },
                    { name: "Manteca de Karité", percentage: 6, costPerKg: 12.00 },
                    { name: "Aceite de Jojoba", percentage: 4, costPerKg: 18.00 },
                    { name: "Ácido Hialurónico", percentage: 2, costPerKg: 45.00 },
                    { name: "Conservante", percentage: 1, costPerKg: 8.00 },
                    { name: "Perfume", percentage: 0.5, costPerKg: 35.00, imputeSurplus: true, minPurchase: 25 }
                ],
                packaging: [
                    { name: "Tarro Vidrio 50ml", costPerUnit: 0.45, wastePercent: 3 },
                    { name: "Tapa Aluminio", costPerUnit: 0.18, wastePercent: 2 },
                    { name: "Estuche Cartón Premium", costPerUnit: 0.32, wastePercent: 4 }
                ],
                selectedOperations: ['Envasado + estuchado'],
                containerType: 'Tarros', subtype: 'Estándar', capacity: 50
            }
        },
        {
            productBase: 'Champú Anticaída',
            input: {
                totalBatchKg: 2000, unitSize: 400, density: 1.02, bulkCostMode: 'formula', manufacturingTime: 180, marginPercent: 28,
                formula: [
                    { name: "Agua", percentage: 72, costPerKg: 0.02 },
                    { name: "Sodium Laureth Sulfate", percentage: 12, costPerKg: 2.80 },
                    { name: "Cocamidopropyl Betaine", percentage: 5, costPerKg: 4.50 },
                    { name: "Extracto de Biotina", percentage: 2, costPerKg: 28.00 },
                    { name: "Cafeína", percentage: 1.5, costPerKg: 22.00 },
                    { name: "Pantenol", percentage: 1, costPerKg: 15.00 },
                    { name: "Perfume", percentage: 0.8, costPerKg: 32.00 }
                ],
                packaging: [
                    { name: "Botella PET 400ml", costPerUnit: 0.22, wastePercent: 2 },
                    { name: "Tapón Dosificador", costPerUnit: 0.12, wastePercent: 3 },
                    { name: "Etiqueta Frontal+Trasera", costPerUnit: 0.08, wastePercent: 4 }
                ],
                selectedOperations: ['Envasado', 'Etiquetado plano plástico'],
                containerType: 'Frascos', subtype: 'Estándar', capacity: 400
            }
        },
        {
            productBase: 'Serum Antiedad',
            input: {
                totalBatchKg: 150, unitSize: 30, density: 1.01, bulkCostMode: 'formula', manufacturingTime: 300, marginPercent: 48,
                formula: [
                    { name: "Agua", percentage: 75, costPerKg: 0.05 },
                    { name: "Niacinamida 10%", percentage: 10, costPerKg: 18.00 },
                    { name: "Ácido Hialurónico", percentage: 3, costPerKg: 45.00 },
                    { name: "Vitamina C", percentage: 5, costPerKg: 35.00 },
                    { name: "Retinol Encapsulado", percentage: 1, costPerKg: 120.00 },
                    { name: "Péptidos", percentage: 2, costPerKg: 85.00 },
                    { name: "Conservante", percentage: 0.8, costPerKg: 8.00 }
                ],
                packaging: [
                    { name: "Frasco Airless 30ml", costPerUnit: 0.85, wastePercent: 5 },
                    { name: "Caja Individual Premium", costPerUnit: 0.45, wastePercent: 3 }
                ],
                selectedOperations: ['Envasado + estuchado'],
                containerType: 'Frascos', subtype: 'Airless', capacity: 30
            }
        },
        {
            productBase: 'Gel de Baño Infantil',
            input: {
                totalBatchKg: 3000, unitSize: 500, density: 1.03, bulkCostMode: 'formula', manufacturingTime: 150, marginPercent: 22,
                formula: [
                    { name: "Agua", percentage: 78, costPerKg: 0.02 },
                    { name: "Decyl Glucoside", percentage: 10, costPerKg: 5.50 },
                    { name: "Coco Glucoside", percentage: 6, costPerKg: 4.80 },
                    { name: "Extracto de Avena", percentage: 2, costPerKg: 12.00 },
                    { name: "Glicerina", percentage: 3, costPerKg: 1.50 },
                    { name: "Perfume Hipoalergénico", percentage: 0.3, costPerKg: 42.00 }
                ],
                packaging: [
                    { name: "Botella HDPE 500ml", costPerUnit: 0.18, wastePercent: 2 },
                    { name: "Tapón Flip-Top", costPerUnit: 0.08, wastePercent: 2 },
                    { name: "Etiqueta Envolvente", costPerUnit: 0.05, wastePercent: 3 }
                ],
                selectedOperations: ['Envasado', 'Etiquetado envolvente'],
                containerType: 'Frascos', subtype: 'HDPE', capacity: 500
            }
        },
        {
            productBase: 'Protector Solar SPF50',
            input: {
                totalBatchKg: 500, unitSize: 100, density: 0.95, bulkCostMode: 'formula', manufacturingTime: 280, marginPercent: 42,
                formula: [
                    { name: "Agua", percentage: 55, costPerKg: 0.05 },
                    { name: "Filtros UV Orgánicos", percentage: 15, costPerKg: 35.00 },
                    { name: "Dióxido de Titanio", percentage: 8, costPerKg: 18.00 },
                    { name: "Emulsionante", percentage: 5, costPerKg: 8.00 },
                    { name: "Glicerina", percentage: 4, costPerKg: 1.50 },
                    { name: "Vitamina E", percentage: 1, costPerKg: 25.00 },
                    { name: "Perfume", percentage: 0.5, costPerKg: 38.00 }
                ],
                packaging: [
                    { name: "Tubo Aluminio 100ml", costPerUnit: 0.35, wastePercent: 3 },
                    { name: "Tapón Rosca", costPerUnit: 0.08, wastePercent: 2 },
                    { name: "Caja Protección UV", costPerUnit: 0.22, wastePercent: 4 }
                ],
                selectedOperations: ['Envasado + estuchado'],
                containerType: 'Tubos', subtype: 'Aluminio', capacity: 100
            }
        }
    ];

    for (let i = 1; i <= 10; i++) {
        const template = offerTemplates[(i - 1) % offerTemplates.length];
        const client = pick(CLIENTS);
        const status = pick(STATUSES_OFFER);
        const briefing = i <= 5 ? briefings[i - 1] : null;
        const createdAt = randomDate2026();

        const code = `Q26${String(i).padStart(4, '0')}`;

        // CALCULATE REAL COSTS from formula and packaging
        const units = Math.floor((template.input.totalBatchKg * 1000) / template.input.unitSize);
        const kgPerUnit = template.input.unitSize / 1000 / template.input.density;

        // Bulk cost from formula
        let bulkCostPerKg = 0;
        for (const ing of template.input.formula) {
            bulkCostPerKg += (ing.percentage / 100) * ing.costPerKg;
        }
        const bulkCostPerUnit = bulkCostPerKg * kgPerUnit;

        // Packaging cost
        let packagingCostPerUnit = 0;
        for (const pkg of template.input.packaging) {
            packagingCostPerUnit += pkg.costPerUnit * (1 + pkg.wastePercent / 100);
        }

        // Manufacturing cost (simplified: €15/hour, time in minutes)
        const manufacturingCostPerUnit = (template.input.manufacturingTime / 60 * 15) / units;

        // Total direct cost
        const directCostPerUnit = bulkCostPerUnit + packagingCostPerUnit + manufacturingCostPerUnit;
        const totalCostPerUnit = directCostPerUnit * 1.15; // 15% overhead

        // Sale price from margin
        const salePrice = totalCostPerUnit / (1 - template.input.marginPercent / 100);
        const totalValue = salePrice * units;
        const actualMargin = ((salePrice - totalCostPerUnit) / salePrice) * 100;

        // Build complete resultsSummary
        const resultsSummary = {
            units,
            totalValue: totalValue.toFixed(2),
            salePrice: salePrice.toFixed(2),
            directCost: directCostPerUnit.toFixed(3),
            bulkCost: bulkCostPerUnit.toFixed(3),
            packagingCost: packagingCostPerUnit.toFixed(3),
            manufacturingCost: manufacturingCostPerUnit.toFixed(3),
            total_cost_unit: totalCostPerUnit.toFixed(3),
            margin: actualMargin.toFixed(1),
            kgPerUnit: kgPerUnit.toFixed(4),
            totalKg: template.input.totalBatchKg
        };

        // Status-dependent dates
        let sentAt = null, wonAt = null, lostAt = null;
        if (['Enviada', 'Adjudicada', 'Rechazada'].includes(status)) {
            sentAt = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
        }
        if (status === 'Adjudicada') {
            wonAt = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        }
        if (status === 'Rechazada') {
            lostAt = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        }

        await prisma.offer.create({
            data: {
                code,
                revision: 0,
                client,
                description: `${template.productBase} - ${client}`,
                status,
                responsableComercial: pick(USERS_COMMERCIAL),
                responsableTecnico: pick(USERS_TECHNICAL),
                fechaEntrega: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
                probability: status === 'Adjudicada' ? 100 : status === 'Rechazada' ? 0 : 10 + Math.floor(Math.random() * 80),
                expectedCloseDate: new Date(createdAt.getTime() + 45 * 24 * 60 * 60 * 1000),
                inputData: JSON.stringify(template.input),
                resultsSummary: JSON.stringify(resultsSummary),
                briefingId: briefing?.id || null,
                sentAt,
                wonAt,
                lostAt,
                createdAt,
                rejectionReason: status === 'Rechazada' ? pick(['Precio', 'Competencia', 'Timing', 'Cambio de prioridades']) : null,
                competitor: status === 'Rechazada' ? pick(['Competidor A', 'Competidor B', 'Marca propia cliente']) : null,
                feedback: Math.random() > 0.7 ? 'Feedback de cliente registrado' : null
            }
        });
        console.log(`  ✓ ${code}: ${client} - ${template.productBase} (${status}) - ${totalValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`);
    }

    // --- 4. PRODUCTION BLOCKS (10) ---
    console.log('\n🏭 Creating Production Blocks...');
    for (let i = 1; i <= 10; i++) {
        const plannedDate = new Date(2026, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));
        await prisma.productionBlock.create({
            data: {
                articleCode: `ART${String(100 + i).padStart(4, '0')}`,
                articleDesc: `${pick(PRODUCTS)} ${pick(['Premium', 'Standard', 'Eco'])}`,
                clientName: pick(CLIENTS),
                orderNumber: `PED26${String(i).padStart(5, '0')}`,
                units: pick([500, 1000, 2500, 5000]),
                status: pick(['PENDING', 'PLANNED', 'PRODUCED']),
                deadline: new Date(plannedDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                plannedDate,
                plannedReactor: pick(['R1', 'R2', 'R3', 'R4']),
                plannedShift: pick(['M', 'T', 'N']),
                batchLabel: `L${plannedDate.getFullYear()}${String(plannedDate.getMonth() + 1).padStart(2, '0')}${String(i).padStart(3, '0')}`
            }
        });
    }
    console.log('  ✓ 10 Production Blocks created');

    // --- 5. SALES BUDGETS 2026 (Sample) ---
    console.log('\n📊 Creating Sample Sales Budgets for 2026...');

    // Fetch companies by code
    const coperCompany = await prisma.company.findUnique({ where: { code: 'COPER' } });
    const jumsaCompany = await prisma.company.findUnique({ where: { code: 'JUMSA' } });
    const ternumCompany = await prisma.company.findUnique({ where: { code: 'TERNUM' } });
    const cosmeCompany = await prisma.company.findUnique({ where: { code: 'COSME' } });

    if (coperCompany && jumsaCompany && ternumCompany && cosmeCompany) {
        const budgetData = [
            { companyId: coperCompany.id, client: 'Mercadona', amount: 500000 },
            { companyId: coperCompany.id, client: 'Carrefour', amount: 250000 },
            { companyId: coperCompany.id, client: 'VARIOS', amount: 100000 },
            { companyId: jumsaCompany.id, client: 'Douglas', amount: 150000 },
            { companyId: jumsaCompany.id, client: 'Primor', amount: 120000 },
            { companyId: ternumCompany.id, client: 'El Corte Inglés', amount: 200000 },
            { companyId: ternumCompany.id, client: 'VARIOS', amount: 80000 },
            { companyId: cosmeCompany.id, client: 'Sephora', amount: 180000 },
            { companyId: cosmeCompany.id, client: 'VARIOS', amount: 50000 },
        ];
        for (const bd of budgetData) {
            await prisma.salesBudget.upsert({
                where: {
                    year_client_companyId: {
                        year: 2026,
                        client: bd.client,
                        companyId: bd.companyId
                    }
                },
                update: { amount: bd.amount },
                create: { year: 2026, ...bd }
            });
        }
        console.log('  ✓ 9 Budget lines created/updated');
    } else {
        console.log('  ⚠️ Companies not found, skipping budgets. Run seed_companies.ts first.');
    }

    console.log('\n✅ 2026 Seed Complete!');
    console.log('   - 15 Briefings');
    console.log('   - 15 Formulas (with Stability Tests & Samples)');
    console.log('   - 10 Offers');
    console.log('   - 10 Production Blocks');
    console.log('   - 6 Sales Budget Lines');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
