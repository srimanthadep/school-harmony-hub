const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Expense type is required'],
        enum: ['electricity_bill', 'land_lease', 'van_fan_fee', 'van_daily_diesel', 'other']
    },
    customType: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'bank_transfer', 'cheque', 'online'],
        default: 'cash'
    },
    paidBy: {
        type: String,
        trim: true
    },
    academicYear: {
        type: String,
        default: '2025-26'
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

expenseSchema.index({ type: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ academicYear: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
