const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const Student = require('./models/Student');

const DRY_RUN = process.argv.includes('--dry-run');
const ALLOW_PROD = process.argv.includes('--allow-prod');
const STUDENTS_CSV = path.join(__dirname, '../backup/Students_List.csv');
const ACTIVITY_CSV = path.join(__dirname, '../backup/activity-logs.csv');

async function reconstruct() {
    console.log('--- RECONSTRUCTION START ---');
    if (DRY_RUN) console.log('🧪 DRY RUN MODE ENABLED');

    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. MASTER LIST
        console.log('Reading Master List...');
        const masterRaw = fs.readFileSync(STUDENTS_CSV, 'utf-8');
        const masterRows = parse(masterRaw, { columns: true, skip_empty_lines: true, trim: true, bom: true });

        const studentMap = new Map(); // Key: name|class
        let masterProcessed = 0;

        for (const row of masterRows) {
            const name = (row.Name || row.name || '').trim();
            let cls = (row.Class || row.class || '').trim();
            if (!name || !cls) continue;

            if (cls.toLowerCase() === 'nursary') cls = 'Nursery';
            if (cls.toLowerCase() === '4thh') cls = '4th';

            // Map numerical strings to ordinal strings for schema compliance
            const classMap = {
                '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th',
                '6': '6th', '7': '7th', '8': '8th', '9': '9th', '10': '10th'
            };
            if (classMap[cls]) cls = classMap[cls];

            const key = `${name.toLowerCase()}|${cls.toLowerCase()}`;
            studentMap.set(key, {
                name: name,
                class: cls,
                rollNo: row['Roll No'] || row.rollNo || row['Roll No '] || '0',
                parentName: row.Parent || row.parentName || 'Parent',
                parentPhone: '0000000000',
                totalFee: parseInt((row['Tuition Fee'] || row.totalFee || '0').toString().replace(/[^0-9]/g, '')) || 0,
                feePayments: [],
                academicYear: '2025-26',
                isActive: true
            });
            masterProcessed++;
        }
        console.log(`✅ Master List: ${masterProcessed} students loaded.`);

        // 2. ACTIVITY LOG
        console.log('Reading Activity Log...');
        const activityRaw = fs.readFileSync(ACTIVITY_CSV, 'utf-8');
        const activityRows = parse(activityRaw, { columns: true, skip_empty_lines: true, trim: true });

        // Statistics
        const stats = {
            discovered: 0,
            updated: 0,
            paymentsAdded: 0,
            paymentsDeleted: 0,
            paymentsEdited: 0,
            failedLinks: 0
        };

        // Process logs in chronological order (bottom to top)
        const sortedLogs = [...activityRows].reverse();

        for (const log of sortedLogs) {
            const Action = log.Action;
            const Description = log.Description;
            const NewData = log['New Data'];
            const OldData = log['Old Data'];

            // STUDENT UPDATES
            if (Action === 'CREATE_STUDENT' || Action === 'UPDATE_STUDENT') {
                try {
                    const data = JSON.parse(NewData || '{}');
                    if (data.name && data.class) {
                        if (data.class.toLowerCase() === 'nursary') data.class = 'Nursery';

                        const classMap = {
                            '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th',
                            '6': '6th', '7': '7th', '8': '8th', '9': '9th', '10': '10th'
                        };
                        if (classMap[data.class]) data.class = classMap[data.class];

                        const key = `${data.name.toLowerCase()}|${data.class.toLowerCase()}`;

                        if (studentMap.has(key)) {
                            // Merge updates from log (which are usually more detailed like Phone #s)
                            Object.assign(studentMap.get(key), data);
                            stats.updated++;
                        } else {
                            studentMap.set(key, { ...data, feePayments: [], isActive: true });
                            stats.discovered++;
                        }
                    }
                } catch (e) { }
            }

            // PAYMENT RECORDED
            if (Action === 'RECORD_PAYMENT') {
                try {
                    const p = JSON.parse(NewData || '{}');
                    // Find student name from description "Recorded payment... for Name (Receipt..."
                    const match = Description.match(/for (.*?) \(#|for (.*?) \(Receipt:/);
                    const name = (match ? (match[1] || match[2]) : '').trim().toLowerCase();

                    if (name && p.amount) {
                        let linked = false;
                        for (const [key, student] of studentMap) {
                            if (student.name.toLowerCase() === name) {
                                // Prevent duplicate receiptNo in same student
                                if (!student.feePayments.find(fp => fp.receiptNo === p.receiptNo)) {
                                    student.feePayments.push(p);
                                    stats.paymentsAdded++;
                                }
                                linked = true;
                                break;
                            }
                        }
                        if (!linked) stats.failedLinks++;
                    }
                } catch (e) { }
            }

            // PAYMENT DELETED
            if (Action === 'DELETE_PAYMENT') {
                try {
                    const p = JSON.parse(OldData || '{}');
                    if (p.receiptNo) {
                        for (const student of studentMap.values()) {
                            const idx = student.feePayments.findIndex(fp => fp.receiptNo === p.receiptNo);
                            if (idx !== -1) {
                                student.feePayments.splice(idx, 1);
                                stats.paymentsDeleted++;
                                break;
                            }
                        }
                    }
                } catch (e) { }
            }

            // PAYMENT EDITED
            if (Action === 'EDIT_PAYMENT') {
                try {
                    const updatedPayment = JSON.parse(NewData || '{}');
                    if (updatedPayment.receiptNo) {
                        for (const student of studentMap.values()) {
                            const idx = student.feePayments.findIndex(fp => fp.receiptNo === updatedPayment.receiptNo);
                            if (idx !== -1) {
                                student.feePayments[idx] = { ...student.feePayments[idx], ...updatedPayment };
                                stats.paymentsEdited++;
                                break;
                            }
                        }
                    }
                } catch (e) { }
            }
        }

        // 3. DATABASE EXECUTION
        if (!DRY_RUN) {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                console.log('🧹 Purging student collection...');
                await Student.deleteMany({}, { session });

                console.log(`📥 Syncing ${studentMap.size} records to database...`);
                let currentCount = 1;
                for (const studentData of studentMap.values()) {
                    // Assign a clear, unique studentId manually to bypass pre-save count lookup issues
                    studentData.studentId = `STU${String(currentCount).padStart(4, '0')}`;
                    await Student.create([studentData], { session });
                    currentCount++;
                }

                await session.commitTransaction();
                console.log('✅ RECONSTRUCTION SUCCESSFUL');
            } catch (err) {
                await session.abortTransaction();
                console.error('❌ TRANSACTION FAILED:', err.message);
                throw err;
            } finally {
                session.endSession();
            }
        } else {
            console.log('🧪 DRY RUN COMPLETED - NO DATABASE WRITES.');
        }

        console.log('\n--- DATA RECONCILIATION SUMMARY ---');
        console.log(`Total Students:    ${studentMap.size}`);
        console.log(`- Master List:     ${masterProcessed}`);
        console.log(`- Discovery:       +${stats.discovered}`);
        console.log(`- Log Updates:      ${stats.updated} applied`);
        console.log(`Total Payments:    ${Array.from(studentMap.values()).reduce((sum, s) => sum + s.feePayments.length, 0)}`);
        console.log(`- Recorded:        +${stats.paymentsAdded}`);
        console.log(`- Deleted:         -${stats.paymentsDeleted}`);
        console.log(`- Modified:         ${stats.paymentsEdited}`);
        if (stats.failedLinks > 0) console.log(`- Orphaned:        ${stats.failedLinks} (Unknown students)`);
        console.log('------------------------------------');

    } catch (error) {
        console.error('💥 ERROR during reconstruction:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

reconstruct();
