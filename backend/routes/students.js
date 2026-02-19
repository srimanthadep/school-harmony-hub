const express = require('express');
const router = express.Router();
const {
    getStudents, getStudent, createStudent, updateStudent, deleteStudent,
    recordPayment, getPaymentHistory, getStudentStats
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/overview', authorize('admin'), getStudentStats);
router.route('/')
    .get(authorize('admin'), getStudents)
    .post(authorize('admin'), createStudent);

router.route('/:id')
    .get(authorize('admin', 'student'), getStudent)
    .put(authorize('admin'), updateStudent)
    .delete(authorize('admin'), deleteStudent);

router.route('/:id/payments')
    .get(authorize('admin', 'student'), getPaymentHistory)
    .post(authorize('admin'), recordPayment);

module.exports = router;
