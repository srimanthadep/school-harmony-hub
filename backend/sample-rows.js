const xlsx = require('xlsx');
const path = require('path');

const file = 'c:\\Users\\srima\\Downloads\\school-fee-management\\backup\\I.xlsx';
const workbook = xlsx.readFile(file);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- SAMPLE DATA ROWS ---');
console.log(data.slice(3, 10));
