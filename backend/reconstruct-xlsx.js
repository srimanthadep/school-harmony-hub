const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

// Models
const Student = require('./models/Student');
const FeeStructure = require('./models/FeeStructure');

/**
 * CONFIGURATION & FLAGS
 */
const DRY_RUN = process.argv.includes('--dry-run');
const ALLOW_PROD = process.argv.includes('--allow-prod');
const BACKUP_DIR = path.join(__dirname, '../backup');
const ACTIVITY_CSV = path.join(BACKUP_DIR, 'activity-logs.csv');

// Class Normalization Map
const CLASS_NAME_MAP = {
    'nursary': 'Nursery',
    'nursery': 'Nursery',
    'lkg': 'LKG',
    'ukg': 'UKG',
    '1st': '1st', 'i': '1st', '1': '1st',
    '2nd': '2nd', 'ii': '2nd', '2': '2nd',
    '3rd': '3rd', 'iii': '3rd', '3': '3rd',
    '4th': '4th', 'iv': '4th', '4thh': '4th', '4': '4th',
    '5th': '5th', 'v': '5th', '5': '5th',
    '6th': '6th', 'vi': '6th', '6': '6th',
    '7th': '7th', 'vii': '7th', '7': '7th',
    '8th': '8th', 'viii': '8th', '8': '8th',
    '9th': '9th', 'ix': '9th', '9': '9th',
    '10th': '10th', 'x': '10th', '10': '10th'
};

