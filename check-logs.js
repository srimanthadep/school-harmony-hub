const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

async function checkLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Dynamically require ActivityLog model
        const ActivityLog = require('./backend/models/ActivityLog');

        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
        console.log(`Found ${logs.length} activity logs.`);

        if (logs.length > 0) {
            console.log('--- Sample Logs (Showing last 5) ---');
            logs.slice(0, 5).forEach(log => {
                console.log(`[${log.createdAt.toISOString()}] ${log.action}: ${log.description}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('Error fetching logs:', err.message);
        process.exit(1);
    }
}

checkLogs();
