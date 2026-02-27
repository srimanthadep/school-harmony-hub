const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');

async function checkAcademicYears() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const years = await Student.distinct('academicYear');
        const counts = await Student.countDocuments();
        console.log(`Total Students in DB: ${counts}`);
        console.log(`Academic Years Found: ${years.join(', ')}`);

        const sample = await Student.findOne();
        if (sample) {
            console.log('Sample Student:', {
                name: sample.name,
                class: sample.class,
                academicYear: sample.academicYear,
                isActive: sample.isActive
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkAcademicYears();
