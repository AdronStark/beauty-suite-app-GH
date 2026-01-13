import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENTS = ["Mercadona", "Lidl", "Sephora", "Carrefour", "Druni", "Primor", "Consum", "Rituals Mock", "Douglas", "Nivea Clone"];
const RESPONSIBLES = ["Ana García", "Carlos Ruiz", "Laura Sanchis", "Pedro Martínez", "Maria López", "Sofia Gil"];

// Comprehensive list of distribution channels
const CHANNELS = ['Retail', 'Pharmacy', 'Professional', 'Online', 'Luxury'];
const SEC_PACK = ['FoldingBox', 'Leaflet', 'Cello', 'SecurityLabel', 'Spatula'];
const TESTS = ['stability', 'compatibility', 'challenge', 'clinical', 'dermatological'];
const PALLETS = ['europalet', 'americano', 'chep'];

function getRandomSubset(arr: string[], count: number) {
    return arr.sort(() => 0.5 - Math.random()).slice(0, count);
}

function getRandomExampleData(category: string, productName: string, clientName: string) {
    let texture = "";
    let fragrance = "";
    let packagingType = "";
    let claims = "";
    let benchmark = "";
    let ingredients: { name: string, percentage: string }[] = [];
    let capacity = "50";
    let material = "Plástico PP";
    let pao = "12M";

    switch (category) {
        case "Facial":
            texture = ["Crema ligera", "Gel-crema", "Serum fluido", "Aceite seco"].sort(() => 0.5 - Math.random())[0];
            fragrance = ["Sin perfume", "Floral suave", "Cítrico fresco", "Té verde"].sort(() => 0.5 - Math.random())[0];
            packagingType = ["Jar", "Airless", "Dropper", "Tube"].sort(() => 0.5 - Math.random())[0];
            claims = "Anti-arrugas, Hidratante 24h, Testado dermatológicamente, No comedogénico";
            benchmark = "La Roche Posay Hyalu B5";
            capacity = packagingType === 'Dropper' ? "30" : "50";
            material = packagingType === 'Jar' ? "Vidrio" : "Plástico Reciclado";
            ingredients = [
                { name: "Ácido Hialurónico", percentage: "1.5" },
                { name: "Niacinamida", percentage: "4" },
                { name: "Glicerina", percentage: "5" }
            ];
            break;
        case "Corporal":
            texture = ["Emulsión rica", "Mousse", "Loción ligera", "Manteca"].sort(() => 0.5 - Math.random())[0];
            fragrance = ["Vainilla", "Coco", "Almendras dulces", "Karité"].sort(() => 0.5 - Math.random())[0];
            packagingType = ["Bottle", "Jar", "Tube"].sort(() => 0.5 - Math.random())[0];
            claims = "Nutrición intensa, Piel seca, Absorción rápida, 48h Hidratación";
            benchmark = "Nivea Body Milk";
            capacity = "400";
            material = "R-PET";
            ingredients = [
                { name: "Manteca de Karité", percentage: "10" },
                { name: "Aceite de Almendras", percentage: "3" },
                { name: "Urea", percentage: "5" }
            ];
            break;
        case "Solar":
            texture = ["Leche fluida", "Spray transparente", "Crema fundente"].sort(() => 0.5 - Math.random())[0];
            fragrance = ["Tropical", "Coco-Piña", "Neutro"].sort(() => 0.5 - Math.random())[0];
            packagingType = ["Bottle", "Tube"].sort(() => 0.5 - Math.random())[0];
            claims = "SPF 50+, Resistente al agua, Hipoalergénico, Protección Amplio Espectro";
            benchmark = "Isdin Fusion Water";
            capacity = "200";
            material = "Plástico PE";
            pao = "6M";
            ingredients = [
                { name: "Filtros UV Mix", percentage: "20" },
                { name: "Vitamina E", percentage: "0.5" },
                { name: "Aloe Vera", percentage: "2" }
            ];
            break;
        case "Capilar":
            texture = ["Gel perlado", "Crema densa", "Líquido transparente"].sort(() => 0.5 - Math.random())[0];
            fragrance = ["Frutal", "Herbal", "Argán", "Salón profesional"].sort(() => 0.5 - Math.random())[0];
            packagingType = ["Bottle", "Jar"].sort(() => 0.5 - Math.random())[0];
            claims = "Reparación total, Sin sulfatos, Brillo intenso, Anti-frizz";
            benchmark = "Kerastase Discipline";
            capacity = "500";
            material = "PET";
            ingredients = [
                { name: "Queratina Hidrolizada", percentage: "2" },
                { name: "Aceite de Argán", percentage: "1" },
                { name: "Pantenol", percentage: "0.5" }
            ];
            break;
        default: // Higiene / Perfumería
            texture = ["Gel viscoso", "Espuma", "Aceite de ducha"].sort(() => 0.5 - Math.random())[0];
            fragrance = ["Marino", "Aloe Vera", "Lavanda", "Cítricos"].sort(() => 0.5 - Math.random())[0];
            packagingType = "Bottle";
            claims = "pH Neutro, Piel sensible, Familiar, Sin jabón";
            benchmark = "Sanex Biome";
            capacity = "750";
            material = "PET 100% Reciclado";
            ingredients = [
                { name: "Glicerina", percentage: "3" },
                { name: "Extracto de Avena", percentage: "1" }
            ];
            break;
    }

    return {
        texture,
        fragrance,
        packagingType,
        claims,
        benchmark,
        ingredients,
        capacity,
        material,
        pao,
        targetPrice: (Math.random() * 5 + 0.5).toFixed(2),
        bulkCost: (Math.random() * 8 + 1).toFixed(2),
        units: Math.floor(Math.random() * 90 + 10) * 1000, // 10k to 100k
        decoration: Math.random() > 0.5 ? "Etiqueta Adhesiva" : "Serigrafía 2 tintas"
    };
}

