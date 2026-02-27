const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB } = require('./utils/db');
const { performFullBackup } = require('./services/backupService');

async function testBackup() {
    console.log('🧪 Starting LIVE Backup & Email Test...');
    try {
        await connectDB();
        await performFullBackup();
        console.log('✅ Live backup sequence finished. Please check your email (srimanthadep@gmail.com)!');
    } catch (err) {
        console.error('❌ Live backup test failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testBackup();
