const xlsx = require('xlsx');
const path = require('path');

const files = [
    'c:\\Users\\srima\\Downloads\\school-fee-management\\backup\\Nursary.xlsx',
    'c:\\Users\\srima\\Downloads\\school-fee-management\\backup\\UKG.xlsx',
    'c:\\Users\\srima\\Downloads\\school-fee-management\\backup\\X.xlsx'
];

files.forEach(file => {
    try {
        const workbook = xlsx.readFile(file);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`--- ROW 2 of ${path.basename(file)} ---`);
        console.log(data[1]);
    } catch (e) {
        console.log(`Error reading ${file}`);
    }
});
