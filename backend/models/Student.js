const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'online', 'cheque', 'dd'],
        default: 'cash'
    },
    receiptNo: {
        type: String,
        unique: true,
        sparse: true   // allows multiple null values
    },
    remarks: String,
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { _id: true });

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        enum: ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
    },

    rollNo: {
        type: String,
        required: [true, 'Roll number is required']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'male'
    },
    dateOfBirth: Date,
    address: String,
    // Parent Details
    parentName: {
        type: String,
        required: [true, 'Parent/Guardian name is required']
    },
    parentPhone: {
        type: String,
        required: [true, 'Parent phone is required']
    },
    parentEmail: String,
    parentOccupation: String,
    // Fee Details
    totalFee: {
        type: Number,
        required: [true, 'Total fee is required'],
        min: 0
    },
    feePayments: [feePaymentSchema],
    // Linked user account
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    photo: String,
    academicYear: {
        type: String,
        default: '2024-25'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: Total paid amount
studentSchema.virtual('totalPaid').get(function () {
    return this.feePayments.reduce((sum, p) => sum + p.amount, 0);
});

// Virtual: Pending amount
studentSchema.virtual('pendingAmount').get(function () {
    return this.totalFee - this.totalPaid;
});

// Virtual: Payment status
studentSchema.virtual('paymentStatus').get(function () {
    const paid = this.totalPaid;
    if (paid >= this.totalFee) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
});

// Auto-generate student ID before saving
studentSchema.pre('save', async function (next) {
    if (!this.studentId) {
        const count = await mongoose.model('Student').countDocuments();
        this.studentId = `STU${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Index for faster queries
studentSchema.index({ class: 1 });
studentSchema.index({ name: 'text' });

module.exports = mongoose.model('Student', studentSchema);
