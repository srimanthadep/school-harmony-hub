const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    schoolName: {
        type: String,
        default: 'Sunrise International School'
    },
    schoolAddress: {
        type: String,
        default: '123 Education Street, Knowledge City - 400001'
    },
    schoolPhone: {
        type: String,
        default: '+91 98765 43210'
    },
    schoolEmail: {
        type: String,
        default: 'info@sunriseschool.edu.in'
    },
    schoolWebsite: String,
    principalName: {
        type: String,
        default: 'Dr. Rajesh Kumar'
    },
    academicYear: {
        type: String,
        default: '2025-26'
    },
    currency: {
        type: String,
        default: '₹'
    },
    receiptPrefix: {
        type: String,
        default: 'RCPT'
    },
    salarySlipPrefix: {
        type: String,
        default: 'SAL'
    },
    lastReceiptNo: {
        type: Number,
        default: 1000
    },
    lastSlipNo: {
        type: Number,
        default: 1000
    },
    logoUrl: String,
    // Singleton enforcement — only one settings document allowed
    _singleton: {
        type: String,
        default: 'singleton',
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
