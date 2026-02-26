const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');
const ActivityLog = require('./models/ActivityLog');

const STUDENTS_CSV = 'C:\\Users\\srima\\Downloads\\students.csv';

async function startRecovery() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // 1. RE-IMPORT STUDENTS FROM STUDENTS.CSV
        console.log('--- RE-IMPORTING STUDENTS FROM ALL-IN-ONE CSV ---');
        const content = fs.readFileSync(STUDENTS_CSV, 'utf-8');
        const lines = content.split(/\r?\n/).slice(1); // Skip header

        let imported = 0;
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length < 5) continue;

            // Format: Student ID,Name,Class,Section,Roll No,Parent,Phone,Total Fee
            const studentData = {
                studentId: parts[0]?.trim(),
                name: parts[1]?.trim(),
                class: parts[2]?.trim(),
                section: parts[3]?.trim(),
                rollNo: parts[4]?.trim(),
                parentName: parts[5]?.trim(),
                parentPhone: parts[6]?.trim() || '0000000000',
                totalFee: Number(parts[7]) || 20000,
                academicYear: '2024-25', // Default assumption
                isActive: true
            };

            if (!studentData.name) continue;

            const exists = await Student.findOne({ name: studentData.name, class: studentData.class });
            if (!exists) {
                await Student.create(studentData);
                imported++;
            }
        }
        console.log(`✅ Total Students Imported from students.csv: ${imported}`);

        // 2. ALSO RE-CREATE from CREATE_STUDENT logs (for those not in CSV)
        console.log('--- CHECKING CREATE_STUDENT LOGS FOR MISSING STUDENTS ---');
        const createLogs = await ActivityLog.find({ action: 'CREATE_STUDENT' }).sort({ createdAt: 1 });
        let manualCount = 0;
        for (const log of createLogs) {
            if (!log.newData) continue;
            const sData = log.newData;
            const exists = await Student.findOne({ name: sData.name, class: sData.class });
            if (!exists) {
                delete sData._id;
                delete sData.userId;
                delete sData.feePayments;
                await Student.create(sData);
                manualCount++;
            }
        }
        console.log(`✅ Re-created from logs: ${manualCount}`);

        // 3. RESTORE FEES FROM LOGS
        console.log('\n--- RESTORING FEE PAYMENTS FROM LOGS ---');
        const paymentLogs = await ActivityLog.find({
            action: { $in: ['RECORD_PAYMENT', 'EDIT_PAYMENT'] }
        }).sort({ createdAt: 1 });

        console.log(`Analyzing ${paymentLogs.length} payment logs...`);

        let restored = 0;
        let failed = 0;

        for (const log of paymentLogs) {
            const match = log.description.match(/Recorded payment of [\d.]+ for (.*?) \(Receipt: /) ||
                log.description.match(/Edited payment for (.*?) \(Receipt: /);

            if (!match) continue;

            const studentName = match[1].trim();
            const paymentData = log.newData;
            if (!paymentData) continue;

            const student = await Student.findOne({
                name: { $regex: new RegExp(`^${studentName}$`, 'i') }
            });

            if (!student) {
                console.log(`❌ Student still NOT found: "${studentName}"`);
                failed++;
                continue;
            }

            const exists = student.feePayments.find(p => p.receiptNo === paymentData.receiptNo);
            if (!exists) {
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
                restored++;
            } else if (log.action === 'EDIT_PAYMENT') {
                // Update existing payment
                const pIndex = student.feePayments.findIndex(p => p.receiptNo === paymentData.receiptNo);
                student.feePayments[pIndex] = {
                    ...student.feePayments[pIndex],
                    ...paymentData
                };
                await student.save();
                restored++;
            }
        }
        console.log(`✅ FEE PAYMENTS RESTORED: ${restored}`);
        console.log(`❌ STILL FAILED: ${failed}`);

        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

startRecovery();
