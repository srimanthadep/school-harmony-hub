/**
 * One-time fix script: Reset and fully settle book fees for all active students
 * in classes Nursery through 5th.
 *
 * What it does:
 *   1. Removes ALL existing book fee payment records for those students (undoes previous changes).
 *   2. Adds a single "Book fee fully settled" payment equal to each student's totalBookFee
 *      (only if totalBookFee > 0).
 *
 * Usage:
 *   cd backend
 *   node scripts/fix-bookfee-upto-5th.js
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Atlas DNS fix
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TARGET_CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th'];

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not set in .env');
        process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to: ${mongoose.connection.db.databaseName}`);

    const Student = require('../models/Student');

    const students = await Student.find({
        isActive: true,
        class: { $in: TARGET_CLASSES }
    });

    console.log(`📋 Found ${students.length} active students in classes: ${TARGET_CLASSES.join(', ')}`);

    let cleared = 0;
    let settled = 0;
    let skipped = 0;

    for (const student of students) {
        // Step 1: Remove all existing book fee payments
        const bookPaymentsBefore = student.feePayments.filter(p => p.feeType === 'book').length;
        student.feePayments = student.feePayments.filter(p => p.feeType !== 'book');
        cleared += bookPaymentsBefore;

        // Step 2: Add a full-payment record if totalBookFee > 0
        if (student.totalBookFee && student.totalBookFee > 0) {
            student.feePayments.push({
                amount: student.totalBookFee,
                paymentDate: new Date(),
                paymentMode: 'cash',
                feeType: 'book',
                remarks: 'Book fee fully settled'
            });
            settled++;
        } else {
            skipped++;
        }

        await student.save();
        console.log(`  ✔ ${student.name} (${student.class}) — cleared ${bookPaymentsBefore} book payment(s), totalBookFee: ₹${student.totalBookFee || 0}`);
    }

    console.log('\n✅ Done!');
    console.log(`   Students processed : ${students.length}`);
    console.log(`   Book payments cleared: ${cleared}`);
    console.log(`   Fully settled      : ${settled}`);
    console.log(`   Skipped (₹0 fee)   : ${skipped}`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Script failed:', err);
    mongoose.disconnect();
    process.exit(1);
});
