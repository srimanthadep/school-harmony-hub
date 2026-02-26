const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'owner', 'student', 'staff'],
        default: 'student'
    },
    // Link to student or staff profile
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'profileModel'
    },
    profileModel: {
        type: String,
        enum: ['Student', 'Staff']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving (SHA-256 for instant performance)
userSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();
    this.password = crypto.createHash('sha256')
        .update(this.password + (process.env.JWT_SECRET || 'fallback_salt'))
        .digest('hex');
    next();
});

// Compare password
userSchema.methods.comparePassword = function (candidatePassword) {
    const hash = crypto.createHash('sha256')
        .update(candidatePassword + (process.env.JWT_SECRET || 'fallback_salt'))
        .digest('hex');
    return hash === this.password;
};

module.exports = mongoose.model('User', userSchema);
