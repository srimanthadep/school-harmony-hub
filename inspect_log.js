const fs = require('fs');
const { parse } = require('csv-parse/sync');

const content = fs.readFileSync('backup/activity-logs.csv', 'utf-8');
const records = parse(content, { columns: true, skip_empty_lines: true });

const paymentRecord = records.find(r => r.Action === 'Payment Recorded' || r.Description.includes('Recorded fee payment'));
console.log(JSON.stringify(paymentRecord, null, 2));
