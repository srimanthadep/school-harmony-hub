const XLSX = require('xlsx');
const workbook = XLSX.readFile('backup/I.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
for (let i = 0; i < 5; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
}
