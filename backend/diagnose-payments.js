const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');

const ACTIVITY_CSV = 'C:\\Users\\srima\\Downloads\\school-fee-management\\backup\\activity-logs.csv';

async function diagnosePayments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const csvContent = fs.readFileSync(ACTIVITY_CSV, 'utf-8');
        const logs = parse(csvContent, { columns: true });

        const paymentLogs = logs.filter(log => log.Action === 'RECORD_PAYMENT' || log.Action === 'EDIT_PAYMENT');
        console.log(`Total payment actions in CSV: ${paymentLogs.length}`);

        let matched = 0;
        let unmatched = [];
        let duplicateReceipts = [];
        let seenReceipts = new Set();

        for (const log of paymentLogs) {
            const match = log.Description.match(/Recorded payment of [\d.]+ for (.*?) \(Receipt: /) ||
                log.Description.match(/Edited payment for (.*?) \(Receipt: /);

            if (!match) continue;

            const studentName = match[1].trim();
            const receiptMatch = log.Description.match(/\(Receipt: (.*?)\)/);
            const receiptNo = receiptMatch ? receiptMatch[1] : 'Unknown';

            const student = await Student.findOne({
                name: { $regex: new RegExp(`^${studentName}$`, 'i') },
                academicYear: '2025-26'
            });

            if (!student) {
                unmatched.push({ name: studentName, receipt: receiptNo, action: log.Action });
            } else {
                if (seenReceipts.has(receiptNo)) {
                    duplicateReceipts.push({ name: studentName, receipt: receiptNo });
                } else {
                    seenReceipts.add(receiptNo);
                    matched++;
                }
            }
        }

        console.log(`Matched: ${matched}`);
        console.log(`Unmatched Names: ${unmatched.length}`);
        console.log(`Duplicate Receipts (Skipped): ${duplicateReceipts.length}`);

        console.log('\n--- FIRST 10 UNMATCHED NAMES ---');
        console.log(unmatched.slice(0, 10));

        console.log('\n--- FIRST 10 DUPLICATE RECEIPTS ---');
        console.log(duplicateReceipts.slice(0, 10));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnosePayments();
