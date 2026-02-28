const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    class: {
        type: String,
        required: true,
        enum: ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
    },
    academicYear: {
        type: String,
        default: '2025-26'
    },
    tuitionFee: { type: Number, default: 0 },
    admissionFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    libraryFee: { type: Number, default: 0 },
    sportsFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    miscFee: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-calculate total
feeStructureSchema.pre('save', function (next) {
    this.totalFee = this.tuitionFee + this.admissionFee + this.examFee +
        this.libraryFee + this.sportsFee + this.transportFee + this.miscFee;
    next();
});

// Prevent duplicate fee structures for the same class and year
feeStructureSchema.index({ class: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
