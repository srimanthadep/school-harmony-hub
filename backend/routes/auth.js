const express = require('express');
const router = express.Router();
const {
    register, login, getMe, changePassword, getUsers, updateUserStatus,
    adminCreateUser, updateUserRole, adminResetPassword, adminEditUser, adminDeleteUser,
    getDeletedRecords, revertDeletedRecord, undoRevertDeletedRecord
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const authorizeSuperAdmin = (req, res, next) => {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const authorizedEmails = [superAdminEmail, 'superadmin@school.edu'].filter(Boolean);
    if (req.user && authorizedEmails.includes(req.user.email)) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Super Admin access required for this operational panel.' });
};

router.post('/login', login);

// Fix #1: Disabled in production — only allow during seeding in development
router.post('/register', (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Registration endpoint is disabled in production.' });
    }
    next();
}, register);

router.use(protect); // All routes below require auth
router.get('/me', getMe);
router.put('/change-password', changePassword);
router.get('/users', authorize('admin', 'owner'), getUsers);
router.put('/users/:id/status', authorize('admin', 'owner'), updateUserStatus);

// Super Admin Only
router.post('/users', authorizeSuperAdmin, adminCreateUser);
router.put('/users/:id/role', authorizeSuperAdmin, updateUserRole);
router.put('/users/:id/password', authorizeSuperAdmin, adminResetPassword);
router.put('/users/:id', authorizeSuperAdmin, adminEditUser);
router.delete('/users/:id', authorizeSuperAdmin, adminDeleteUser);
router.get('/deleted-history', authorizeSuperAdmin, getDeletedRecords);
router.post('/deleted-history/:id/revert', authorizeSuperAdmin, revertDeletedRecord);
router.post('/deleted-history/:id/undo-revert', authorizeSuperAdmin, undoRevertDeletedRecord);

module.exports = router;
