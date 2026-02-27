const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB } = require('./utils/db');
const User = require('./models/User');

async function setupAdmin() {
    console.log('🔧 Setting up Admin user "srimanthadep@gmail.com" in DEV...');
    try {
        await connectDB();

        const email = 'srimanthadep@gmail.com';
        let user = await User.findOne({ email });

        if (user) {
            console.log(`👤 User ${email} already exists. Updating password...`);
            user.password = 'admin123';
            await user.save();
        } else {
            console.log(`👤 Creating new owner: ${email}`);
            await User.create({
                name: 'Srimanth',
                email: email,
                password: 'admin123',
                role: 'owner'
            });
        }

        console.log('✅ Admin setup complete. Password is now: admin123');
    } catch (err) {
        console.error('❌ Setup failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

setupAdmin();
