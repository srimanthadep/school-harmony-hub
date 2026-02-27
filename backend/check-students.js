const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./utils/db');

async function checkStudents() {
    try {
        await connectDB();
        const Student = require('./models/Student');
        const students = await Student.find({ isActive: true }).limit(20);
        students.forEach(s => {
            console.log(`- ${s.name} (Class: ${s.class})`);
        });
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
checkStudents();
