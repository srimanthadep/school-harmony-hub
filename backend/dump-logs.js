const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function dumpLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const ActivityLog = require('./models/ActivityLog');

        const payments = await ActivityLog.find({ action: 'RECORD_PAYMENT' }).sort({ createdAt: -1 });
        console.log(`Found ${payments.length} fee payment logs.`);

        const relevantLogs = payments.map(log => ({
            date: log.createdAt,
            desc: log.description,
            data: log.newData,
            target: log.targetId
        }));

        console.log(JSON.stringify(relevantLogs, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error dumping logs:', err.message);
        process.exit(1);
    }
}

dumpLogs();
