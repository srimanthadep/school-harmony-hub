const Student = require('../models/Student');
const User = require('../models/User');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const DeletedRecord = require('../models/DeletedRecord');
const asyncHandler = require('../utils/asyncHandler');
const { studentSchema } = require('../validations/studentValidation');
const _ = require('lodash');

// @desc    Get all students
// @route   GET /api/students
exports.getStudents = asyncHandler(async (req, res) => {
    const { class: cls, academicYear, search, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };

    if (cls) query.class = cls;
    if (academicYear) query.academicYear = academicYear;

    if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedSearch, 'i');
        query.$or = [
            { name: searchRegex },
            { parentName: searchRegex },
            { studentId: searchRegex },
            { parentPhone: searchRegex }
        ];
    }

    const students = await Student.find(query)
        .sort({ class: 1, rollNo: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Student.countDocuments(query);

    res.json({
        success: true,
        count: students.length,
        total,
        pages: Math.ceil(total / limit),
        students
    });
});

// @desc    Get single student
exports.getStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    if (req.user.role === 'student' && student.userId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Access denied');
    }

    res.json({ success: true, student });
});

// @desc    Create student
exports.createStudent = asyncHandler(async (req, res) => {
    // Validate with Zod
    const validatedData = studentSchema.parse(req.body);

    const student = await Student.create(validatedData);

    // Activity Log
    await ActivityLog.create({
        action: 'CREATE_STUDENT',
        module: 'STUDENTS',
        description: `Added new student: ${student.name}`,
        performedBy: req.user.id,
        targetId: student._id,
        newData: student.toObject()
    });

    if (validatedData.parentEmail) {
        const defaultPassword = `${student.name.split(' ')[0].toLowerCase()}@${student.studentId}`;
        const user = await User.create({
            name: student.name,
            email: validatedData.parentEmail,
            password: defaultPassword,
            role: 'student',
            profileId: student._id,
            profileModel: 'Student'
        });
        student.userId = user._id;
        await student.save();
    }

    res.status(201).json({
        success: true,
        message: 'Student added successfully',
        student
    });
});

// @desc    Update student
exports.updateStudent = asyncHandler(async (req, res) => {
    const oldStudent = await Student.findById(req.params.id);
    if (!oldStudent) {
        res.status(404);
        throw new Error('Student not found');
    }

    // Validate with Zod
    const validatedData = studentSchema.partial().parse(req.body);

    const student = await Student.findByIdAndUpdate(req.params.id, validatedData, {
        new: true,
        runValidators: true
    });

    // Activity Log
    await ActivityLog.create({
        action: 'UPDATE_STUDENT',
        module: 'STUDENTS',
        description: `Updated student: ${student.name}`,
        performedBy: req.user.id,
        targetId: student._id,
        oldData: _.pick(oldStudent.toObject(), Object.keys(validatedData)),
        newData: validatedData
    });

    res.json({ success: true, message: 'Student updated successfully', student });
});

// @desc    Delete student (soft delete)
exports.deleteStudent = asyncHandler(async (req, res) => {
    const student = await Student.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );

    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    await ActivityLog.create({
        action: 'DELETE_STUDENT',
        module: 'STUDENTS',
        description: `Archived student: ${student.name}`,
        performedBy: req.user.id,
        targetId: student._id
    });

    res.json({ success: true, message: 'Student deleted successfully' });
});

// @desc    Record fee payment
exports.recordPayment = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    const settings = await Settings.findOne();
    const receiptNo = settings
        ? `${settings.receiptPrefix || 'RCPT'}${++settings.lastReceiptNo}`
        : `RCPT${Date.now()}`;

    if (settings) await settings.save();

    const payment = {
        amount: Math.round(Number(req.body.amount || 0)),
        paymentDate: req.body.paymentDate || new Date(),
        paymentMode: req.body.paymentMode || 'cash',
        feeType: req.body.feeType || 'tuition',
        receiptNo,
        remarks: req.body.remarks,
        recordedBy: req.user.id
    };

    student.feePayments.push(payment);
    await student.save();

    await ActivityLog.create({
        action: 'RECORD_PAYMENT',
        module: 'FINANCE',
        description: `Recorded payment of ${payment.amount} for ${student.name} (Receipt: ${receiptNo})`,
        performedBy: req.user.id,
        targetId: student._id,
        newData: payment
    });

    res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        payment,
        student
    });
});

