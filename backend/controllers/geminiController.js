const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const StaffAttendance = require('../models/StaffAttendance');
const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all data for Gemini AI context
// @route   GET /api/gemini/context
exports.getGeminiContext = asyncHandler(async (req, res) => {
    try {
        // Get students with fee status
        const students = await Student.find({ isActive: true })
            .select('studentId name class parentName totalFee feePayments')
            .lean();

        const studentsSummary = students.map(s => {
            const totalPaid = (s.feePayments || [])
                .filter(p => !p.feeType || p.feeType === 'tuition')
                .reduce((sum, p) => sum + p.amount, 0);
            
            const pendingAmount = s.totalFee - totalPaid;
            const status = totalPaid >= s.totalFee ? 'Paid' : 
                          totalPaid > 0 ? 'Partial' : 'Unpaid';

            return {
                studentId: s.studentId,
                name: s.name,
                class: s.class,
                parentName: s.parentName,
                totalFee: s.totalFee,
                paid: totalPaid,
                pending: pendingAmount,
                status: status
            };
        });

        // Get staff information
        const staff = await Staff.find()
            .select('name email role subject monthlySalary')
            .lean();

        // Get today's attendance stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAttendance = await Attendance.find({
            date: { $gte: today, $lt: tomorrow }
        }).lean();

        const totalTodayPresent = todayAttendance.filter(a => a.status === 'present').length;
        const totalTodayAbsent = todayAttendance.filter(a => a.status === 'absent').length;

        const staffAttendanceToday = await StaffAttendance.find({
            date: { $gte: today, $lt: tomorrow }
        }).lean();

        const staffPresentToday = staffAttendanceToday.filter(a => a.status === 'present').length;

        // Get fee statistics
        const stuentsWithNullFee = studentsSummary.filter(s => s.totalFee === 0);
        const studentsPaidFully = studentsSummary.filter(s => s.status === 'Paid');
        const studentsPartialPay = studentsSummary.filter(s => s.status === 'Partial');
        const studentsUnpaid = studentsSummary.filter(s => s.status === 'Unpaid');

        const totalFeeCollected = studentsSummary.reduce((sum, s) => sum + s.paid, 0);
        const totalFeePending = studentsSummary.reduce((sum, s) => sum + s.pending, 0);

        const geminiContext = {
            timestamp: new Date().toISOString(),
            schoolInfo: {
                name: 'Oxford School, Chityala',
                totalStudents: students.length,
                totalStaff: staff.length,
            },
            studentData: {
                total: students.length,
                summary: studentsSummary,
                byFeeStatus: {
                    paid: studentsPaidFully.length,
                    partial: studentsPartialPay.length,
                    unpaid: studentsUnpaid.length,
                    zero: stuentsWithNullFee.length,
                },
                studentsWithZeroFee: stuentsWithNullFee,
            },
            staffData: {
                total: staff.length,
                list: staff,
            },
            attendanceData: {
                today: {
                    studentPresent: totalTodayPresent,
                    studentAbsent: totalTodayAbsent,
                    staffPresent: staffPresentToday,
                }
            },
            financialSummary: {
                totalFeeCollected: totalFeeCollected,
                totalFeePending: totalFeePending,
                totalStudentsWithZeroFee: stuentsWithNullFee.length,
                percentageCollected: students.length > 0 
                    ? Math.round((totalFeeCollected / (totalFeeCollected + totalFeePending)) * 100) 
                    : 0,
            }
        };

        res.status(200).json(geminiContext);
    } catch (error) {
        console.error('Error fetching Gemini context:', error);
        res.status(500).json({ error: 'Failed to fetch context data' });
    }
});
