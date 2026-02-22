const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const activateUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'srimanthadep@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(0);
        }

        user.isActive = true;
        await user.save({ validateBeforeSave: false });

        console.log(`User ${email} has been activated.`);
        console.log(`Current role: ${user.role}`);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

activateUser();
