/**
 * Diagnostic script: Check book fee payment status for all active students.
 * Shows who has pending book fee and a class-wise summary.
 *
 * Usage:
 *   cd backend
 *   node scripts/check-bookfee-status.js
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

    const students = await Student.find({ isActive: true }).lean();

    const classOrder = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const classSummary = {};
    const pending = [];
    const noBookFee = [];

    for (const s of students) {
        const bookPaid = (s.feePayments || [])
            .filter(p => p.feeType === 'book')
            .reduce((sum, p) => sum + p.amount, 0);
        const totalBookFee = s.totalBookFee || 0;
        const pendingAmt = totalBookFee - bookPaid;

        if (!classSummary[s.class]) {
            classSummary[s.class] = { total: 0, fullyPaid: 0, partial: 0, unpaid: 0, noFeeAssigned: 0, pendingAmount: 0 };
        }
        classSummary[s.class].total++;
        classSummary[s.class].pendingAmount += Math.max(0, pendingAmt);

        if (totalBookFee === 0) {
            classSummary[s.class].noFeeAssigned++;
            noBookFee.push(s);
        } else if (bookPaid >= totalBookFee) {
            classSummary[s.class].fullyPaid++;
        } else if (bookPaid > 0) {
            classSummary[s.class].partial++;
            pending.push({ name: s.name, class: s.class, rollNo: s.rollNo, totalBookFee, bookPaid, pendingAmt });
        } else {
            classSummary[s.class].unpaid++;
            pending.push({ name: s.name, class: s.class, rollNo: s.rollNo, totalBookFee, bookPaid: 0, pendingAmt });
        }
    }

    // --- Class-wise Summary ---
    console.log('=== CLASS-WISE BOOK FEE SUMMARY ===\n');
    const sortedClasses = classOrder.filter(c => classSummary[c]);
    for (const cls of sortedClasses) {
        const c = classSummary[cls];
        const paid = c.total - c.partial - c.unpaid - c.noFeeAssigned;
        console.log(
            `${cls.padEnd(8)} | Total: ${String(c.total).padStart(3)} | Paid: ${String(paid).padStart(3)} | Partial: ${String(c.partial).padStart(3)} | Unpaid: ${String(c.unpaid).padStart(3)} | No fee set: ${String(c.noFeeAssigned).padStart(3)} | Pending ₹: ${c.pendingAmount}`
        );
    }

    // --- Overall ---
    const totalStudents = students.length;
    const totalPending = pending.length;
    const totalPendingAmt = pending.reduce((sum, s) => sum + s.pendingAmt, 0);

    console.log('\n=== OVERALL ===');
    console.log(`Total active students : ${totalStudents}`);
    console.log(`With pending book fee : ${totalPending}`);
    console.log(`Fully paid / no issue : ${totalStudents - totalPending - noBookFee.length}`);
    console.log(`No book fee assigned  : ${noBookFee.length}`);
    console.log(`Total pending amount  : ₹${totalPendingAmt}`);

    if (pending.length === 0) {
        console.log('\n✅ All students with book fee assigned have fully paid!');
    } else {
        console.log('\n=== STUDENTS WITH PENDING BOOK FEE ===\n');
        // Sort by class then roll number
        pending.sort((a, b) => classOrder.indexOf(a.class) - classOrder.indexOf(b.class) || String(a.rollNo).localeCompare(String(b.rollNo), undefined, { numeric: true }));
        for (const s of pending) {
            console.log(`  ${s.class.padEnd(8)} | Roll: ${String(s.rollNo).padStart(3)} | ${s.name.padEnd(30)} | Total: ₹${s.totalBookFee} | Paid: ₹${s.bookPaid} | Pending: ₹${s.pendingAmt}`);
        }
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
