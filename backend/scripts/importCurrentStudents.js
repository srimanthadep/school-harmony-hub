const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const User = require('../models/User');

const classMap = {
    'Nursary.xlsx': 'Nursery',
    'LKG.xlsx': 'LKG',
    'UKG.xlsx': 'UKG',
    'I.xlsx': '1st',
    'II.xlsx': '2nd',
    'III.xlsx': '3rd',
    'IV.xlsx': '4th',
    'V.xlsx': '5th',
    'VI.xlsx': '6th',
    'VII.xlsx': '7th',
    'VIII.xlsx': '8th',
    'IX.xlsx': '9th',
    'X.xlsx': '10th'
};

async function importData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Clear all existing typical students via logic
        await Student.deleteMany({});
        await FeeStructure.deleteMany({});
        console.log('Cleared existing students and fee structures');

        const studentsDir = path.join(__dirname, '../../Students');
        const files = fs.readdirSync(studentsDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));

        let totalSaved = 0;

        for (const file of files) {
            const mappedClass = classMap[file];
            if (!mappedClass) {
                console.log(`Skipping unknown file: ${file}`);
                continue;
            }

            const filePath = path.join(studentsDir, file);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

            if (data.length < 3) continue;

            // Extract Fee
            // e.g., "I CLASS Rs: 12000" usually row 1
            let classFee = 0;
            const feeRow = data[1] && data[1][0] ? data[1][0].toString() : '';
            const feeMatch = feeRow.match(/Rs:\s*(\d+)/i);
            if (feeMatch) {
                classFee = parseInt(feeMatch[1], 10);
            }

            console.log(`Class: ${mappedClass} | Fee Extracted: ${classFee}`);

            // Insert FeeStructure
            await FeeStructure.create({
                class: mappedClass,
                academicYear: '2024-25',
                tuitionFee: classFee,
                totalFee: classFee
            });

            // Parse Students from row 3 downwards
            // the header is at row 2
            for (let i = 3; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

                const sno = row[0];
                const name = row[1];
                const fName = row[2] || 'Not Provided';
                let cell = row[3] || '9999999999';

                // Ensure name exists
                if (!name) continue;

                // Create student record
                await Student.create({
                    name: String(name).trim(),
                    class: mappedClass,
                    rollNo: String(sno),
                    parentName: String(fName).trim(),
                    parentPhone: String(cell).substring(0, 10),
                    totalFee: classFee
                });
                totalSaved++;
            }
        }

        console.log(`Successfully imported ${totalSaved} students and updated fee structures!`);
        process.exit(0);
    } catch (err) {
        console.error('Error importing:', err);
        process.exit(1);
    }
}

importData();
