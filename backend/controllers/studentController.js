const Student = require('../models/Student');
const User = require('../models/User');
const Settings = require('../models/Settings');

// @desc    Get all students
// @route   GET /api/students
// @access  Admin
exports.getStudents = async (req, res) => {
    try {
        const { class: cls, section, search, page = 1, limit = 50 } = req.query;
        const query = { isActive: true };

        if (cls) query.class = cls;
        if (section) query.section = section.toUpperCase();
        if (search) query.name = { $regex: search, $options: 'i' };

        const students = await Student.find(query)
            .sort({ class: 1, section: 1, rollNo: 1 })
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
            amount: req.body.amount,
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