exports.getPaymentHistory = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    if (req.user.role === 'student' && student.userId?.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Access denied');
    }

    res.json({
        success: true,
        payments: student.feePayments,
        totalPaid: student.totalPaid,
        pendingAmount: student.pendingAmount,
        totalBookPaid: student.totalBookPaid,
        pendingBookAmount: student.pendingBookAmount,
        paymentStatus: student.paymentStatus
    });
});

exports.editPayment = asyncHandler(async (req, res) => {
    if (req.user.role === 'admin') {
        res.status(403);
        throw new Error('Admins are not authorized to edit payments.');
    }
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    const payment = student.feePayments.id(req.params.paymentId);
    if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
    }

    const oldPayment = { ...payment.toObject() };
    const { amount, paymentDate, paymentMode, remarks, feeType } = req.body;

    if (amount !== undefined && amount !== null && amount !== '') payment.amount = Math.round(Number(amount));
    if (paymentDate !== undefined) payment.paymentDate = paymentDate;
    if (paymentMode !== undefined) payment.paymentMode = paymentMode;
    if (feeType !== undefined) payment.feeType = feeType;
    if (remarks !== undefined) payment.remarks = remarks;

    await student.save();

    await ActivityLog.create({
        action: 'EDIT_PAYMENT',
        module: 'FINANCE',
        description: `Edited payment for ${student.name} (Receipt: ${payment.receiptNo})`,
        performedBy: req.user.id,
        targetId: student._id,
        oldData: oldPayment,
        newData: payment.toObject()
    });

    res.json({ success: true, message: 'Payment updated successfully', payment, student });
});

exports.deletePayment = asyncHandler(async (req, res) => {
    if (req.user.role === 'admin') {
        res.status(403);
        throw new Error('Admins are not authorized to delete payments.');
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    const payment = student.feePayments.id(req.params.paymentId);
    if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
    }

    await ActivityLog.create({
        action: 'DELETE_PAYMENT',
        module: 'FINANCE',
        description: `Deleted payment of ${payment.amount} for ${student.name} (Receipt: ${payment.receiptNo})`,
        performedBy: req.user.id,
        targetId: student._id,
        oldData: payment.toObject()
    });

    await DeletedRecord.create({
        recordType: 'Fee Payment',
        originalId: payment._id,
        parentId: student._id,
        description: `Deleted fee payment of ₹${payment.amount} (Receipt: ${payment.receiptNo}) for student ${student.name}`,
        data: payment.toObject(),
        deletedBy: req.user.id
    });

    student.feePayments.pull(req.params.paymentId);
    await student.save();

    res.json({ success: true, message: 'Payment deleted successfully' });
});

exports.promoteStudents = asyncHandler(async (req, res) => {
    const CLASS_ORDER = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const { fromYear, toYear } = req.body;

    if (!fromYear || !toYear) {
        res.status(400);
        throw new Error('fromYear and toYear are required');
    }

    const students = await Student.find({ isActive: true, academicYear: fromYear });
    if (students.length === 0) {
        res.status(404);
        throw new Error(`No active students found for academic year ${fromYear}`);
    }

    const FeeStructure = require('../models/FeeStructure');
    const feeStructures = await FeeStructure.find({ academicYear: toYear });
    const feeMap = {};
    feeStructures.forEach(f => { feeMap[f.class] = f.totalFee; });

    let promoted = 0, graduated = 0, skipped = 0;

    for (const student of students) {
        const currentIndex = CLASS_ORDER.indexOf(student.class);
        if (currentIndex === -1) { skipped++; continue; }

        if (currentIndex === CLASS_ORDER.length - 1) {
            student.isActive = false;
            graduated++;
        } else {
            const nextClass = CLASS_ORDER[currentIndex + 1];
            student.class = nextClass;
            student.academicYear = toYear;
            student.feePayments = [];
            if (feeMap[nextClass]) {
                student.totalFee = feeMap[nextClass];
            }
            promoted++;
        }
        await student.save({ validateBeforeSave: false });
    }

    await ActivityLog.create({
        action: 'PROMOTE_STUDENTS',
        module: 'SYSTEM',
        description: `Bulk promotion from ${fromYear} to ${toYear}: ${promoted} students`,
        performedBy: req.user.id
    });

    res.json({
        success: true,
        message: `Promotion complete: ${promoted} promoted, ${graduated} graduated, ${skipped} skipped.`,
        promoted, graduated, skipped
    });
});

