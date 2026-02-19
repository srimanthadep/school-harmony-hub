require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Settings = require('../models/Settings');
const FeeStructure = require('../models/FeeStructure');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_fee_management';

const feeStructures = [
    { class: 'Nursery', tuitionFee: 15000, admissionFee: 5000, examFee: 1000, libraryFee: 500, sportsFee: 1000, miscFee: 500 },
    { class: 'LKG',     tuitionFee: 16000, admissionFee: 5000, examFee: 1000, libraryFee: 500, sportsFee: 1000, miscFee: 500 },
    { class: 'UKG',     tuitionFee: 17000, admissionFee: 5000, examFee: 1000, libraryFee: 500, sportsFee: 1000, miscFee: 500 },
    { class: '1st',     tuitionFee: 20000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '2nd',     tuitionFee: 21000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '3rd',     tuitionFee: 22000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '4th',     tuitionFee: 23000, admissionFee: 4000, examFee: 1500, libraryFee: 1000, sportsFee: 1500, miscFee: 1000 },
    { class: '5th',     tuitionFee: 25000, admissionFee: 4000, examFee: 2000, libraryFee: 1500, sportsFee: 2000, miscFee: 1500 },
    { class: '6th',     tuitionFee: 27000, admissionFee: 4000, examFee: 2000, libraryFee: 1500, sportsFee: 2000, miscFee: 1500 },
    { class: '7th',     tuitionFee: 28000, admissionFee: 4000, examFee: 2000, libraryFee: 1500, sportsFee: 2000, miscFee: 1500 },
    { class: '8th',     tuitionFee: 30000, admissionFee: 4000, examFee: 2500, libraryFee: 2000, sportsFee: 2500, miscFee: 2000 },
    { class: '9th',     tuitionFee: 35000, admissionFee: 4000, examFee: 2500, libraryFee: 2000, sportsFee: 2500, miscFee: 2000 },
    { class: '10th',    tuitionFee: 40000, admissionFee: 4000, examFee: 3000, libraryFee: 2000, sportsFee: 2500, miscFee: 2500 },
];

// Staff data (same as before - no user logins created)
const staffData = [
    { name: 'Dr. Rajesh Kumar',   email: 'rajesh@oxfordschool.edu',  phone: '9876543210', role: 'principal',     monthlySalary: 75000, joiningDate: new Date('2010-06-01'), qualification: 'Ph.D Education',    experience: 20 },
    { name: 'Mrs. Sunita Sharma', email: 'sunita@oxfordschool.edu',  phone: '9876543211', role: 'vice_principal', subject: 'Science', monthlySalary: 55000, joiningDate: new Date('2012-07-15'), qualification: 'M.Sc, B.Ed', experience: 15 },
    { name: 'Mr. Amit Verma',     email: 'amit@oxfordschool.edu',    phone: '9876543212', role: 'teacher',        subject: 'Mathematics', monthlySalary: 35000, joiningDate: new Date('2015-06-01'), qualification: 'M.Sc Math, B.Ed', experience: 10 },
    { name: 'Mrs. Priya Patel',   email: 'priya@oxfordschool.edu',   phone: '9876543213', role: 'teacher',        subject: 'English', monthlySalary: 33000, joiningDate: new Date('2016-07-10'), qualification: 'M.A English, B.Ed', experience: 9 },
    { name: 'Mr. Ravi Singh',     email: 'ravi@oxfordschool.edu',    phone: '9876543214', role: 'teacher',        subject: 'Hindi', monthlySalary: 31000, joiningDate: new Date('2017-06-01'), qualification: 'M.A Hindi, B.Ed', experience: 8 },
];

// CSV file → class name mapping
const CSV_CLASS_MAP = {
    'Nursery.csv': 'Nursery',
    'LKG.csv':     'LKG',
    'UKG.csv':     'UKG',
    '1st.csv':     '1st',
    '2nd.csv':     '2nd',
    '3rd.csv':     '3rd',
    '4thh.csv':    '4th',   // note: typo in filename, maps to '4th'
    '5th.csv':     '5th',
    '6th.csv':     '6th',
    '7th.csv':     '7th',
};

