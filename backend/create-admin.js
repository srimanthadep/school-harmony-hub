const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function createNewAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const email = 'superadmin@school.edu';
        const password = 'superadmin';

        // Check if exists
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('Admin already exists. Updating password...');
            existing.password = password;
            await existing.save();
            console.log('✅ Password updated for superadmin@school.edu');
        } else {
            await User.create({
                name: 'Super Admin',
                email: email,
                password: password,
                role: 'owner', // Highest role
                isActive: true
            });
            console.log('✅ New Admin User created:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err.message);
        process.exit(1);
    }
}

createNewAdmin();
