const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB } = require('./utils/db');
const User = require('./models/User');

async function updatePassword() {
    console.log('🔄 Changing password to "admin123" in DEV environment...');
    try {
        await connectDB();

        // Find user by email (checking both your common emails)
        const emails = ['srimanthadep@gmail.com', 'admin@school.edu'];
        let user = null;

        for (const email of emails) {
            user = await User.findOne({ email });
            if (user) break;
        }

        if (!user) {
            console.error('❌ Error: Could not find user with either "srimanthadep@gmail.com" or "admin@school.edu"');
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.name} (${user.email})`);

        user.password = 'admin123';
        await user.save();

        console.log('✅ Password updated successfully!');
    } catch (err) {
        console.error('❌ Error updating password:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

updatePassword();