// @desc    Bulk Import Students
exports.bulkImportStudents = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file (.csv, .xlsx)');
    }

    // Priority: 1. User selected in UI (req.body), 2. Filename, 3. Default "Nursery"
    const fileName = req.file.originalname.split('.')[0];
    const fileDefaultClass = fileName.replace(/class/gi, '').trim();
    const finalDefaultClass = req.body.class || fileDefaultClass || 'Nursery';
    const finalDefaultYear = req.body.academicYear || '2025-26';

    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to raw array of arrays to handle any format (no headers assumed)
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let imported = 0;
    let errors = [];
    const startCount = await Student.countDocuments();

    // Common non-name keywords to skip (boilerplate rows like school names)
    const skipKeywords = ['oxford', 'school', 'list', 'student', 'sl no', 'name', 'class', 'chityala'];

    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || !Array.isArray(row) || row.length === 0) continue;

        try {
            // Find student name: look at first 3 columns, ignore boilerplate
            let studentName = null;
            for (let colIndex = 0; colIndex < Math.min(row.length, 3); colIndex++) {
                const val = String(row[colIndex] || '').trim();
                const lowerVal = val.toLowerCase();
                if (val.length > 2 && !skipKeywords.some(kw => lowerVal.includes(kw) && lowerVal.length < 20)) {
                    studentName = val;
                    break;
                }
            }

            if (!studentName) continue;

            const studentData = {
                name: studentName,
                class: finalDefaultClass, // From UI selection
                rollNo: String(startCount + imported + 1),
                parentName: 'Not Available',
                parentPhone: '0000000000',
                totalFee: 0,
                academicYear: finalDefaultYear, // From UI selection
            };

            // Smart phone detection: search all columns for 10 digits
            for (const cell of row) {
                const phone = String(cell || '').replace(/\D/g, '');
                if (phone.length === 10) {
                    studentData.parentPhone = phone;
                    break;
                }
            }

            await Student.create(studentData);
            imported++;
        } catch (err) {
            errors.push(`Row ${i + 1}: ${err.message}`);
        }
    }

    await ActivityLog.create({
        action: 'BULK_IMPORT',
        module: 'STUDENTS',
        description: `Imported ${imported} students from ${req.file.originalname}`,
        performedBy: req.user.id
    });

    res.json({
        success: true,
        message: imported > 0
            ? `Successfully imported ${imported} students.`
            : `No students were imported. Please check if the file contains names.`,
        imported,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined // Show first 5 errors if any
    });
});

// @desc    Bulk Delete Students
exports.bulkDeleteStudents = asyncHandler(async (req, res) => {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400);
        throw new Error('No students selected for deletion');
    }

    const result = await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: { isActive: false } }
    );

    await ActivityLog.create({
        action: 'BULK_DELETE_STUDENTS',
        module: 'STUDENTS',
        description: `Bulk deleted/archived ${result.modifiedCount} students`,
        performedBy: req.user.id,
        newData: { count: result.modifiedCount, ids: studentIds }
    });

    res.json({
        success: true,
        message: `Successfully deleted ${result.modifiedCount} students.`,
        count: result.modifiedCount
    });
});


// @desc    Get dashboard stats
exports.getStudentStats = asyncHandler(async (req, res) => {
    const stats = await Student.aggregate([
        { $match: { isActive: true } },
        { $addFields: { paidNow: { $sum: "$feePayments.amount" } } },
        {
            $group: {
                _id: "$class",
                count: { $sum: 1 },
                total: { $sum: "$totalFee" },
                collected: { $sum: "$paidNow" }
            }
        },
        {
            $project: {
                class: "$_id",
                count: 1,
                total: 1,
                collected: 1,
                pending: { $subtract: ["$total", "$collected"] }
            }
        }
    ]);

    const classwiseStats = {};
    let totalStudents = 0, totalFees = 0, totalCollected = 0, totalPending = 0;

    stats.forEach(s => {
        classwiseStats[s.class] = { count: s.count, total: s.total, collected: s.collected, pending: s.pending };
        totalStudents += s.count;
        totalFees += s.total;
        totalCollected += s.collected;
        totalPending += s.pending;
    });

    res.json({
        success: true,
        stats: { totalStudents, totalFees, totalCollected, totalPending, classwiseStats }
    });
});

