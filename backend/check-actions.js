const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkActions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const ActivityLog = require('./models/ActivityLog');

        const actions = await ActivityLog.distinct('action');
        console.log('--- Unique Actions Found ---');
        console.log(actions.join(', '));

        const modules = await ActivityLog.distinct('module');
        console.log('--- Unique Modules Found ---');
        console.log(modules.join(', '));

        process.exit(0);
    } catch (err) {
        console.error('Error checking actions:', err.message);
        process.exit(1);
    }
}

checkActions();
