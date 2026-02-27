const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function updateEmail() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const oldEmail = 'srimanth@oxfordschool.cc';
        const newEmail = 'srimanthadep@gmail.com';

        const user = await User.findOne({ email: oldEmail });
        if (!user) {
            console.log(`❌ User with email ${oldEmail} not found.`);
        } else {
            // Check if new email already exists
            const existing = await User.findOne({ email: newEmail });
            if (existing) {
                console.log(`⚠️  Email ${newEmail} already exists. Deleting it to merge...`);
                await User.deleteOne({ _id: existing._id });
            }

            user.email = newEmail;
            await user.save();
            console.log(`✅ Email updated successfully from ${oldEmail} to ${newEmail}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error updating email:', err.message);
        process.exit(1);
    }
}

updateEmail();
