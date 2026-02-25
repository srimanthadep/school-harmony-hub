const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
    date: {
        type: String,
        required: [true, 'Date is required']
    },
    type: {
        type: String,
        enum: ['student', 'staff'],
        default: 'student'
    },
    records: {
        type: [attendanceRecordSchema],
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'At least one attendance record is required'
        }
    }
}, {
    timestamps: true
});

attendanceSchema.index({ date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
