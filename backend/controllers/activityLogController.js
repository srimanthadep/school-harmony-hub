const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get activity logs with optional filters
// @route   GET /api/activity-logs
// @access  Admin / Super Admin
exports.getActivityLogs = asyncHandler(async (req, res) => {
    const { action, module: mod, startDate, endDate, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (action) query.action = { $regex: action, $options: 'i' };
    if (mod) query.module = mod.toUpperCase();
    if (search) {
        query.description = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

    res.json({
        success: true,
        count: logs.length,
        total,
        pages: Math.ceil(total / parseInt(limit)),
        logs
    });
});

// @desc    Export activity logs as CSV
// @route   GET /api/activity-logs/export
// @access  Admin / Super Admin
exports.exportActivityLogs = asyncHandler(async (req, res) => {
    const { action, module: mod, startDate, endDate, search } = req.query;

    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    if (mod) query.module = mod.toUpperCase();
    if (search) {
        query.description = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    const logs = await ActivityLog.find(query)
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .limit(5000);

    const escape = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const header = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Module', 'Description', 'IP Address', 'Old Data', 'New Data'];
    const rows = logs.map(log => [
        escape(new Date(log.createdAt).toISOString()),
        escape(log.performedBy?.name || ''),
        escape(log.performedBy?.email || ''),
        escape(log.performedBy?.role || ''),
        escape(log.action),
        escape(log.module),
        escape(log.description || ''),
        escape(log.ipAddress || ''),
        escape(log.oldData ? JSON.stringify(log.oldData) : ''),
        escape(log.newData ? JSON.stringify(log.newData) : '')
    ]);

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
    res.send(csv);
});
