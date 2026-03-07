/**
 * One-time fix: Settle book fees for the 6 remaining unpaid 5th class students.
 * Classes 6th–10th are intentionally skipped (no book fee assigned).
 *
 * Usage:
 *   cd backend
 *   node scripts/settle-remaining-5th-bookfee.js
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not set in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to: ${mongoose.connection.db.databaseName}\n`);

    const Student = require('../models/Student');

    // Find active 5th class students who have NOT fully paid their book fee
    const students = await Student.find({ isActive: true, class: '5th' });

    const pending = students.filter(s => {
        const bookPaid = (s.feePayments || [])
            .filter(p => p.feeType === 'book')
            .reduce((sum, p) => sum + p.amount, 0);
        return (s.totalBookFee || 0) > 0 && bookPaid < s.totalBookFee;
    });

    if (pending.length === 0) {
        console.log('✅ No pending 5th class book fee payments found. Nothing to do.');
        await mongoose.disconnect();
        return;
    }

    console.log(`📋 Found ${pending.length} student(s) with pending book fee in 5th class:\n`);

    let settled = 0;
    for (const student of pending) {
        const bookPaid = (student.feePayments || [])
            .filter(p => p.feeType === 'book')
            .reduce((sum, p) => sum + p.amount, 0);
        const remaining = student.totalBookFee - bookPaid;

        student.feePayments.push({
            amount: remaining,
            paymentDate: new Date(),
            paymentMode: 'cash',
            feeType: 'book',
            remarks: 'Book fee settled'
        });

        await student.save();
        console.log(`  ✔ ${student.name} (Roll: ${student.rollNo}) — Settled ₹${remaining}`);
        settled++;
    }

    console.log(`\n✅ Done! ${settled} student(s) book fee fully settled.`);
    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌ Script failed:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
