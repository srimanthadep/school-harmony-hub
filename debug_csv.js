const fs = require('fs');
const { parse } = require('csv-parse/sync');

const raw = fs.readFileSync('backup/Students_List.csv', 'utf-8');
const parsed = parse(raw, { columns: true, skip_empty_lines: true });

console.log('Total Rows:', parsed.length);
console.log('Headers:', Object.keys(parsed[0] || {}));
console.log('Sample Row:', parsed[0]);
