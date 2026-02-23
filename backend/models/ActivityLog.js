const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true, // e.g., 'UPDATE_STUDENT_FEE', 'DELETE_STAFF'
    },
    module: {
        type: String,
        required: true, // e.g., 'STUDENTS', 'STAFF', 'FINANCE'
    },
    description: String,
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetId: mongoose.Schema.Types.ObjectId, // ID of the student/staff being modified
    oldData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
