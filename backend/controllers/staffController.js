const Staff = require('../models/Staff');
const User = require('../models/User');
const Settings = require('../models/Settings');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Admin
exports.getStaff = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 50 } = req.query;
        const query = { isActive: true };
        if (role) query.role = role;
        if (search) query.name = { $regex: search, $options: 'i' };

        const staff = await Staff.find(query)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Staff.countDocuments(query);

        res.json({ success: true, count: staff.length, total, staff });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get single staff
// @route   GET /api/staff/:id
// @access  Admin | Staff (own)
exports.getStaffMember = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        if (req.user.role === 'staff' && staff.userId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, staff });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create staff
// @route   POST /api/staff
// @access  Admin
exports.createStaff = async (req, res) => {
    try {
        const staff = await Staff.create(req.body);

        // Create login account
        if (req.body.email) {
            const defaultPassword = `${staff.name.split(' ')[0].toLowerCase()}@${staff.staffId}`;
            const user = await User.create({
                name: staff.name,
                email: staff.email,
                password: defaultPassword,
                role: 'staff',
                profileId: staff._id,
                profileModel: 'Staff'
            });
            staff.userId = user._id;
            await staff.save();
        }

        res.status(201).json({
            success: true,
            message: 'Staff member added successfully',
            staff
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Admin
exports.updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }
        res.json({ success: true, message: 'Staff updated successfully', staff });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete staff (soft delete)
// @route   DELETE /api/staff/:id
// @access  Admin
exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }
        res.json({ success: true, message: 'Staff deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Record salary payment
// @route   POST /api/staff/:id/salaries
// @access  Admin
exports.recordSalaryPayment = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        const settings = await Settings.findOne();
        const slipNo = settings
            ? `${settings.salarySlipPrefix || 'SAL'}${++settings.lastSlipNo}`
            : `SAL${Date.now()}`;

        if (settings) await settings.save();

        const payment = {
            month: req.body.month,
            amount: Math.round(Number(req.body.amount || 0)),
            paymentDate: req.body.paymentDate || new Date(),
            paymentMode: req.body.paymentMode || 'bank_transfer',
            slipNo,
            remarks: req.body.remarks,
            recordedBy: req.user.id
        };

        staff.salaryPayments.push(payment);
        await staff.save();

        res.status(201).json({
            success: true,
            message: 'Salary payment recorded successfully',
            payment,
            staff
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get salary history
// @route   GET /api/staff/:id/salaries
// @access  Admin | Staff (own)
exports.getSalaryHistory = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        if (req.user.role === 'staff' && staff.userId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            salaryPayments: staff.salaryPayments,
            totalSalaryPaid: staff.totalSalaryPaid,
            monthlySalary: staff.monthlySalary
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Staff overview stats
// @route   GET /api/staff/stats/overview
// @access  Admin
exports.getStaffStats = async (req, res) => {
    try {
        const staff = await Staff.find({ isActive: true });
        const totalStaff = staff.length;
        const totalMonthlySalary = staff.reduce((s, st) => s + st.monthlySalary, 0);
        const totalSalaryPaid = staff.reduce((s, st) => s + st.totalSalaryPaid, 0);

        res.json({
            success: true,
            stats: { totalStaff, totalMonthlySalary, totalSalaryPaid }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
