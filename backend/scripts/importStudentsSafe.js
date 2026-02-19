require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_fee_management';

// Fee Structure Data (for calculating total fee)
const feeStructures = [
    { class: 'Nursery', tuitionFee: 15000, admissionFee: 5000, examFee: 1000, libraryFee: 500, sportsFee: 1000, miscFee: 500 },
    { class: 'LKG', tuitionFee: 16000, admissionFee: 5000, examFee: 1000, libraryFee: 500, sportsFee: 1000, miscFee: 500 },
    { class: 'UKG', tuitionFee: 17000, admissionFee: 5000, examFee: 1000, libraryFee: 500, sportsFee: 1000, miscFee: 500 },
    { class: '1st', tuitionFee: 20000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '2nd', tuitionFee: 21000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '3rd', tuitionFee: 22000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '4th', tuitionFee: 23000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '5th', tuitionFee: 25000, admissionFee: 4000, examFee: 2000, libraryFee: 1500, sportsFee: 2000, miscFee: 1500 },
    { class: '6th', tuitionFee: 27000, admissionFee: 4000, examFee: 2000, libraryFee: 1500, sportsFee: 2000, miscFee: 1500 },
    { class: '7th', tuitionFee: 28000, admissionFee: 4000, examFee: 2000, libraryFee: 1500, sportsFee: 2000, miscFee: 1500 },
    { class: '8th', tuitionFee: 30000, admissionFee: 4000, examFee: 2500, libraryFee: 2000, sportsFee: 2500, miscFee: 2000 },
    { class: '9th', tuitionFee: 35000, admissionFee: 4000, examFee: 2500, libraryFee: 2000, sportsFee: 2500, miscFee: 2000 },
    { class: '10th', tuitionFee: 40000, admissionFee: 4000, examFee: 3000, libraryFee: 2000, sportsFee: 2500, miscFee: 2500 },
];

function getTotalFeeForClass(cls) {
    const fs = feeStructures.find(f => f.class === cls);
    if (!fs) return 20000;
    return (fs.tuitionFee || 0) + (fs.admissionFee || 0) + (fs.examFee || 0) +
        (fs.libraryFee || 0) + (fs.sportsFee || 0) + (fs.miscFee || 0);
}

const CSV_CLASS_MAP = {
    'Nursery.csv': 'Nursery',
    'LKG.csv': 'LKG',
    'UKG.csv': 'UKG',
    '1st.csv': '1st',
    '2nd.csv': '2nd',
    '3rd.csv': '3rd',
    '4thh.csv': '4th',
    '5th.csv': '5th',
    '6th.csv': '6th',
    '7th.csv': '7th',
    '8th.csv': '8th',
    '9th.csv': '9th',
    '10th.csv': '10th'
};

function parseCSVLine(line, className) {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (trimmed.toLowerCase().startsWith('s.no') || trimmed.toLowerCase().startsWith('sno')) return null;

    // Strip HTML comments logic (same as seedData.js)
    const cleanLine = trimmed.replace(/<!--.*?-->/g, '').trim();
    if (!cleanLine) return null;

    const parts = cleanLine.split(',');
    if (parts.length < 2) return null;

    const rollNo = parts[0]?.trim();
    const name = parts[1]?.trim();
    const fatherName = parts[2]?.trim() || '';
    let phone = parts[3]?.trim() || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.length > 10) phone = phone.slice(-10);

    if (!rollNo || !name || isNaN(Number(rollNo))) return null;

    return {
        rollNo: String(rollNo),
        name,
        parentName: fatherName || 'Parent of ' + name,
        parentPhone: phone || '0000000000',
        class: className,
        section: 'A',
        totalFee: getTotalFeeForClass(className),
        academicYear: '2024-25',
        gender: 'male',
        isActive: true
    };
}

async function importStudents() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const studentsDir = path.join(__dirname, '../../Students');
        if (!fs.existsSync(studentsDir)) {
            console.error(`❌ Students folder not found at: ${studentsDir}`);
            process.exit(1);
        }

        const files = fs.readdirSync(studentsDir);
        let totalImported = 0;

        for (const file of files) {
            if (!file.endsWith('.csv')) continue;
            const className = CSV_CLASS_MAP[file];
            if (!className) {
                console.warn(`⚠️  Skipping ${file}: No class mapping`);
                continue;
            }

            const filePath = path.join(studentsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split(/\r?\n/);

            let fileCount = 0;
            for (const line of lines) {
                const studentData = parseCSVLine(line, className);
                if (studentData) {
                    // Update if exists (by rollNo + class), else Insert
                    await Student.findOneAndUpdate(
                        { rollNo: studentData.rollNo, class: studentData.class },
                        studentData,
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    fileCount++;
                }
            }
            console.log(`  📄 ${className}: Processed ${fileCount} records`);
            totalImported += fileCount;
        }

        console.log(`\n✅ Import complete! Total processed: ${totalImported}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Import failed:', err);
        process.exit(1);
    }
}

importStudents();
