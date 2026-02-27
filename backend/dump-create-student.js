const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function dumpCreateStudent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const ActivityLog = require('./models/ActivityLog');
        const logs = await ActivityLog.find({ action: 'CREATE_STUDENT' }).sort({ createdAt: 1 });
        console.log(`Found ${logs.length} CREATE_STUDENT logs.`);

        // Show one sample
        if (logs.length > 0) {
            console.log(JSON.stringify(logs.map(l => ({
                name: l.description,
                data: l.newData
            })), null, 2));
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
dumpCreateStudent();
