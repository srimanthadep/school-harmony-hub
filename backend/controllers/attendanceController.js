const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

// @desc    Save attendance for a given date
// @route   POST /api/attendance
// @access  Public (attendance app does not require user login)
exports.saveAttendance = async (req, res) => {
    try {
        const { date, records, type = 'student' } = req.body;

        if (!date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: 'date and records are required' });
        }

        // Merge new records with existing ones: keep existing records whose
        // studentId is not in the incoming batch, then append all incoming records.
        const existing = await Attendance.findOne({ date, type });
        let mergedRecords = records;
        if (existing) {
            const incomingIds = new Set(records.map(r => r.studentId).filter(id => id != null));
            const retained = existing.records.filter(r => !incomingIds.has(r.studentId));
            mergedRecords = [...retained, ...records];
        }

        const attendance = await Attendance.findOneAndUpdate(
            { date, type },
            { $set: { records: mergedRecords, type } },
            { upsert: true, new: true, runValidators: true }
        );

        // Auto-record leaves for absent staff members
        if (type === 'staff') {
            const absentRecords = records.filter(r => r.status === 'absent');
            for (const record of absentRecords) {
                try {
                    const staff = await Staff.findById(record.studentId);
                    if (staff) {
                        const leaveDate = new Date(date + 'T00:00:00.000Z');
                        const alreadyHasLeave = staff.leaves.some(
                            l => new Date(l.date).toISOString().split('T')[0] === date
                        );
                        if (!alreadyHasLeave) {
                            staff.leaves.push({
                                date: leaveDate,
                                reason: 'Absent (auto-recorded from attendance)',
                                status: 'approved'
                            });
                            await staff.save({ validateModifiedOnly: true });
                        }
                    }
                } catch (leaveErr) {
                    console.error(`Failed to auto-record leave for staff ${record.studentId}:`, leaveErr.message);
                }
            }
        }

        res.status(200).json({ success: true, attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get attendance for a given date
// @route   GET /api/attendance/:date
// @access  Public
exports.getAttendance = async (req, res) => {
    try {
        const type = req.query.type || 'student';
        const attendance = await Attendance.findOne({ date: req.params.date, type });
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'No attendance found for this date' });
        }
        res.json({ success: true, attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get attendance records within a date range
// @route   GET /api/attendance/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Public
exports.getAttendanceRange = async (req, res) => {
    try {
        const { start, end, type } = req.query;

        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'start and end query parameters are required' });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start) || !dateRegex.test(end)) {
            return res.status(400).json({ success: false, message: 'start and end must be valid dates in YYYY-MM-DD format' });
        }

        if (start > end) {
            return res.status(400).json({ success: false, message: 'start date must not be after end date' });
        }

        const query = { date: { $gte: start, $lte: end } };
        if (type) query.type = type;

        const records = await Attendance.find(query).sort({ date: 1 });

        res.json({ success: true, records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
