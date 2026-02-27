const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { protectProduction } = require('./utils/safety');

async function restoreStudentFees() {
    await protectProduction();
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const ActivityLog = require('./models/ActivityLog');
        const Student = require('./models/Student');

        // 1. Get ALL payment logs
        const paymentLogs = await ActivityLog.find({
            action: 'RECORD_PAYMENT'
        }).sort({ createdAt: 1 }); // Process oldest to newest

        console.log(`Analyzing ${paymentLogs.length} payment records...`);

        let successCount = 0;
        let failedCount = 0;

        for (const log of paymentLogs) {
            if (!log.newData || !log.description) {
                console.log(`⚠️  Skipping log with missing data: ${log._id}`);
                continue;
            }

            // Extract name from "Recorded payment of X for NAME (Receipt: Y)"
            const match = log.description.match(/Recorded payment of [\d.]+ for (.*?) \(Receipt: /);
            if (!match) {
                console.log(`⚠️  Could not parse name from: ${log.description}`);
                continue;
            }

            const studentName = match[1].trim();
            const paymentData = log.newData;

            // Find student by name
            // Try exact match first
            let student = await Student.findOne({ name: studentName });

            // If not found, try fuzzy/insensitive (sometimes people use different case)
            if (!student) {
                student = await Student.findOne({ name: { $regex: new RegExp(`^${studentName}$`, 'i') } });
            }

            if (!student) {
                console.log(`❌ Student NOT found in DB: "${studentName}"`);
                failedCount++;
                continue;
            }

            // Check if payment already exists (to prevent duplicates if we run twice)
            const existing = student.feePayments.find(p => p.receiptNo === paymentData.receiptNo);
            if (existing) {
                // console.log(`ℹ️  Payment already exists for ${studentName} (${paymentData.receiptNo}). Skipping.`);
                continue;
            }

            // Add payment
            student.feePayments.push({
                amount: paymentData.amount,
                paymentDate: paymentData.paymentDate || log.createdAt,
                paymentMode: paymentData.paymentMode || 'cash',
                feeType: paymentData.feeType || 'tuition',
                receiptNo: paymentData.receiptNo,
                remarks: paymentData.remarks,
                recordedBy: paymentData.recordedBy
            });

            await student.save();
            console.log(`✅ Restored ${paymentData.amount} (Receipt: ${paymentData.receiptNo}) for ${studentName}`);
            successCount++;
        }

        console.log('\n--- Restore Complete ---');
        console.log(`Successfully restored: ${successCount}`);
        console.log(`Failed to match: ${failedCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Error during restoration:', err.message);
        process.exit(1);
    }
}

restoreStudentFees();
