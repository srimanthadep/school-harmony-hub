const StaffAttendance = require('../models/StaffAttendance');

// @desc    Save staff attendance for a given date
// @route   POST /api/staff-attendance
// @access  Public
exports.saveStaffAttendance = async (req, res) => {
    try {
        const { date, records } = req.body;

        if (!date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: 'date and records are required' });
        }

        // Merge new records with existing ones
        const existing = await StaffAttendance.findOne({ date });
        let mergedRecords = records;
        if (existing) {
            const incomingIds = new Set(records.map(r => r.staffId).filter(id => id != null));
            const retained = existing.records.filter(r => !incomingIds.has(r.staffId));
            mergedRecords = [...retained, ...records];
        }

        const attendance = await StaffAttendance.findOneAndUpdate(
            { date },
            { $set: { records: mergedRecords } },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ success: true, attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get staff attendance for a given date
// @route   GET /api/staff-attendance/:date
// @access  Public
exports.getStaffAttendance = async (req, res) => {
    try {
        const attendance = await StaffAttendance.findOne({ date: req.params.date });
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'No attendance found for this date' });
        }
        res.json({ success: true, attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get staff attendance records within a date range
// @route   GET /api/staff-attendance/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Public
exports.getStaffAttendanceRange = async (req, res) => {
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

        const records = await StaffAttendance.find({
            date: { $gte: start, $lte: end }
        }).sort({ date: 1 });

        res.json({ success: true, records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
