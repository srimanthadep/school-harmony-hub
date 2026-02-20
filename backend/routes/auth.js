const express = require('express');
const router = express.Router();
const {
    register, login, getMe, changePassword, getUsers, updateUserStatus
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register); // Used during seeding; restrict in production

router.use(protect); // All routes below require auth
router.get('/me', getMe);
router.put('/change-password', changePassword);
router.get('/users', authorize('admin', 'owner'), getUsers);
router.put('/users/:id/status', authorize('admin', 'owner'), updateUserStatus);

module.exports = router;
