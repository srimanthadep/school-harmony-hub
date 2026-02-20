const Student = require('../models/Student');
const Staff = require('../models/Staff');

// @desc    Get comprehensive dashboard report
// @route   GET /api/reports/dashboard
// @access  Admin
exports.getDashboard = async (req, res) => {
    try {
        const [students, staff] = await Promise.all([
            Student.find({ isActive: true }),
            Staff.find({ isActive: true })
        ]);

        const totalStudents = students.length;
        const totalStaff = staff.length;
        const totalFeesCollected = students.reduce((s, st) => s + st.totalPaid, 0);
        const totalFeesPending = students.reduce((s, st) => s + st.pendingAmount, 0);
        const totalSalaryPaid = staff.reduce((s, st) => s + st.totalSalaryPaid, 0);
        const totalMonthlySalary = staff.reduce((s, st) => s + st.monthlySalary, 0);
        const totalFeesExpected = students.reduce((s, st) => s + st.totalFee, 0);
        const studentsFullyPaid = students.filter(st => st.pendingAmount <= 0 && st.totalFee > 0).length;
        const collectionRate = totalFeesExpected > 0
            ? Math.round((totalFeesCollected / totalFeesExpected) * 100)
            : 0;

        // Class-wise breakdown
        const classWise = {};
        students.forEach(s => {
            if (!classWise[s.class]) {
                classWise[s.class] = { students: 0, collected: 0, pending: 0 };
            }
            classWise[s.class].students++;
            classWise[s.class].collected += s.totalPaid;
            classWise[s.class].pending += s.pendingAmount;
        });

        // Monthly collections (last 6 months)
        const monthlyData = {};
        students.forEach(st => {
            st.feePayments.forEach(p => {
                const monthKey = new Date(p.paymentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + p.amount;
            });
        });

        const monthlySalaryData = {};
        staff.forEach(st => {
            st.salaryPayments.forEach(p => {
                const monthKey = new Date(p.paymentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                monthlySalaryData[monthKey] = (monthlySalaryData[monthKey] || 0) + p.amount;
            });
        });

        // Recent payments
        const allPayments = [];
        students.forEach(st => {
            st.feePayments.forEach(p => {
                allPayments.push({
                    type: 'fee',
                    studentName: st.name,
                    class: st.class,
                    amount: p.amount,
                    paymentDate: p.paymentDate,
                    receiptNo: p.receiptNo,
                    paymentMode: p.paymentMode
                });
            });
        });
        allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

        res.json({
            success: true,
            dashboard: {
                totalStudents,
                totalStaff,
                totalFeesCollected,
                totalFeesPending,
                totalSalaryPaid,
                totalMonthlySalary,
                studentsFullyPaid,
                collectionRate,
                classWise,
                monthlyCollections: monthlyData,
                monthlySalaryPaid: monthlySalaryData,
                recentPayments: allPayments.slice(0, 10)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get pending fees report
// @route   GET /api/reports/pending-fees
// @access  Admin
exports.getPendingFees = async (req, res) => {
    try {
        const { class: cls } = req.query;
        const query = { isActive: true };
        if (cls) query.class = cls;

        const students = await Student.find(query);
        const pendingStudents = students
            .filter(s => s.pendingAmount > 0)
            .map(s => ({
                _id: s._id,
                studentId: s.studentId,
                name: s.name,
                class: s.class,

                rollNo: s.rollNo,
                parentPhone: s.parentPhone,
                totalFee: s.totalFee,
                totalPaid: s.totalPaid,
                pendingAmount: s.pendingAmount,
                paymentStatus: s.paymentStatus
            }))
            .sort((a, b) => b.pendingAmount - a.pendingAmount);

        res.json({
            success: true,
            count: pendingStudents.length,
            totalPending: pendingStudents.reduce((s, st) => s + st.pendingAmount, 0),
            pendingStudents
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get class-wise fee collection report
// @route   GET /api/reports/classwise-fees
// @access  Admin
exports.getClasswiseFees = async (req, res) => {
    try {
        const classes = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
        const report = [];

        for (const cls of classes) {
            const students = await Student.find({ class: cls, isActive: true });
            if (students.length > 0) {
                report.push({
                    class: cls,
                    totalStudents: students.length,
                    totalFee: students.reduce((s, st) => s + st.totalFee, 0),
                    totalCollected: students.reduce((s, st) => s + st.totalPaid, 0),
                    totalPending: students.reduce((s, st) => s + st.pendingAmount, 0),
                    paidCount: students.filter(s => s.paymentStatus === 'paid').length,
                    partialCount: students.filter(s => s.paymentStatus === 'partial').length,
                    unpaidCount: students.filter(s => s.paymentStatus === 'unpaid').length
                });
            }
        }

        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get staff salary report
// @route   GET /api/reports/salary
// @access  Admin
exports.getSalaryReport = async (req, res) => {
    try {
        const { month } = req.query;
        const staff = await Staff.find({ isActive: true });

        const report = staff.map(s => {
            const filteredPayments = month
                ? s.salaryPayments.filter(p => p.month.includes(month))
                : s.salaryPayments;

            return {
                _id: s._id,
                staffId: s.staffId,
                name: s.name,
                role: s.role,
                monthlySalary: s.monthlySalary,
                totalSalaryPaid: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
                payments: filteredPayments
            };
        });

        res.json({
            success: true,
            totalMonthlySalary: staff.reduce((s, st) => s + st.monthlySalary, 0),
            totalPaid: report.reduce((s, r) => s + r.totalSalaryPaid, 0),
            staff: report
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get monthly income vs expense
// @route   GET /api/reports/monthly
// @access  Admin
exports.getMonthlyReport = async (req, res) => {
    try {
        const students = await Student.find({ isActive: true });
        const staff = await Staff.find({ isActive: true });

        const monthlyIncome = {};
        const monthlyExpense = {};

        students.forEach(st => {
            st.feePayments.forEach(p => {
                const key = new Date(p.paymentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                monthlyIncome[key] = (monthlyIncome[key] || 0) + p.amount;
            });
        });

        staff.forEach(st => {
            st.salaryPayments.forEach(p => {
                const key = new Date(p.paymentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                monthlyExpense[key] = (monthlyExpense[key] || 0) + p.amount;
            });
        });

        const allMonths = [...new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])];

        const report = allMonths.map(month => ({
            month,
            income: monthlyIncome[month] || 0,
            expense: monthlyExpense[month] || 0,
            net: (monthlyIncome[month] || 0) - (monthlyExpense[month] || 0)
        }));

        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
