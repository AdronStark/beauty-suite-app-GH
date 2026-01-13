import * as XLSX from 'xlsx';
import path from 'path';

// Adjust path as needed
const filePath = path.resolve('referencias', 'BBDD Ofertas.rev1.xlsx');
console.log(`Reading file: ${filePath}`);

const workbook = XLSX.readFile(filePath);
const sheetName = 'BD Jumsa';
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
    console.error(`Sheet "${sheetName}" not found! Available sheets: ${workbook.SheetNames.join(', ')}`);
    process.exit(1);
}

// Convert to JSON
const data = XLSX.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data, null, 2));
