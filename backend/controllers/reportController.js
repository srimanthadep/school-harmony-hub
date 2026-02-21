const Student = require('../models/Student');
const Staff = require('../models/Staff');

// @desc    Get comprehensive dashboard report
// @route   GET /api/reports/dashboard
// @access  Admin
exports.getDashboard = async (req, res) => {
    try {
        const [
            studentStats,
            classStats,
            monthlyFeeStats,
            staffStats,
            monthlySalaryStats,
            recentFeePayments
        ] = await Promise.all([
            // 1. Overall Student Stats
            Student.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalStudents: { $sum: 1 },
                        totalFeesExpected: { $sum: "$totalFee" },
                        totalFeesCollected: { $sum: { $sum: "$feePayments.amount" } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalStudents: 1,
                        totalFeesExpected: 1,
                        totalFeesCollected: 1,
                        totalFeesPending: { $subtract: ["$totalFeesExpected", "$totalFeesCollected"] }
                    }
                }
            ]),

            // 2. Class-wise Breakdown
            Student.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: "$class",
                        students: { $sum: 1 },
                        totalFee: { $sum: "$totalFee" },
                        collected: { $sum: { $sum: "$feePayments.amount" } }
                    }
                },
                {
                    $project: {
                        class: "$_id",
                        students: 1,
                        collected: 1,
                        pending: { $subtract: ["$totalFee", "$collected"] }
                    }
                }
            ]),

            // 3. Monthly Fee Collections (Last 6 Months)
            Student.aggregate([
                { $unwind: "$feePayments" },
                {
                    $group: {
                        _id: {
                            month: { $month: "$feePayments.paymentDate" },
                            year: { $year: "$feePayments.paymentDate" }
                        },
                        total: { $sum: "$feePayments.amount" }
                    }
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } },
                { $limit: 6 }
            ]),

            // 4. Staff Overview
            Staff.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalStaff: { $sum: 1 },
                        totalMonthlySalary: { $sum: "$monthlySalary" },
                        totalSalaryPaid: { $sum: { $sum: "$salaryPayments.amount" } }
                    }
                }
            ]),

            // 5. Monthly Salary Trends
            Staff.aggregate([
                { $unwind: "$salaryPayments" },
                {
                    $group: {
                        _id: {
                            month: { $month: "$salaryPayments.paymentDate" },
                            year: { $year: "$salaryPayments.paymentDate" }
                        },
                        total: { $sum: "$salaryPayments.amount" }
                    }
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } },
                { $limit: 6 }
            ]),

            // 6. Recent 10 Fee Payments
            Student.aggregate([
                { $match: { isActive: true } },
                { $unwind: "$feePayments" },
                { $sort: { "feePayments.paymentDate": -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        studentName: "$name",
                        class: "$class",
                        amount: "$feePayments.amount",
                        paymentDate: "$feePayments.paymentDate",
                        receiptNo: "$feePayments.receiptNo",
                        paymentMode: "$feePayments.paymentMode"
                    }
                }
            ])
        ]);

        // Post-process to match frontend structure
        const s = studentStats[0] || { totalStudents: 0, totalFeesExpected: 0, totalFeesCollected: 0, totalFeesPending: 0 };
        const st = staffStats[0] || { totalStaff: 0, totalMonthlySalary: 0, totalSalaryPaid: 0 };

        const classWise = {};
        classStats.forEach(c => { classWise[c.class] = c; });

        const monthlyCollections = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        monthlyFeeStats.forEach(m => {
            const label = `${months[m._id.month - 1]} ${m._id.year}`;
            monthlyCollections[label] = m.total;
        });

        const monthlySalaryPaid = {};
        monthlySalaryStats.forEach(m => {
            const label = `${months[m._id.month - 1]} ${m._id.year}`;
            monthlySalaryPaid[label] = m.total;
        });

        const collectionRate = s.totalFeesExpected > 0
            ? Math.round((s.totalFeesCollected / s.totalFeesExpected) * 100)
            : 0;

        res.json({
            success: true,
            dashboard: {
                totalStudents: s.totalStudents,
                totalStaff: st.totalStaff,
                totalFeesCollected: s.totalFeesCollected,
                totalFeesPending: s.totalFeesPending,
                totalSalaryPaid: st.totalSalaryPaid,
                totalMonthlySalary: st.totalMonthlySalary,
                collectionRate,
                classWise,
                monthlyCollections,
                monthlySalaryPaid,
                recentPayments: recentFeePayments
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Optimization Error: " + err.message });
    }
};

// @desc    Get pending fees report
// @route   GET /api/reports/pending-fees
// @access  Admin
exports.getPendingFees = async (req, res) => {
    try {
        const { class: cls } = req.query;
        const match = { isActive: true };
        if (cls) match.class = cls;

        const pendingStudents = await Student.aggregate([
            { $match: match },
            {
                $addFields: {
                    totalPaid: { $sum: "$feePayments.amount" }
                }
            },
            {
                $addFields: {
                    pendingAmount: { $subtract: ["$totalFee", "$totalPaid"] }
                }
            },
            { $match: { pendingAmount: { $gt: 0 } } },
            { $sort: { pendingAmount: -1 } },
            {
                $project: {
                    _id: 1,
                    studentId: 1,
                    name: 1,
                    class: 1,
                    rollNo: 1,
                    parentPhone: 1,
                    totalFee: 1,
                    totalPaid: 1,
                    pendingAmount: 1,
                    paymentStatus: {
                        $cond: [
                            { $eq: ["$totalPaid", 0] }, "unpaid", "partial"
                        ]
                    }
                }
            }
        ]);

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
        const report = await Student.aggregate([
            { $match: { isActive: true } },
            {
                $addFields: {
                    paidNow: { $sum: "$feePayments.amount" }
                }
            },
            {
                $group: {
                    _id: "$class",
                    totalStudents: { $sum: 1 },
                    totalFee: { $sum: "$totalFee" },
                    totalCollected: { $sum: "$paidNow" },
                    paidCount: {
                        $sum: { $cond: [{ $gte: ["$paidNow", "$totalFee"] }, 1, 0] }
                    },
                    partialCount: {
                        $sum: { $cond: [{ $and: [{ $gt: ["$paidNow", 0] }, { $lt: ["$paidNow", "$totalFee"] }] }, 1, 0] }
                    },
                    unpaidCount: {
                        $sum: { $cond: [{ $eq: ["$paidNow", 0] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    class: "$_id",
                    totalStudents: 1,
                    totalFee: 1,
                    totalCollected: 1,
                    totalPending: { $subtract: ["$totalFee", "$totalCollected"] },
                    paidCount: 1,
                    partialCount: 1,
                    unpaidCount: 1
                }
            },
            { $sort: { class: 1 } }
        ]);

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
        const [incomeData, expenseData] = await Promise.all([
            Student.aggregate([
                { $unwind: "$feePayments" },
                {
                    $group: {
                        _id: {
                            month: { $month: "$feePayments.paymentDate" },
                            year: { $year: "$feePayments.paymentDate" }
                        },
                        income: { $sum: "$feePayments.amount" }
                    }
                }
            ]),
            Staff.aggregate([
                { $unwind: "$salaryPayments" },
                {
                    $group: {
                        _id: {
                            month: { $month: "$salaryPayments.paymentDate" },
                            year: { $year: "$salaryPayments.paymentDate" }
                        },
                        expense: { $sum: "$salaryPayments.amount" }
                    }
                }
            ])
        ]);

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthlyStats = {};

        incomeData.forEach(item => {
            const key = `${months[item._id.month - 1]} ${item._id.year}`;
            if (!monthlyStats[key]) monthlyStats[key] = { month: key, income: 0, expense: 0 };
            monthlyStats[key].income = item.income;
        });

        expenseData.forEach(item => {
            const key = `${months[item._id.month - 1]} ${item._id.year}`;
            if (!monthlyStats[key]) monthlyStats[key] = { month: key, income: 0, expense: 0 };
            monthlyStats[key].expense = item.expense;
        });

        const report = Object.values(monthlyStats).map(item => ({
            ...item,
            net: item.income - item.expense
        })).sort((a, b) => new Date(b.month) - new Date(a.month));

        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
