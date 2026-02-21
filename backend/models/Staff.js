const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema({
    month: {
        type: String,
        required: true // e.g., "January 2024"
    },
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
        enum: ['cash', 'bank_transfer', 'cheque'],
        default: 'bank_transfer'
    },
    slipNo: {
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

const staffSchema = new mongoose.Schema({
    staffId: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Staff name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true
    },
    phone: {
        type: String,
        required: [true, 'Phone is required']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['teacher', 'principal', 'vice_principal', 'admin_staff', 'librarian', 'peon', 'guard', 'accountant', 'other']
    },
    subject: String, // For teachers
    department: String,
    qualification: String,
    experience: Number, // in years
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    address: String,
    // Salary
    monthlySalary: {
        type: Number,
        required: [true, 'Monthly salary is required'],
        min: 0
    },
    salaryPayments: [salaryPaymentSchema],
    // Linked user account
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    joiningDate: {
        type: Date,
        required: [true, 'Joining date is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    photo: String,
    bankAccount: String,
    bankName: String,
    ifscCode: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: Total salary paid
staffSchema.virtual('totalSalaryPaid').get(function () {
    return this.salaryPayments.reduce((sum, p) => sum + p.amount, 0);
});

// Auto-generate staff ID
staffSchema.pre('save', async function (next) {
    if (!this.staffId) {
        const count = await mongoose.model('Staff').countDocuments();
        this.staffId = `STF${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

staffSchema.index({ isActive: 1 });
staffSchema.index({ role: 1 });
staffSchema.index({ name: 'text' });

module.exports = mongoose.model('Staff', staffSchema);
