const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function createSrimanthAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const email = 'srimanthadep@gmail.com';
        const password = 'admin123';

        // Check if exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User exists. Updating password and ensuring it is active...');
            user.password = password;
            user.isActive = true;
            user.role = 'owner';
            await user.save();
            console.log('✅ Updated srimanthadep@gmail.com');
        } else {
            await User.create({
                name: 'Srimanth Adepu',
                email: email,
                password: password,
                role: 'owner',
                isActive: true
            });
            console.log('✅ Created srimanthadep@gmail.com');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

createSrimanthAdmin();
