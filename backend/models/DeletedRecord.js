const mongoose = require('mongoose');

const deletedRecordSchema = new mongoose.Schema({
    recordType: {
        type: String,
        required: true,
        enum: ['Student', 'Staff', 'User', 'Fee Payment', 'Salary Payment', 'Leave']
    },
    originalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId
    },
    description: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deletedAt: {
        type: Date,
        default: Date.now
    },
    reverted: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('DeletedRecord', deletedRecordSchema);
