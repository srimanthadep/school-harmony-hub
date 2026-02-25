const mongoose = require('mongoose');

const staffAttendanceRecordSchema = new mongoose.Schema({
    staffId: {
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

const staffAttendanceSchema = new mongoose.Schema({
    date: {
        type: String,
        required: [true, 'Date is required']
    },
    records: {
        type: [staffAttendanceRecordSchema],
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'At least one attendance record is required'
        }
    }
}, {
    timestamps: true
});

staffAttendanceSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
