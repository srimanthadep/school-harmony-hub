const mongoose = require('mongoose');

const bookFeeStructureSchema = new mongoose.Schema({
    class: {
        type: String,
        required: true,
        enum: ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
    },
    academicYear: {
        type: String,
        default: '2025-26'
    },
    readingBookFee: { type: Number, default: 0 },
    textBooksFee: { type: Number, default: 0 },
    practiceWorkBookFee: { type: Number, default: 0 },
    funWithDotBookFee: { type: Number, default: 0 },
    dairyFee: { type: Number, default: 0 },
    idCardFee: { type: Number, default: 0 },
    coversFee: { type: Number, default: 0 },
    noteBooksFee: { type: Number, default: 0 },
    miscFee: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-calculate total
bookFeeStructureSchema.pre('save', function (next) {
    this.totalFee = this.readingBookFee + this.textBooksFee + this.practiceWorkBookFee + this.funWithDotBookFee +
        this.dairyFee + this.idCardFee + this.coversFee + this.noteBooksFee + this.miscFee;
    next();
});

// Prevent duplicate book fee structures for the same class
bookFeeStructureSchema.index({ class: 1 }, { unique: true });

module.exports = mongoose.model('BookFeeStructure', bookFeeStructureSchema);
