const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkRemainingData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check various collections
        const collections = [
            { name: 'ActivityLog', model: require('./models/ActivityLog') },
            { name: 'Expense', model: require('./models/Expense') },
            { name: 'Attendance', model: require('./models/Attendance') },
            { name: 'StaffAttendance', model: require('./models/StaffAttendance') }
        ];

        for (const coll of collections) {
            const count = await coll.model.countDocuments();
            console.log(`- ${coll.name}: ${count} records found.`);
            if (count > 0) {
                const latest = await coll.model.findOne().sort({ createdAt: -1 });
                console.log(`  (Latest: ${latest.createdAt ? latest.createdAt.toISOString() : 'no date'} - ${latest.description || latest.action || 'no desc'})`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error checking collections:', err.message);
        process.exit(1);
    }
}

checkRemainingData();
