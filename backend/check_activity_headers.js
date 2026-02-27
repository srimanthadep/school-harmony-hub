const fs = require('fs');
const { parse } = require('csv-parse/sync');
const raw = fs.readFileSync('backup/activity-logs.csv', 'utf-8');
const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
console.log('Activity Headers:', Object.keys(rows[0]));
