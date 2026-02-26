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
                    $addFields: {
                        currentTotalPaid: { $sum: "$feePayments.amount" },
                        libraryPaidAmount: {
                            $sum: {
                                $map: {
                                    input: { $filter: { input: "$feePayments", as: "p", cond: { $eq: ["$$p.feeType", "book"] } } },
                                    as: "b",
                                    in: "$$b.amount"
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalStudents: { $sum: 1 },
                        totalFeesExpected: {
                            $sum: { $add: ["$totalFee", { $ifNull: ["$totalBookFee", 0] }] }
                        },
                        totalFeesCollected: { $sum: "$currentTotalPaid" },
                        libraryExpected: { $sum: { $ifNull: ["$totalBookFee", 0] } },
                        libraryCollected: { $sum: "$libraryPaidAmount" },
                        studentsFullyPaid: {
                            $sum: { $cond: [{ $gte: ["$currentTotalPaid", { $add: ["$totalFee", { $ifNull: ["$totalBookFee", 0] }] }] }, 1, 0] }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalStudents: 1,
                        totalFeesExpected: 1,
                        totalFeesCollected: 1,
                        studentsFullyPaid: 1,
                        totalFeesPending: { $subtract: ["$totalFeesExpected", "$totalFeesCollected"] },
                        libraryCollected: 1,
                        libraryPending: { $subtract: ["$libraryExpected", "$libraryCollected"] }
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
                        totalFee: {
                            $sum: { $add: ["$totalFee", { $ifNull: ["$totalBookFee", 0] }] }
                        },
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
                    $match: {
                        "feePayments.paymentDate": { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$feePayments.paymentDate" },
                            year: { $year: "$feePayments.paymentDate" }
                        },
                        total: { $sum: "$feePayments.amount" }
                    }
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } }
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

            // 5. Monthly Salary Trends (Last 6 Months)
            Staff.aggregate([
                { $unwind: "$salaryPayments" },
                {
                    $match: {
                        "salaryPayments.paymentDate": { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: "$salaryPayments.paymentDate" },
                            year: { $year: "$salaryPayments.paymentDate" }
                        },
                        total: { $sum: "$salaryPayments.amount" }
                    }
                },
                { $sort: { "_id.year": -1, "_id.month": -1 } }
            ]),

            // 6. Recent 10 Fee Payments (Optimized lookback)
            Student.aggregate([
                { $match: { isActive: true } },
                { $unwind: "$feePayments" },
                { $match: { "feePayments.paymentDate": { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } } },
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
        const s = studentStats[0] || { totalStudents: 0, totalFeesExpected: 0, totalFeesCollected: 0, totalFeesPending: 0, studentsFullyPaid: 0, libraryCollected: 0, libraryPending: 0 };
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
                studentsFullyPaid: s.studentsFullyPaid,
                libraryCollected: s.libraryCollected,
                libraryPending: s.libraryPending,
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
        const { class: cls, startDate, endDate, page = 1, limit = 50 } = req.query;
        const match = { isActive: true };
        if (cls) match.class = cls;

        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const [pendingStudents, totalCountResult] = await Promise.all([
            Student.aggregate([
                { $match: match },
                {
                    $addFields: {
                        totalPaid: {
                            $sum: {
                                $filter: {
                                    input: { $ifNull: ["$feePayments", []] },
                                    as: "p",
                                    cond: { $or: [{ $eq: ["$$p.feeType", "tuition"] }, { $not: ["$$p.feeType"] }] }
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        // totalPaid is now just a filtered array, need to sum the amounts
                        tuitionPaidSum: {
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
                    $addFields: {
                        pendingAmount: { $subtract: ["$totalFee", "$tuitionPaidSum"] }
                    }
                },
                { $match: { pendingAmount: { $gt: 0 } } },
                {
                    $addFields: {
                        classOrder: {
                            $indexOfArray: [
                                ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'],
                                "$class"
                            ]
                        }
                    }
                },
                { $sort: { classOrder: 1, rollNo: 1 } },
                { $skip: skip },
                { $limit: limitNum },
                {
                    $project: {
                        _id: 1,
                        studentId: 1,
                        name: 1,
                        class: 1,
                        rollNo: 1,
                        parentPhone: 1,
                        totalFee: 1,
                        totalPaid: "$tuitionPaidSum",
                        pendingAmount: 1,
                        paymentStatus: {
                            $cond: [
                                { $eq: ["$tuitionPaidSum", 0] }, "unpaid", "partial"
                            ]
                        }
                    }
                }
            ]),
            Student.aggregate([
                { $match: match },
                {
                    $addFields: {
                        tuitionPaidSum: {
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
                { $addFields: { pendingAmount: { $subtract: ["$totalFee", "$tuitionPaidSum"] } } },
                { $match: { pendingAmount: { $gt: 0 } } },
                { $group: { _id: null, count: { $sum: 1 }, totalPending: { $sum: "$pendingAmount" } } }
            ])
        ]);

        const totalData = totalCountResult[0] || { count: 0, totalPending: 0 };

        res.json({
            success: true,
            count: pendingStudents.length,
            total: totalData.count,
            pages: Math.ceil(totalData.count / limitNum),
            currentPage: parseInt(page),
            totalPending: totalData.totalPending,
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
            {
                $addFields: {
                    classOrder: {
                        $indexOfArray: [
                            ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'],
                            "$_id"
                        ]
                    }
                }
            },
            { $sort: { classOrder: 1 } }
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
        const staff = await Staff.find({ isActive: true }).sort({ staffId: 1 });

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
        })).sort((a, b) => {
            const dateA = new Date(a.month.split(' ')[1], months.indexOf(a.month.split(' ')[0]));
            const dateB = new Date(b.month.split(' ')[1], months.indexOf(b.month.split(' ')[0]));
            return dateB.getTime() - dateA.getTime();
        });

        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
