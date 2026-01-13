import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';

// Adjust path to point to the actual Excel file location
const EXCEL_PATH = 'C:/Users/aibarrap/Documents/AIP/Proyectos AG/Beauty App Suite/Beauty App Suite/P5 - Ofertas Beauty/BBDD Ofertas.rev1.xlsx';
const OUTPUT_PATH = path.join(process.cwd(), 'data/initial_packaging_rules.json');

interface PackagingRule {
    container: string;
    subtype: string;
    capacityMin: number;
    capacityMax: number;
    operation: string;
    scaleMin: number;
    scaleMax: number;
    unitCost: number;
}

function cleanSheet(sheet: any, sheetName: string): PackagingRule[] {
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const rules: PackagingRule[] = [];

    // Find Header Row logic from data_loader.py
    let headerRowIdx = -1;
    for (let i = 0; i < data.length; i++) {
        const rowStr = (data[i] || []).join(' ');
        if (rowStr.includes('Envase') && rowStr.includes('Operaci')) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        console.warn(`Could not find header row in sheet ${sheetName}`);
        return [];
    }

    const headers = data[headerRowIdx].map(h => String(h).trim());
    // Map headers to our keys
    const colMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
        if (h === 'Envase') colMap['container'] = idx;
        if (h === 'Tipo envase') colMap['subtype'] = idx;
        if (h === 'Capcidad min (ml)') colMap['capacityMin'] = idx;
        if (h === 'Capcidad max (ml)') colMap['capacityMax'] = idx;
        if (h.includes('Operaci')) colMap['operation'] = idx;
        if (h === 'Escalado min (uds)') colMap['scaleMin'] = idx;
        if (h === 'Escalado max (uds)') colMap['scaleMax'] = idx;
        if (h === 'Coste unidad') colMap['unitCost'] = idx;
    });

    // Process rows
    for (let i = headerRowIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        // Extract values
        const rule: PackagingRule = {
            container: String(row[colMap['container']] || '').trim(),
            subtype: String(row[colMap['subtype']] || '').trim(),
            capacityMin: parseFloat(row[colMap['capacityMin']]) || 0,
            capacityMax: parseFloat(row[colMap['capacityMax']]) || 0,
            operation: String(row[colMap['operation']] || '').trim(),
            scaleMin: parseFloat(row[colMap['scaleMin']]) || 0,
            scaleMax: parseFloat(row[colMap['scaleMax']]) || 0,
            unitCost: parseFloat(row[colMap['unitCost']]) || 0
        };

        if (rule.container && rule.operation) {
            rules.push(rule);
        }
    }

    return rules;
}

function main() {
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error(`Excel file not found at: ${EXCEL_PATH}`);
        process.exit(1);
    }

    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_PATH);

    let allRules: PackagingRule[] = [];

    // Process Jumsa
    if (workbook.Sheets['BD Jumsa']) {
        console.log('Processing BD Jumsa...');
        allRules = allRules.concat(cleanSheet(workbook.Sheets['BD Jumsa'], 'BD Jumsa'));
    }

    // Process Tubos
    if (workbook.Sheets['BD Tubos']) {
        console.log('Processing BD Tubos...');
        allRules = allRules.concat(cleanSheet(workbook.Sheets['BD Tubos'], 'BD Tubos'));
    }

    // Wrap in JSON structure
    const output = {
        rules: allRules,
        meta: {
            extractedAt: new Date().toISOString(),
            sourceFile: EXCEL_PATH
        }
    };

    // Ensure output dir exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`Successfully extracted ${allRules.length} rules to ${OUTPUT_PATH}`);
}

main();