async function reconstruct() {
    console.log('🚀 Starting Full Master Data Reconstruction (XLSX + Activity Log)...');

    if (process.env.NODE_ENV === 'production' && !ALLOW_PROD) {
        console.error('❌ ERROR: This script is restricted in production. Use --allow-prod to override.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const studentMap = new Map(); // Key: name|class
        const feeStructures = [];
        const stats = {
            feeStructuresProcessed: 0,
            studentsFromExcel: 0,
            logDiscovered: 0,
            logUpdated: 0,
            logDeleted: 0,
            paymentsAdded: 0,
            paymentsDeleted: 0,
            paymentsEdited: 0,
            failedLinks: 0
        };

        // --- 1. PROCESS XLSX FILES (Master List & Fee Structure) ---
        console.log('📄 Step 1: Processing XLSX master files...');
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.xlsx'));

        for (const file of files) {
            const filePath = path.join(BACKUP_DIR, file);
            console.log(`   📂 Reading ${file}...`);

            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Row 1 contains class and fee: e.g. ["Class - 1st Rs: 12500"]
            const feeRow = data[1] && data[1][0] ? data[1][0].toString() : '';
            const feeMatch = feeRow.match(/(?:Class\s*-\s*)?([\w\d\s]+)\s+Rs:\s+(\d+)/i);

            let className = file.replace('.xlsx', '').toLowerCase().trim();
            let tuitionFeeAmount = 0;

            if (feeMatch) {
                className = feeMatch[1].trim().toLowerCase();
                tuitionFeeAmount = parseInt(feeMatch[2]);
            }

            // Normalize Class Name (remove "class" suffix if present)
            className = className.replace(/\bclass\b/g, '').trim();
            const normalizedClass = CLASS_NAME_MAP[className] || className.charAt(0).toUpperCase() + className.slice(1);

            // Collect Fee Structure (Deduplicate by class)
            if (!feeStructures.find(f => f.class === normalizedClass)) {
                feeStructures.push({
                    class: normalizedClass,
                    tuitionFee: tuitionFeeAmount,
                    academicYear: '2025-26'
                });
                stats.feeStructuresProcessed++;
            }

            // Process Student Rows (Starting Row 3)
            for (let i = 3; i < data.length; i++) {
                const row = data[i];
                const name = row[1] ? row[1].toString().trim() : null;
                if (!name) continue;

                const key = `${name.toLowerCase()}|${normalizedClass.toLowerCase()}`;
                studentMap.set(key, {
                    name: name,
                    class: normalizedClass,
                    rollNo: row[0] ? row[0].toString() : '0',
                    parentName: row[2] ? row[2].toString().trim() : 'Parent',
                    parentPhone: row[3] ? row[3].toString().replace(/[^0-9]/g, '') : '0000000000',
                    totalFee: tuitionFeeAmount,
                    feePayments: [],
                    academicYear: '2025-26',
                    isActive: true
                });
                stats.studentsFromExcel++;
            }
        }

        // --- 2. PROCESS ACTIVITY LOG (Full Lifecycle Reconciliation) ---
        console.log('📄 Step 2: Reconciling with Activity Log (Lifecycle events)...');
        if (fs.existsSync(ACTIVITY_CSV)) {
            const activityRaw = fs.readFileSync(ACTIVITY_CSV, 'utf-8');
            const logs = parse(activityRaw, { columns: true, skip_empty_lines: true, trim: true });

            // Process logs in CHRONOLOGICAL order (bottom to top of CSV usually)
            const sortedLogs = [...logs].reverse();

            for (const log of sortedLogs) {
                const Action = log.Action;
                const Description = log.Description;
                const NewData = log['New Data'];
                const OldData = log['Old Data'];

                // Student Creations/Updates
                if (Action === 'CREATE_STUDENT' || Action === 'UPDATE_STUDENT') {
                    try {
                        const data = JSON.parse(NewData || '{}');
                        if (data.name && data.class) {
                            let rawCls = data.class.toLowerCase().replace(/\bclass\b/g, '').trim();
                            const normalizedCls = CLASS_NAME_MAP[rawCls] || data.class;
                            const key = `${data.name.toLowerCase()}|${normalizedCls.toLowerCase()}`;

                            if (studentMap.has(key)) {
                                Object.assign(studentMap.get(key), data);
                                stats.logUpdated++;
                            } else {
                                studentMap.set(key, { ...data, class: normalizedCls, feePayments: [], isActive: true });
                                stats.logDiscovered++;
                            }
                        }
                    } catch (e) { }
                }

                // Student Deletions
                if (Action === 'DELETE_STUDENT') {
                    // Description usually contains name: "Archived student: Name" or "Deleted student: Name"
                    const nameMatch = Description.match(/(?:Deleted|Archived) student:\s*(.*)/i);
                    const nameToDelete = nameMatch ? nameMatch[1].trim().toLowerCase() : null;
                    if (nameToDelete) {
                        for (const [key, student] of studentMap) {
                            if (student.name.toLowerCase() === nameToDelete) {
                                studentMap.delete(key);
                                stats.logDeleted++;
                                break;
                            }
                        }
                    }
                }

                if (Action === 'BULK_DELETE_STUDENTS') {
                    try {
                        const data = JSON.parse(OldData || '[]');
                        if (Array.isArray(data)) {
                            for (const s of data) {
                                if (s.name && s.class) {
                                    const key = `${s.name.toLowerCase()}|${s.class.toLowerCase()}`;
                                    studentMap.delete(key);
                                    stats.logDeleted++;
                                }
                            }
                        }
                    } catch (e) { }
                }

                // Payment Events
                if (Action === 'RECORD_PAYMENT') {
                    try {
                        const p = JSON.parse(NewData || '{}');
                        const match = Description.match(/for (.*?) \(#|for (.*?) \(Receipt:/);
                        const stuName = (match ? (match[1] || match[2]) : '').trim().toLowerCase();

                        if (stuName && p.amount) {
                            let linked = false;
                            for (const student of studentMap.values()) {
                                if (student.name.toLowerCase() === stuName) {
                                    // Deduplicate by receiptNo
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
            }
        }

        // --- 3. DATABASE EXECUTION ---
        if (!DRY_RUN) {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                console.log('🧹 Purging existing Students & FeeStructures...');
                await Student.deleteMany({}, { session });
                await FeeStructure.deleteMany({}, { session });

                console.log('📥 Batch Insert: Fee Structures...');
                for (const fsData of feeStructures) {
                    await FeeStructure.create([fsData], { session });
                }

                console.log(`📥 Batch Insert: ${studentMap.size} Reconciled Students...`);
                let currentCount = 1;
                for (const studentData of studentMap.values()) {
                    // Explicitly generate STU ID to match sequence
                    studentData.studentId = `STU${String(currentCount).padStart(4, '0')}`;
                    await Student.create([studentData], { session });
                    currentCount++;
                }

                await session.commitTransaction();
                console.log('✅ DATABASE FULLY RESTORED & SYNCED');
            } catch (err) {
                await session.abortTransaction();
                console.error('❌ TRANSACTION FAILED:', err.message);
                throw err;
            } finally {
                session.endSession();
            }
        } else {
            console.log('🧪 DRY RUN COMPLETED - No changes written to DB.');
        }

        console.log('\n--- FINAL RECOVERY STATS ---');
        console.log(`Classes Processed:  ${stats.feeStructuresProcessed}`);
        console.log(`Total Students:     ${studentMap.size}`);
        console.log(`- From Master List: ${stats.studentsFromExcel}`);
        console.log(`- Discovered Log:   +${stats.logDiscovered}`);
        console.log(`- Updated Log:      ${stats.logUpdated} records`);
        console.log(`- Deleted from Log: -${stats.logDeleted}`);
        console.log(`Payments History:   ${Array.from(studentMap.values()).reduce((sum, s) => sum + s.feePayments.length, 0)} transactions`);
        console.log(`- Records Added:    +${stats.paymentsAdded}`);
        console.log(`- Records Edits:    ${stats.paymentsEdited}`);
        console.log(`- Records Removed:  -${stats.paymentsDeleted}`);
        if (stats.failedLinks > 0) console.log(`- Orphaned Logs:    ${stats.failedLinks} (Unknown students in history)`);
        console.log('----------------------------');

    } catch (err) {
        console.error('💥 CRITICAL ERROR:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

reconstruct();
