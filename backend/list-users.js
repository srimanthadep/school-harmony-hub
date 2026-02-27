const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const { connectDB } = require('./utils/db');

async function listUsers() {
    try {
        await connectDB();
        const users = await User.find({});
        console.log('--- Current Users ---');
        users.forEach(u => console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`));
        console.log('---------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
