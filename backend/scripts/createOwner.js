require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_fee_management';

async function createOwner() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Remove existing owner with same email if any
        await User.deleteOne({ email: 'sujan@admin.com' });

        const owner = await User.create({
            name: 'Sujan (Owner)',
            email: 'sujan@admin.com',
            password: 'Sujan@123',
            role: 'owner'
        });

        console.log('✅ Owner account created successfully!');
        console.log('  Email   : sujan@admin.com');
        console.log('  Password: Sujan@123');
        console.log('  Role    : owner');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
}

createOwner();