const BASE_PRODUCTS = [
    { name: "Crema Anti-edad Noche V5", cat: "Facial" },
    { name: "Champú Sin Sulfatos", cat: "Capilar" },
    { name: "Serum Vitamina C", cat: "Facial" },
    { name: "Protector Solar SPF 50", cat: "Solar" },
    { name: "Body Milk Hidratante", cat: "Corporal" },
    { name: "Agua Micelar 500ml", cat: "Higiene" },
    { name: "Gel de Baño Avena", cat: "Higiene" },
    { name: "Exfoliante Corporal Sal", cat: "Corporal" },
    { name: "Mascarilla Capilar Keratina", cat: "Capilar" },
    { name: "Crema de Manos Q10", cat: "Corporal" }
];

async function main() {
    console.log("Cleaning existing briefings...");
    await prisma.briefing.deleteMany({});

    console.log(`Start seeding 10 COMPREHENSIVE briefings...`);

    const startCode = 250001;
    const now = Date.now();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < 10; i++) {
        const prod = BASE_PRODUCTS[i % BASE_PRODUCTS.length];
        const client = CLIENTS[i % CLIENTS.length];
        const respCom = RESPONSIBLES[i % RESPONSIBLES.length];
        const respTec = RESPONSIBLES[(i + 2) % RESPONSIBLES.length];

        const extraData = getRandomExampleData(prod.cat, prod.name, client);

        const randomTime = now - Math.floor(Math.random() * oneYearMs);
        const randomDate = new Date(randomTime);
        const launchDate = new Date(randomTime + 180 * 24 * 60 * 60 * 1000); // Launch 6 months after

        const code = `B${startCode + i}`;

        const isRetail = Math.random() > 0.5;

        // Fully Populated JSON matching FormData interface
        const formData = {
            // 1. Basic
            clientName: client,
            productName: prod.name,
            category: prod.cat,

            // 2. Commercial
            unitsPerYear: extraData.units.toString(),
            targetPrice: extraData.targetPrice,
            distributionChannels: getRandomSubset(CHANNELS, 2),
            launchDate: launchDate.toISOString().split('T')[0],

            // 3. Strategy
            targetAudience: isRetail ? "Mujeres y Hombres 25-60 años, consumo masivo." : "Cliente exigente, busca tratamiento específico.",
            claims: extraData.claims,
            benchmarkProduct: extraData.benchmark,
            benchmarkUrl: `https://google.com/search?q=${encodeURIComponent(extraData.benchmark)}`,

            // 4. Formula
            formulaOwnership: Math.random() > 0.7 ? "client" : "new",
            targetBulkCost: extraData.bulkCost,
            pao: extraData.pao,
            texture: extraData.texture,
            color: "Blanco / Neutro", // Defaulting for simplicity
            fragrance: extraData.fragrance,
            formula: extraData.ingredients, // Array of objects
            forbiddenIngredients: "Parabenos, Isotiazolinonas, Siliconas cíclicas",
            qualityTests: getRandomSubset(TESTS, 3),

            // 5. Packaging
            packagingType: extraData.packagingType,
            capacity: extraData.capacity,
            primaryMaterial: extraData.material,
            decoration: extraData.decoration,
            targetPricePrimary: (Number(extraData.targetPrice) * 0.4).toFixed(2),
            supplierPrimary: ["Quadpack", "Albea", "Juvasa", "Berlin Packaging"][Math.floor(Math.random() * 4)],

            secondaryPackaging: getRandomSubset(SEC_PACK, Math.random() > 0.5 ? 2 : 0),
            unitsPerBox: [6, 12, 24][Math.floor(Math.random() * 3)].toString(),
            palletType: PALLETS[Math.floor(Math.random() * PALLETS.length)]
        };

        await prisma.briefing.create({
            data: {
                clientName: client,
                productName: prod.name,
                category: prod.cat,
                responsableComercial: respCom,
                responsableTecnico: respTec,
                targetDate: launchDate,
                status: "Borrador",
                code: code,
                formData: JSON.stringify(formData),
                createdAt: randomDate,
                updatedAt: randomDate
            }
        });
        console.log(`Created rich briefing: ${code} - ${prod.name}`);
    }

    console.log(`Deep seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
