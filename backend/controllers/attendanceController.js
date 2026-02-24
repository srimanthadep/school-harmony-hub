const Attendance = require('../models/Attendance');

// @desc    Save attendance for a given date
// @route   POST /api/attendance
// @access  Public (attendance app does not require user login)
exports.saveAttendance = async (req, res) => {
    try {
        const { date, records } = req.body;

        if (!date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: 'date and records are required' });
        }

        // Merge new records with existing ones: keep existing records whose
        // studentId is not in the incoming batch, then append all incoming records.
        const existing = await Attendance.findOne({ date });
        let mergedRecords = records;
        if (existing) {
            const incomingIds = new Set(records.map(r => r.studentId).filter(id => id != null));
            const retained = existing.records.filter(r => !incomingIds.has(r.studentId));
            mergedRecords = [...retained, ...records];
        }

        const attendance = await Attendance.findOneAndUpdate(
            { date },
            { $set: { records: mergedRecords } },
            { upsert: true, new: true, runValidators: true }
        );

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
        const attendance = await Attendance.findOne({ date: req.params.date });
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
        const { start, end } = req.query;

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

        const records = await Attendance.find({
            date: { $gte: start, $lte: end }
        }).sort({ date: 1 });

        res.json({ success: true, records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
