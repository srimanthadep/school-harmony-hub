const fs = require('fs');
const lines = fs.readFileSync('backup/Students_List.csv', 'utf-8').split('\n');
console.log('Line 0 (Headers):', JSON.stringify(lines[0]));
console.log('Line 1 (Data):', JSON.stringify(lines[1]));
