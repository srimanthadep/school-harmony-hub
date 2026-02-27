const xlsx = require('xlsx');
const path = require('path');

const file = 'c:\\Users\\srima\\Downloads\\Staff_Export_24-2-2026.xlsx';
const workbook = xlsx.readFile(file);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- FIRST 5 ROWS of Staff_Export ---');
console.log(data.slice(0, 5));
