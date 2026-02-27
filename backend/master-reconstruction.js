const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');
const Staff = require('./models/Staff');
const ActivityLog = require('./models/ActivityLog');

const BACKUP_DIR = 'C:\\Users\\srima\\Downloads\\school-fee-management\\backup';
const STAFF_CSV = path.join(BACKUP_DIR, 'staff.csv');
const ACTIVITY_CSV = path.join(BACKUP_DIR, 'activity-logs.csv');

const { protectProduction } = require('./utils/safety');

async function masterReconstruction() {
    await protectProduction();
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // 1. CLEAR COLLECTIONS
        console.log('🗑️  Clearing Students and Staff collections...');
        await Promise.all([
            Student.deleteMany({}),
            Staff.deleteMany({})
        ]);
        console.log('✅ Collections cleared.');

        // 2. RECONSTRUCT STAFF
        console.log('\n--- RECONSTRUCTING STAFF ---');
        if (fs.existsSync(STAFF_CSV)) {
            const csvContent = fs.readFileSync(STAFF_CSV, 'utf-8');
            const staffRows = parse(csvContent, { columns: true, skip_empty_lines: true });

            let staffCount = 0;
            for (const row of staffRows) {
                // CSV Mapping: Staff ID,Name,Role,Phone,Monthly Salary,Total Paid,Session,Joined,Status
                const monthlySalary = Number(row['Monthly Salary']) || 0;
                const totalPaid = Number(row['Total Paid']) || 0;

                const salaryPayments = [];
                if (monthlySalary > 0 && totalPaid > 0) {
                    const monthsCount = Math.floor(totalPaid / monthlySalary);

                    // Generate payments going backwards from January 2026
                    const startDate = new Date('2026-02-01');
                    for (let i = 0; i < monthsCount; i++) {
                        const payDate = new Date(startDate);
                        payDate.setMonth(startDate.getMonth() - (i + 1));

                        const monthLabel = payDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                        salaryPayments.push({
                            month: monthLabel,
                            baseAmount: monthlySalary,
                            amount: monthlySalary,
                            paymentDate: payDate,
                            paymentMode: 'cash',
                            slipNo: `SLIP-${row['Staff ID']}-${i + 1}`,
                            remarks: 'Imported from backup'
                        });
                    }
                }

                const staffData = {
                    staffId: row['Staff ID'],
                    name: row['Name'],
                    role: (row['Role'] || 'teacher').toLowerCase(),
                    phone: row['Phone'] ? String(row['Phone']).trim() : '0000000000',
                    monthlySalary: monthlySalary,
                    academicYear: row['Session'] || '2025-26',
                    joiningDate: row['Joined'] ? new Date(row['Joined']) : new Date(),
                    isActive: row['Status'] === 'ACTIVE',
                    salaryPayments: salaryPayments
                };

                if (staffData.name) {
                    await Staff.create(staffData);
                    staffCount++;
                }
            }
            console.log(`✅ Imported ${staffCount} Staff members with salary reconstruction.`);
        } else {
            console.log('⚠️  Staff CSV file not found!');
        }

        // 3. RECONSTRUCT STUDENTS
        console.log('\n--- RECONSTRUCTING STUDENTS ---');
        const studentFiles = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.xlsx'));
        let studentCount = 0;

        const fileNameMap = {
            'I.xlsx': '1st',
            'II.xlsx': '2nd',
            'III.xlsx': '3rd',
            'IV.xlsx': '4th',
            'V.xlsx': '5th',
            'VI.xlsx': '6th',
            'VII.xlsx': '7th',
            'VIII.xlsx': '8th',
            'IX.xlsx': '9th',
            'X.xlsx': '10th',
            'Nursary.xlsx': 'Nursery',
            'LKG.xlsx': 'LKG',
            'UKG.xlsx': 'UKG'
        };

        for (const file of studentFiles) {
            const filePath = path.join(BACKUP_DIR, file);
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            // Expected Class based on mapping
            const className = fileNameMap[file] || file.replace('.xlsx', '');

            if (!['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].includes(className)) {
                console.log(`⚠️  Skipping file with unknown class: ${file} (Mapped to: ${className})`);
                continue;
            }

            // EXTRACT FEE FROM TOP ROW (Row 2)
            let classFee = 20000; // Default fallback
            const feeRow = rawData[1];
            if (feeRow && feeRow[0]) {
                const feeString = String(feeRow[0]);
                const feeMatch = feeString.match(/Rs:\s*(\d+)/i);
                if (feeMatch) {
                    classFee = Number(feeMatch[1]);
                    console.log(`💰 Detected fee for ${className}: ${classFee}`);
                }
            }

            // Find start of data (skip header rows)
            for (let i = 3; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length < 2) continue;

                // Roll number is at index 0, Name is at index 1
                const rollNo = String(row[0] || '').trim();
                const name = String(row[1] || '').trim();

                if (!rollNo || !name || isNaN(Number(rollNo))) {
                    // Skip if rollNo is not a number (might be a footer or subheader)
                    continue;
                }

                const studentData = {
                    rollNo: rollNo,
                    name: name,
                    parentName: String(row[2] || 'Parent').trim(),
                    parentPhone: String(row[3] || '0000000000').replace(/[^0-9]/g, '').slice(-10),
                    class: className,
                    totalFee: classFee,
                    academicYear: '2025-26',
                    feePayments: []
                };

                // Deduplicate within same class
                const exists = await Student.findOne({ name: studentData.name, class: studentData.class, academicYear: '2025-26' });
                if (!exists) {
                    await Student.create(studentData);
                    studentCount++;
                }
            }
            console.log(`Loaded: ${file}`);
        }
        console.log(`✅ Total Students Imported: ${studentCount}`);

        // 3.5 RECONSTRUCT MANUALLY ADDED STUDENTS FROM LOGS
        console.log('\n--- RECONSTRUCTING MANUALLY ADDED STUDENTS FROM LOGS ---');
        let manualCount = 0;
        if (fs.existsSync(ACTIVITY_CSV)) {
            const csvContent = fs.readFileSync(ACTIVITY_CSV, 'utf-8');
            const logs = parse(csvContent, { columns: true });

            // First pass: CREATE_STUDENT logs
            for (const log of logs) {
                if (log.Action !== 'CREATE_STUDENT') continue;
                const match = log.Description.match(/Added new student: (.*)/);
                if (match) {
                    const name = match[1].trim();
                    const exists = await Student.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
                    if (!exists) {
                        let studentData = { name, rollNo: 'MANUAL', class: 'Nursery', parentName: 'Parent', parentPhone: '0000000000', totalFee: 15000, academicYear: '2025-26' };
                        const dbLog = await ActivityLog.findOne({ createdAt: new Date(log.Timestamp), action: 'CREATE_STUDENT' });
                        if (dbLog && dbLog.newData) studentData = { ...studentData, ...dbLog.newData };
                        await Student.create(studentData);
                        manualCount++;
                    }
                }
            }

            // Second pass: RECORD_PAYMENT logs for missing names
            for (const log of logs) {
                if (log.Action !== 'RECORD_PAYMENT' && log.Action !== 'EDIT_PAYMENT') continue;
                const match = log.Description.match(/Recorded payment of [\d.]+ for (.*?) \(Receipt: /) ||
                    log.Description.match(/Edited payment for (.*?) \(Receipt: /);
                if (match) {
                    const name = match[1].trim();
                    if (name.toLowerCase().includes('test')) continue;
                    const exists = await Student.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
                    if (!exists) {
                        await Student.create({
                            name, rollNo: 'LOG-REC', class: 'Nursery', parentName: 'Parent (Recovered)',
                            parentPhone: '0000000000', totalFee: 15000, academicYear: '2025-26'
                        });
                        manualCount++;
                    }
                }
            }
        }
        console.log(`✅ Manually Added Students Restored: ${manualCount}`);
        studentCount += manualCount;
        console.log(`✅ Updated Total Students: ${studentCount}`);

        // 4. RESTORE FEE PAYMENTS FROM BACKUP CSV
        console.log('\n--- RESTORING FEE PAYMENTS FROM BACKUP LOGS ---');
        if (fs.existsSync(ACTIVITY_CSV)) {
            const csvContent = fs.readFileSync(ACTIVITY_CSV, 'utf-8');
            const logs = parse(csvContent, { columns: true });

            let restored = 0;
            let failed = 0;

            // Sort by timestamp to ensure sequence
            const sortedLogs = logs.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));

            for (const log of sortedLogs) {
                if (log.Action !== 'RECORD_PAYMENT' && log.Action !== 'EDIT_PAYMENT') continue;

                const match = log.Description.match(/Recorded payment of [\d.]+ for (.*?) \(Receipt: /) ||
                    log.Description.match(/Edited payment for (.*?) \(Receipt: /);

                if (!match) continue;

                const studentName = match[1].trim();
                const student = await Student.findOne({
                    name: { $regex: new RegExp(`^${studentName}$`, 'i') },
                    academicYear: '2025-26'
                });

                if (!student) {
                    failed++;
                    continue;
                }

                // Since we starting fresh, we need a way to find what payment data was recorded.
                // The logs CSV doesn't have the 'newData' JSON, but we can try to find it in the original DB if it's still there.
                // WAIT! I should check if the ActivityLog collection in Atlas still has the metadata.
                // If not, I'll have to parse what I can from the description.

                // Let's see if we can get the newData from the Atlas collection for this timestamp
                const dbLog = await ActivityLog.findOne({ createdAt: new Date(log.Timestamp), action: log.Action });

                if (dbLog && dbLog.newData) {
                    const paymentData = dbLog.newData;
                    const exists = student.feePayments.find(p => p.receiptNo === paymentData.receiptNo);

                    if (!exists) {
                        student.feePayments.push({
                            amount: paymentData.amount,
                            paymentDate: paymentData.paymentDate || dbLog.createdAt,
                            paymentMode: paymentData.paymentMode || 'cash',
                            feeType: paymentData.feeType || 'tuition',
                            receiptNo: paymentData.receiptNo,
                            remarks: paymentData.remarks,
                            recordedBy: paymentData.recordedBy
                        });
                        await student.save();
                        restored++;
                    }
                } else {
                    // Fallback to basic parsing from description if metadata is missing
                    // "Recorded payment of 4000 for Siddarth N (Receipt: RCPT1233)"
                    const descMatch = log.Description.match(/Recorded payment of ([\d.]+) for (.*?) \(Receipt: (.*?)\)/);
                    if (descMatch) {
                        const amount = Number(descMatch[1]);
                        const receiptNo = descMatch[3];
                        const exists = student.feePayments.find(p => p.receiptNo === receiptNo);
                        if (!exists) {
                            student.feePayments.push({
                                amount,
                                paymentDate: new Date(log.Timestamp),
                                paymentMode: 'cash', // Fallback
                                feeType: 'tuition',
                                receiptNo,
                                recordedBy: '699831fc58abfe3f9f50f03c' // Original admin id usually
                            });
                            await student.save();
                            restored++;
                        }
                    }
                }
            }
            console.log(`✅ FEE PAYMENTS RESTORED: ${restored}`);
            console.log(`❌ FAILURES (Student not matched): ${failed}`);
        }

        console.log('\n🌟 DATABASE RECONSTRUCTION COMPLETE 🌟');
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

masterReconstruction();