// Fee per class (sum of all fees from feeStructures)
function getTotalFeeForClass(cls) {
    const fs = feeStructures.find(f => f.class === cls);
    if (!fs) return 20000;
    return (fs.tuitionFee || 0) + (fs.admissionFee || 0) + (fs.examFee || 0) +
           (fs.libraryFee || 0) + (fs.sportsFee || 0) + (fs.miscFee || 0);
}

// Parse a single CSV line: rollNo, name, fatherName, phone
function parseCSVLine(line, className) {
    // Skip header lines / HTML comment lines / empty lines
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (trimmed.toLowerCase().startsWith('s.no') || trimmed.toLowerCase().startsWith('sno')) return null;

    // Strip HTML comments like <!-- ... -->
    const cleanLine = trimmed.replace(/<!--.*?-->/g, '').trim();
    if (!cleanLine) return null;

    const parts = cleanLine.split(',');
    if (parts.length < 2) return null;

    const rollNo = parts[0]?.trim();
    const name = parts[1]?.trim();
    const fatherName = parts[2]?.trim() || '';
    // phone: could be in index 3 (standard) or index 3 for 7th grade
    let phone = parts[3]?.trim() || '';
    // Remove non-digit garbage but keep the number
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
        gender: 'male' // default; actual gender not in CSV
    };
}

// Load students from all CSVs in the Students folder
function loadStudentsFromCSVs(studentsDir) {
    const students = [];
    const files = fs.readdirSync(studentsDir);

    for (const file of files) {
        if (!file.endsWith('.csv')) continue;
        const className = CSV_CLASS_MAP[file];
        if (!className) {
            console.warn(`⚠️  No class mapping for file: ${file} — skipping`);
            continue;
        }

        const filePath = path.join(studentsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/);

        let count = 0;
        for (const line of lines) {
            const student = parseCSVLine(line, className);
            if (student) {
                students.push(student);
                count++;
            }
        }
        console.log(`  📄 ${file} → ${className}: ${count} students loaded`);
    }
    return students;
}

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear ALL existing data
        await Promise.all([
            User.deleteMany({}),
            Student.deleteMany({}),
            Staff.deleteMany({}),
            Settings.deleteMany({}),
            FeeStructure.deleteMany({})
        ]);
        console.log('🗑️  Cleared all existing data');

        // Create settings — Oxford School
        await Settings.create({
            schoolName: 'Oxford School',
            schoolAddress: 'Oxford Campus, Education Street - 500001',
            schoolPhone: '+91 98765 43210',
            schoolEmail: 'info@oxfordschool.edu.in',
            principalName: 'Dr. Rajesh Kumar',
            academicYear: '2024-25',
            currency: '₹',
            receiptPrefix: 'RCPT',
            salarySlipPrefix: 'SAL'
        });
        console.log('⚙️  Settings created (Oxford School)');

        // Create fee structures
        for (const fee of feeStructures) {
            await new FeeStructure(fee).save();
        }
        console.log('💰 Fee structures created');

        // Create ONLY admin user — no student/staff logins
        await User.create({
            name: 'School Admin',
            email: 'admin@school.edu',
            password: 'Admin@123',
            role: 'admin'
        });
        console.log('👤 Admin user created: admin@school.edu / Admin@123');

        // Create staff (NO user accounts — staff cannot login)
        let staffCount = 0;
        for (const s of staffData) {
            await Staff.create(s);
            staffCount++;
        }
        console.log(`👨‍🏫 ${staffCount} staff members created (no login accounts)`);

        // Load students from CSV files
        const studentsDir = path.join(__dirname, '../../Students');
        if (!fs.existsSync(studentsDir)) {
            console.warn(`⚠️  Students folder not found at: ${studentsDir}`);
            console.warn('   Please ensure the Students folder is at the project root.');
        } else {
            console.log(`\n📂 Loading students from: ${studentsDir}`);
            const studentRows = loadStudentsFromCSVs(studentsDir);

            let studentCount = 0;
            for (const s of studentRows) {
                // Auto-generate studentId will be handled by the model
                await Student.create(s);
                studentCount++;
            }
            console.log(`\n🧑‍🎓 ${studentCount} students imported from CSV files`);
        }

        console.log('\n✅ Seed complete!');
        console.log('================================');
        console.log('📋 Login Credentials:');
        console.log('  Admin: admin@school.edu / Admin@123');
        console.log('  (Staff and Student logins are DISABLED)');
        console.log('================================');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

seedData();
