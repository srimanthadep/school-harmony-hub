const Student = require('../models/Student');
const User = require('../models/User');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const DeletedRecord = require('../models/DeletedRecord');
const asyncHandler = require('../utils/asyncHandler');
const { studentSchema } = require('../validations/studentValidation');
const _ = require('lodash');
const xlsx = require('xlsx');

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
        .collation({ locale: 'en_US', numericOrdering: true })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

    // Manually attach virtual fields for lean objects
    const studentsWithVirtuals = students.map(s => {
        const tuitionPaid = (s.feePayments || [])
            .filter(p => !p.feeType || p.feeType === 'tuition')
            .reduce((sum, p) => sum + p.amount, 0);

        const bookPaid = (s.feePayments || [])
            .filter(p => p.feeType === 'book')
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPaid = tuitionPaid;
        const pendingAmount = s.totalFee - totalPaid;
        const totalBookPaid = bookPaid;
        const pendingBookAmount = (s.totalBookFee || 0) - totalBookPaid;

        // Tuition specific status
        let tuitionStatus = 'unpaid';
        if (tuitionPaid >= s.totalFee) tuitionStatus = 'paid';
        else if (tuitionPaid > 0) tuitionStatus = 'partial';

        // Book specific status
        let bookStatus = 'unpaid';
        const totalBook = s.totalBookFee || 0;
        if (totalBook > 0) {
            if (bookPaid >= totalBook) bookStatus = 'paid';
            else if (bookPaid > 0) bookStatus = 'partial';
        } else {
            bookStatus = 'na';
        }

        const paid = tuitionPaid + bookPaid;
        const total = s.totalFee + (s.totalBookFee || 0);
        let paymentStatus = 'unpaid';
        if (paid >= total) paymentStatus = 'paid';
        else if (paid > 0) paymentStatus = 'partial';

        return {
            ...s,
            totalPaid,
            pendingAmount,
            totalBookPaid,
            pendingBookAmount,
            paymentStatus,
            tuitionStatus,
            bookStatus,
            libraryStatus: bookStatus
        };
    });

    const total = await Student.countDocuments(query);
    const limitNum = parseInt(limit); // Fix #19: parse as integer

    res.json({
        success: true,
        count: studentsWithVirtuals.length,
        total,
        pages: Math.ceil(total / limitNum),
        students: studentsWithVirtuals
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

    // Build list of changed fields for description
    const oldPicked = _.pick(oldStudent.toObject(), Object.keys(validatedData));
    const changedFields = Object.keys(validatedData).filter(
        k => String(oldPicked[k] ?? '') !== String(validatedData[k] ?? '')
    );
    const changesText = changedFields.length
        ? changedFields.slice(0, 5).map(k => `${k}: "${oldPicked[k] ?? ''}" → "${validatedData[k] ?? ''}"`).join(', ')
        + (changedFields.length > 5 ? ` ...and ${changedFields.length - 5} more` : '')
        : 'no field changes detected';

    // Activity Log
    await ActivityLog.create({
        action: 'UPDATE_STUDENT',
        module: 'STUDENTS',
        description: `Updated student: ${student.name} (${student.studentId || student._id}) — Changed: ${changesText}`,
        performedBy: req.user.id,
        targetId: student._id,
        oldData: oldPicked,
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
        description: `Archived student: ${student.name} (${student.studentId || student._id}), Class: ${student.class}, Parent: ${student.parentName}`,
        performedBy: req.user.id,
        targetId: student._id,
        oldData: _.pick(student.toObject(), ['name', 'studentId', 'class', 'rollNo', 'parentName', 'parentPhone', 'totalFee', 'academicYear'])
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

    // Fix #23: Reject zero or negative payment amounts
    const amount = Math.round(Number(req.body.amount || 0));
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Payment amount must be greater than 0');
    }

    // Generate receipt number with retry logic for duplicate key collisions
    const MAX_RETRIES = 5;
    let receiptNo;
    let savedStudent;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const settings = await Settings.findOne();
            if (settings) {
                // On first attempt, check if counter is behind actual max receipt number
                if (attempt === 0) {
                    const prefix = settings.receiptPrefix || 'RCPT';
                    const allStudents = await Student.find(
                        { 'feePayments.receiptNo': { $regex: `^${prefix}\\d+$` } },
                        { 'feePayments.receiptNo': 1 }
                    ).lean();

                    let maxExisting = settings.lastReceiptNo;
                    for (const s of allStudents) {
                        for (const p of (s.feePayments || [])) {
                            if (p.receiptNo && p.receiptNo.startsWith(prefix)) {
                                const num = parseInt(p.receiptNo.replace(prefix, ''), 10);
                                if (!isNaN(num) && num > maxExisting) {
                                    maxExisting = num;
                                }
                            }
                        }
                    }

                    // Sync counter if it's behind
                    if (maxExisting > settings.lastReceiptNo) {
                        await Settings.findOneAndUpdate(
                            {},
                            { $set: { lastReceiptNo: maxExisting } }
                        );
                    }
                }

                const updatedSettings = await Settings.findOneAndUpdate(
                    {},
                    { $inc: { lastReceiptNo: 1 } },
                    { new: true }
                );
                receiptNo = `${updatedSettings.receiptPrefix || 'RCPT'}${updatedSettings.lastReceiptNo}`;
            } else {
                receiptNo = `RCPT${Date.now()}`;
            }

            const payment = {
                amount,
                paymentDate: req.body.paymentDate || new Date(),
                paymentMode: req.body.paymentMode || 'cash',
                feeType: req.body.feeType || 'tuition',
                receiptNo,
                remarks: req.body.remarks,
                recordedBy: req.user.id
            };

            // Re-fetch student to avoid stale data on retries
            const freshStudent = attempt === 0 ? student : await Student.findById(req.params.id);
            freshStudent.feePayments.push(payment);
            savedStudent = await freshStudent.save();

            await ActivityLog.create({
                action: 'RECORD_PAYMENT',
                module: 'FINANCE',
                description: `Recorded payment of ₹${payment.amount} for ${savedStudent.name} (${savedStudent.studentId || savedStudent._id}), Class: ${savedStudent.class}, Receipt: ${receiptNo}, Mode: ${payment.paymentMode}, Type: ${payment.feeType}`,
                performedBy: req.user.id,
                targetId: savedStudent._id,
                newData: {
                    ...payment,
                    studentName: savedStudent.name,
                    studentId: savedStudent.studentId,
                    class: savedStudent.class,
                    rollNo: savedStudent.rollNo,
                    parentName: savedStudent.parentName,
                    parentPhone: savedStudent.parentPhone
                }
            });

            // Success — break out of retry loop
            break;
        } catch (err) {
            // If it's a duplicate key error on receiptNo, retry with next number
            if (err.code === 11000 && err.message.includes('receiptNo') && attempt < MAX_RETRIES - 1) {
                console.warn(`Receipt number collision on ${receiptNo}, retrying (attempt ${attempt + 2}/${MAX_RETRIES})...`);
                continue;
            }
            throw err; // Re-throw non-duplicate or exhausted retries
        }
    }

    res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        payment: savedStudent.feePayments[savedStudent.feePayments.length - 1],
        student: savedStudent
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
        description: `Edited payment for ${student.name} (${student.studentId || student._id}), Receipt: ${payment.receiptNo}, Class: ${student.class}`,
        performedBy: req.user.id,
        targetId: student._id,
        oldData: { ...oldPayment, studentName: student.name, studentId: student.studentId, class: student.class },
        newData: { ...payment.toObject(), studentName: student.name, studentId: student.studentId, class: student.class }
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
        description: `Deleted payment of ₹${payment.amount} for ${student.name} (${student.studentId || student._id}), Receipt: ${payment.receiptNo}, Class: ${student.class}`,
        performedBy: req.user.id,
        targetId: student._id,
        oldData: { ...payment.toObject(), studentName: student.name, studentId: student.studentId, class: student.class, parentName: student.parentName, parentPhone: student.parentPhone }
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
    const BookFeeStructure = require('../models/BookFeeStructure');
    const feeStructures = await FeeStructure.find({ academicYear: toYear });
    const feeMap = {};
    feeStructures.forEach(f => { feeMap[f.class] = f.totalFee; });

    // Fix #10: Also load book fee structures for the new year
    const bookFeeStructures = await BookFeeStructure.find();
    const bookFeeMap = {};
    bookFeeStructures.forEach(f => { bookFeeMap[f.class] = f.totalFee; });

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
            // Fix #10: Reset book fee for the new class
            if (bookFeeMap[nextClass] !== undefined) {
                student.totalBookFee = bookFeeMap[nextClass];
            } else {
                student.totalBookFee = 0; // reset to 0 if no structure found
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

    // Fix #12: Read academic year from Settings instead of hardcoding
    const importSettings = await Settings.findOne();
    const fileName = req.file.originalname.split('.')[0];
    const fileDefaultClass = fileName.replace(/class/gi, '').trim();
    const finalDefaultClass = req.body.class || fileDefaultClass || 'Nursery';
    const finalDefaultYear = req.body.academicYear || importSettings?.academicYear || '2025-26';

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


// @desc    Sync phone numbers from CSV (safe, idempotent — updates parentPhone only)
// @route   POST /api/students/sync-phones
// Supports dry run via ?dryRun=true or body.dryRun=true
exports.syncPhoneNumbers = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a CSV file');
    }

    const dryRun = req.query.dryRun === 'true' || req.body.dryRun === 'true' || req.body.dryRun === true;

    // Map CSV class names → model class names
    const CLASS_MAP = {
        'nursary': 'Nursery', 'nursery': 'Nursery',
        'lkg': 'LKG', 'ukg': 'UKG',
        '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th',
        '6': '6th', '7': '7th', '8': '8th', '9': '9th', '10': '10th',
        '1st': '1st', '2nd': '2nd', '3rd': '3rd', '4th': '4th', '5th': '5th',
        '6th': '6th', '7th': '7th', '8th': '8th', '9th': '9th', '10th': '10th'
    };

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Parse with headers from first row
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const updated = [];
    const skipped = [];
    const bulkOps = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // 1-based + header row

        // Normalize keys (trim whitespace)
        const normalizedRow = {};
        for (const key of Object.keys(row)) {
            normalizedRow[key.trim()] = row[key];
        }

        // Extract and clean Roll No
        const rawRollNo = String(normalizedRow['Roll No'] || '').trim();
        if (!rawRollNo || rawRollNo === '') {
            skipped.push({ row: rowNum, reason: 'Missing roll number' });
            continue;
        }
        // Strip trailing .0 from numeric roll numbers
        const rollNo = rawRollNo.replace(/\.0+$/, '');

        // Extract and map Class
        const rawClass = String(normalizedRow['Class'] || '').trim();
        const mappedClass = CLASS_MAP[rawClass.toLowerCase()];
        if (!mappedClass) {
            skipped.push({ row: rowNum, rollNo, reason: `Unknown class: "${rawClass}"` });
            continue;
        }

        // Extract and clean Phone
        const rawPhone = String(normalizedRow['Phone'] || '').trim();
        if (!rawPhone || rawPhone === '') {
            skipped.push({ row: rowNum, rollNo, class: mappedClass, reason: 'Missing phone number' });
            continue;
        }
        // Strip trailing .0 and non-digits
        const phone = rawPhone.replace(/\.0+$/, '').replace(/\D/g, '');
        // Validate 10-digit phone (Indian format, consistent with existing validation)
        if (phone.length !== 10) {
            skipped.push({ row: rowNum, rollNo, class: mappedClass, reason: `Invalid phone "${rawPhone}" (must be 10 digits)` });
            continue;
        }

        bulkOps.push({
            updateOne: {
                filter: { class: mappedClass, rollNo },
                update: { $set: { parentPhone: phone } },
                upsert: false   // never create new students
            }
        });
        updated.push({ row: rowNum, rollNo, class: mappedClass, phone });
    }

    let matchedCount = 0;
    let modifiedCount = 0;

    if (!dryRun && bulkOps.length > 0) {
        const result = await Student.bulkWrite(bulkOps, { ordered: false });
        matchedCount = result.matchedCount;
        modifiedCount = result.modifiedCount;
    } else if (dryRun) {
        matchedCount = updated.length;
        modifiedCount = updated.length;
    }

    res.json({
        success: true,
        dryRun,
        message: dryRun
            ? `DRY RUN: ${updated.length} CSV rows have valid phone numbers (DB match not verified), ${skipped.length} skipped.`
            : `Sync complete: ${modifiedCount} phone numbers updated, ${skipped.length} rows skipped.`,
        processed: updated.length,
        matchedCount,
        modifiedCount,
        skippedCount: skipped.length,
        skipped
    });
});

// @desc    Get dashboard stats
exports.getStudentStats = asyncHandler(async (req, res) => {
    const stats = await Student.aggregate([
        { $match: { isActive: true } },
        {
            $addFields: {
                paidNow: {
                    $reduce: {
                        input: {
                            $filter: {
                                input: { $ifNull: ["$feePayments", []] },
                                as: "p",
                                cond: { $or: [{ $eq: ["$$p.feeType", "tuition"] }, { $not: ["$$p.feeType"] }] }
                            }
                        },
                        initialValue: 0,
                        in: { $add: ["$$value", "$$p.amount"] }
                    }
                }
            }
        },
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

