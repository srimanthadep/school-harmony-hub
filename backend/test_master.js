const fs = require('fs');
const { parse } = require('csv-parse/sync');

const raw = fs.readFileSync('backup/Students_List.csv', 'utf-8');
const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });

console.log('Total Rows:', rows.length);
let count = 0;
for (const row of rows) {
    const name = row.Name || row.name;
    const cls = row.Class || row.class;
    if (name && cls) {
        count++;
    } else {
        if (count < 5) console.log('Missing at index', count, row);
    }
}
console.log('Valid Rows:', count);
