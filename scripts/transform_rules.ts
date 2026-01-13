import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = path.resolve('referencias', 'BBDD Ofertas.rev1.xlsx');
console.log(`Reading Excel: ${filePath}`);
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['BD Jumsa'];
const rawData = XLSX.utils.sheet_to_json(sheet);

const packagingRules = rawData.map((row: any) => {
  if (!row['__EMPTY']) return null;
  return {
    container: row['__EMPTY'],
    subtype: row['__EMPTY_1'],
    capacityMin: row['__EMPTY_2'] || 0,
    capacityMax: row['__EMPTY_3'] || 9999,
    operation: row['__EMPTY_4'],
    scaleMin: row['__EMPTY_5'] || 0,
    scaleMax: row['__EMPTY_6'] || 999999,
    unitCost: row['__EMPTY_12'] || 0,
    people: row['__EMPTY_8'] || 0
  };
}).filter(r => r !== null && r.operation && r.unitCost > 0); // Only keep valid rules with positive cost

const RATES_SCALING = [
  { min: 0, max: 2, value: 120 },
  { min: 2.01, max: 10, value: 150 },
  { min: 10.01, max: 999, value: 200 }
];

const WASTE_SCALING = [
  { min: 0, max: 50, value: 10 },
  { min: 51, max: 200, value: 5 },
  { min: 201, max: 1000, value: 3 },
  { min: 1001, max: 10000, value: 1.5 }
];

const RESIDUE_SCALING = [
  { min: 0, max: 100, value: 5 },
  { min: 101, max: 1000, value: 3 },
  { min: 1001, max: 10000, value: 1 }
];

const fileContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚙️ Restoring Offer Configuration with Excel Data...');

  const configs = [
      { key: 'OFFER_RATES_SCALING', value: JSON.stringify(${JSON.stringify(RATES_SCALING)}) },
      { key: 'OFFER_WASTE_SCALING', value: JSON.stringify(${JSON.stringify(WASTE_SCALING)}) },
      { key: 'OFFER_RESIDUE_SCALING', value: JSON.stringify(${JSON.stringify(RESIDUE_SCALING)}) },
      { key: 'OFFER_PACKAGING_RULES', value: JSON.stringify(${JSON.stringify(packagingRules, null, 2)}) }
  ];

  for (const c of configs) {
      await prisma.configuration.upsert({
          where: { key: c.key },
          update: { value: c.value },
          create: { key: c.key, value: c.value }
      });
      console.log(\`   -> Configured \${c.key}\`);
  }

  console.log('✅ Configuration Restored from Excel!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

const outputPath = path.resolve('prisma', 'seed_config.ts');
fs.writeFileSync(outputPath, fileContent);
console.log(`Generated ${outputPath}`);
