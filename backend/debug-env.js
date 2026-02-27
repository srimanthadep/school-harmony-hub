const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
console.log('Path:', envPath);
try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Content Length:', content.length);
    console.log('First 20 chars:', JSON.stringify(content.substring(0, 20)));
} catch (e) {
    console.error('File Error:', e.message);
}
require('dotenv').config({ path: envPath });
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'FOUND' : 'NOT FOUND');
console.log('NODE_ENV:', process.env.NODE_ENV);
