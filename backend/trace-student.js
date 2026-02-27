const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function findTraces(namePart) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const ActivityLog = require('./models/ActivityLog');
        const logs = await ActivityLog.find({
            description: { $regex: new RegExp(namePart, 'i') }
        });
        console.log(`--- Traces for "${namePart}" ---`);
        logs.forEach(l => {
            console.log(`[${l.createdAt.toISOString()}] ${l.action}: ${l.description}`);
            if (l.newData) console.log(JSON.stringify(l.newData, null, 2));
        });
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
findTraces('Renuka K');
