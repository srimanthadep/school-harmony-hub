const Student = require('../models/Student');
const User = require('../models/User');
const Settings = require('../models/Settings');

// @desc    Get all students
// @route   GET /api/students
// @access  Admin
exports.getStudents = async (req, res) => {
    try {
        const { class: cls, academicYear, search, page = 1, limit = 50 } = req.query;
        const query = { isActive: true };

        if (cls) query.class = cls;
        if (academicYear) query.academicYear = academicYear;
        if (search) query.name = { $regex: search, $options: 'i' };

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
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Admin | Student (own)
exports.getStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Students can only view their own data
        if (req.user.role === 'student' && student.userId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create student
// @route   POST /api/students
// @access  Admin
exports.createStudent = async (req, res) => {
    try {
        const student = await Student.create(req.body);

        // Create login account for student if email provided
        if (req.body.parentEmail) {
            const defaultPassword = `${student.name.split(' ')[0].toLowerCase()}@${student.studentId}`;
            const user = await User.create({
                name: student.name,
                email: req.body.parentEmail,
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
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Admin
exports.updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, message: 'Student updated successfully', student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
// @access  Admin
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Record fee payment
// @route   POST /api/students/:id/payments
// @access  Admin
exports.recordPayment = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get and update receipt number
        const settings = await Settings.findOne();
        const receiptNo = settings
            ? `${settings.receiptPrefix || 'RCPT'}${++settings.lastReceiptNo}`
            : `RCPT${Date.now()}`;

        if (settings) await settings.save();

        const payment = {
            amount: Math.round(Number(req.body.amount || 0)),  // always store as integer rupees
            paymentDate: req.body.paymentDate || new Date(),
            paymentMode: req.body.paymentMode || 'cash',
            receiptNo,
            remarks: req.body.remarks,
            recordedBy: req.user.id
        };

        student.feePayments.push(payment);
        await student.save();

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            payment,
            student
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get payment history for a student
// @route   GET /api/students/:id/payments
// @access  Admin | Student (own)
exports.getPaymentHistory = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (req.user.role === 'student' && student.userId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            payments: student.feePayments,
            totalPaid: student.totalPaid,
            pendingAmount: student.pendingAmount,
            paymentStatus: student.paymentStatus
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Edit an existing payment (OWNER ONLY)
// @route   PUT /api/students/:id/payments/:paymentId
// @access  Owner only
exports.editPayment = async (req, res) => {
    try {
        // Extra guard: admins must never access this
        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admins are not authorized to edit payments.' });
        }

        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const payment = student.feePayments.id(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Update allowed fields (allow 0 as a valid amount for corrections)
        const { amount, paymentDate, paymentMode, remarks } = req.body;
        if (amount !== undefined && amount !== null && amount !== '') payment.amount = Math.round(Number(amount));
        if (paymentDate !== undefined) payment.paymentDate = paymentDate;
        if (paymentMode !== undefined) payment.paymentMode = paymentMode;
        if (remarks !== undefined) payment.remarks = remarks;

        await student.save();

        res.json({
            success: true,
            message: 'Payment updated successfully',
            payment,
            student
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// @desc    Promote all students to next class (year-end operation)
// @route   POST /api/students/promote
// @access  Admin | Owner
exports.promoteStudents = async (req, res) => {
    try {
        const CLASS_ORDER = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
        const { fromYear, toYear } = req.body;

        if (!fromYear || !toYear) {
            return res.status(400).json({ success: false, message: 'fromYear and toYear are required' });
        }
        if (fromYear === toYear) {
            return res.status(400).json({ success: false, message: 'fromYear and toYear must be different' });
        }

        // Load all active students of the fromYear
        const students = await Student.find({ isActive: true, academicYear: fromYear });
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: `No active students found for academic year ${fromYear}` });
        }

        // Load fee structures for new year (toYear)
        const FeeStructure = require('../models/FeeStructure');
        const feeStructures = await FeeStructure.find({ academicYear: toYear });
        const feeMap = {};
        feeStructures.forEach(f => { feeMap[f.class] = f.totalFee; });

        let promoted = 0, graduated = 0, skipped = 0;

        for (const student of students) {
            const currentIndex = CLASS_ORDER.indexOf(student.class);
            if (currentIndex === -1) { skipped++; continue; }

            if (currentIndex === CLASS_ORDER.length - 1) {
                // 10th class — graduate (mark inactive)
                student.isActive = false;
                graduated++;
            } else {
                const nextClass = CLASS_ORDER[currentIndex + 1];
                student.class = nextClass;
                student.academicYear = toYear;
                // Reset fee payments for new year
                student.feePayments = [];
                // Apply new year fee structure if available
                if (feeMap[nextClass]) {
                    student.totalFee = feeMap[nextClass];
                }
                promoted++;
            }
            await student.save({ validateBeforeSave: false });
        }

        res.json({
            success: true,
            message: `Promotion complete: ${promoted} promoted, ${graduated} graduated (10th → inactive), ${skipped} skipped.`,
            promoted, graduated, skipped
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/students/stats/overview
// @access  Admin
exports.getStudentStats = async (req, res) => {
    try {
        const students = await Student.find({ isActive: true });
        const totalStudents = students.length;
        const totalFees = students.reduce((s, st) => s + st.totalFee, 0);
        const totalCollected = students.reduce((s, st) => s + st.totalPaid, 0);
        const totalPending = students.reduce((s, st) => s + st.pendingAmount, 0);

        const classwiseStats = {};
        students.forEach(s => {
            if (!classwiseStats[s.class]) {
                classwiseStats[s.class] = { count: 0, collected: 0, pending: 0, total: 0 };
            }
            classwiseStats[s.class].count++;
            classwiseStats[s.class].collected += s.totalPaid;
            classwiseStats[s.class].pending += s.pendingAmount;
            classwiseStats[s.class].total += s.totalFee;
        });

        res.json({
            success: true,
            stats: { totalStudents, totalFees, totalCollected, totalPending, classwiseStats }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
