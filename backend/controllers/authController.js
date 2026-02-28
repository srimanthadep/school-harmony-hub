const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const DeletedRecord = require('../models/DeletedRecord');
const ActivityLog = require('../models/ActivityLog');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, profileId, profileModel } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const user = await User.create({ name, email, password, role, profileId, profileModel });
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileId: user.profileId
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        if (!user.isActive) {
            // Auto-reactivate specific super admin email if deactivated
            if (user.email === process.env.SUPER_ADMIN_EMAIL) {
                user.isActive = true;
                await user.save({ validateBeforeSave: false });
                console.log(`Super Admin ${user.email} auto-reactivated on login attempt.`);
            } else {
                return res.status(401).json({ success: false, message: 'Account has been deactivated' });
            }
        }

        // Background updates (last login & activity log) in parallel to speed up response
        Promise.all([
            User.findByIdAndUpdate(user._id, { lastLogin: new Date() }, { validateBeforeSave: false }),
            ActivityLog.create({
                action: 'LOGIN',
                module: 'AUTH',
                description: `User logged in: ${user.name} (${user.email})`,
                performedBy: user._id,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
                userAgent: req.headers['user-agent'] || ''
            })
        ]).catch(err => console.error('Error recording login activity:', err));

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileId: user.profileId,
                profileModel: user.profileModel
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        user.passwordChangedAt = new Date(); // Fix #5: invalidate old JWTs
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all users (admin)
// @route   GET /api/auth/users
// @access  Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, count: users.length, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update user status (admin)
// @route   PUT /api/auth/users/:id/status
// @access  Admin
exports.updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent deactivating an owner/super admin
        if ((user.role === 'owner' || user.email === process.env.SUPER_ADMIN_EMAIL) && req.body.isActive === false) {
            return res.status(400).json({
                success: false,
                message: 'Super Admin accounts cannot be deactivated to prevent lockout'
            });
        }

        user.isActive = req.body.isActive;
        await user.save({ validateBeforeSave: false });

        res.json({ success: true, message: 'User status updated', user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create a new user (Super Admin)
// @route   POST /api/auth/users
// @access  Super Admin
exports.adminCreateUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const user = await User.create({ name, email, password, role });
        res.status(201).json({ success: true, message: 'User created successfully', user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update user role (Super Admin)
// @route   PUT /api/auth/users/:id/role
// @access  Super Admin
exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Prevent changing role of an owner/super admin
        if ((user.role === 'owner' || user.email === process.env.SUPER_ADMIN_EMAIL) && req.body.role !== 'owner') {
            return res.status(400).json({ success: false, message: 'Super Admin role cannot be changed to prevent loss of access' });
        }

        user.role = req.body.role;
        await user.save({ validateBeforeSave: false });
        res.json({ success: true, message: 'User role updated', user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update user password (Super Admin)
// @route   PUT /api/auth/users/:id/password
// @access  Super Admin
exports.adminResetPassword = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        user.password = req.body.password;
        await user.save();
        res.json({ success: true, message: 'User password updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Edit user details (Super Admin)
// @route   PUT /api/auth/users/:id
// @access  Super Admin
exports.adminEditUser = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = email;
        }

        if (name) user.name = name;

        await user.save({ validateBeforeSave: false });
        res.json({ success: true, message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete user (Super Admin)
// @route   DELETE /api/auth/users/:id
// @access  Super Admin
exports.adminDeleteUser = async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Prevent deleting an owner/super admin
        if (user.role === 'owner' || user.email === process.env.SUPER_ADMIN_EMAIL) {
            return res.status(400).json({ success: false, message: 'Super Admin accounts cannot be deleted' });
        }

        await user.deleteOne();

        await DeletedRecord.create({
            recordType: 'User',
            originalId: user._id,
            description: `Deleted user account: ${user.name} (${user.email})`,
            data: user.toObject(),
            deletedBy: req.user.id
        });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all deleted records history
// @route   GET /api/auth/deleted-history
// @access  Super Admin
exports.getDeletedRecords = async (req, res) => {
    try {
        const records = await DeletedRecord.find()
            .populate('deletedBy', 'name email role')
            .sort('-deletedAt');
        res.json({ success: true, records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Revert a deleted record
// @route   POST /api/auth/deleted-history/:id/revert
// @access  Super Admin
exports.revertDeletedRecord = async (req, res) => {
    try {
        const record = await DeletedRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
        if (record.reverted) return res.status(400).json({ success: false, message: 'Record already reverted' });

        const { recordType, originalId, data, parentId } = record;

        if (recordType === 'User') {
            const exists = await User.findById(originalId);
            if (exists) return res.status(400).json({ success: false, message: 'User already exists' });
            const emailExists = await User.findOne({ email: data.email });
            if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use by another user' });

            await User.create(data);
        } else if (recordType === 'Student') {
            const exists = await Student.findById(originalId);
            if (exists) {
                exists.isActive = true;
                await exists.save({ validateBeforeSave: false });
            } else {
                await Student.create(data);
            }
        } else if (recordType === 'Staff') {
            const exists = await Staff.findById(originalId);
            if (exists) {
                exists.isActive = true;
                await exists.save({ validateBeforeSave: false });
            } else {
                await Staff.create(data);
            }
        } else if (recordType === 'Fee Payment') {
            if (!parentId) return res.status(400).json({ success: false, message: 'Cannot revert nested record without parent ID context.' });
            const student = await Student.findById(parentId);
            if (!student) return res.status(404).json({ success: false, message: 'Parent student not found to revert fee payment.' });
            student.feePayments.push(data);
            await student.save();
        } else if (recordType === 'Salary Payment') {
            if (!parentId) return res.status(400).json({ success: false, message: 'Cannot revert nested record without parent ID context.' });
            const staff = await Staff.findById(parentId);
            if (!staff) return res.status(404).json({ success: false, message: 'Parent staff not found to revert salary.' });
            staff.salaryPayments.push(data);
            await staff.save();
        } else if (recordType === 'Leave') {
            if (!parentId) return res.status(400).json({ success: false, message: 'Cannot revert nested record without parent ID context.' });
            const staff = await Staff.findById(parentId);
            if (!staff) return res.status(404).json({ success: false, message: 'Parent staff not found to revert leave.' });
            staff.leaves.push(data);
            await staff.save({ validateModifiedOnly: true });
        } else {
            return res.status(400).json({ success: false, message: 'Unknown record type' });
        }

        record.reverted = true;
        await record.save();

        res.json({ success: true, message: 'Record reverted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Undo a reverted record
// @route   POST /api/auth/deleted-history/:id/undo-revert
// @access  Super Admin
exports.undoRevertDeletedRecord = async (req, res) => {
    try {
        const record = await DeletedRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
        if (!record.reverted) return res.status(400).json({ success: false, message: 'Record has not been reverted yet' });

        const { recordType, originalId, parentId } = record;

        if (recordType === 'User') {
            await User.findByIdAndDelete(originalId);
        } else if (recordType === 'Student') {
            const student = await Student.findById(originalId);
            if (student) {
                student.isActive = false;
                await student.save({ validateBeforeSave: false });
            }
        } else if (recordType === 'Staff') {
            const staff = await Staff.findById(originalId);
            if (staff) {
                staff.isActive = false;
                await staff.save({ validateBeforeSave: false });
            }
        } else if (recordType === 'Fee Payment') {
            if (!parentId) return res.status(400).json({ success: false, message: 'Cannot undo nested record without parent ID context.' });
            const student = await Student.findById(parentId);
            if (!student) return res.status(404).json({ success: false, message: 'Parent student not found to undo fee payment revert.' });
            student.feePayments.pull(originalId);
            await student.save();
        } else if (recordType === 'Salary Payment') {
            if (!parentId) return res.status(400).json({ success: false, message: 'Cannot undo nested record without parent ID context.' });
            const staff = await Staff.findById(parentId);
            if (!staff) return res.status(404).json({ success: false, message: 'Parent staff not found to undo salary revert.' });
            staff.salaryPayments.pull(originalId);
            await staff.save();
        } else if (recordType === 'Leave') {
            if (!parentId) return res.status(400).json({ success: false, message: 'Cannot undo nested record without parent ID context.' });
            const staff = await Staff.findById(parentId);
            if (!staff) return res.status(404).json({ success: false, message: 'Parent staff not found to undo leave revert.' });
            staff.leaves.pull(originalId);
            await staff.save({ validateModifiedOnly: true });
        } else {
            return res.status(400).json({ success: false, message: 'Unknown record type' });
        }

        record.reverted = false;
        await record.save();

        res.json({ success: true, message: 'Revert undone successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};