const express = require('express');
const router = express.Router();
const {
    getStudents, getStudent, createStudent, updateStudent, deleteStudent,
    recordPayment, getPaymentHistory, getStudentStats, editPayment, promoteStudents
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Stats
router.get('/stats/overview', authorize('admin', 'owner'), getStudentStats);

// Promote students
router.post('/promote', authorize('admin', 'owner'), promoteStudents);

// Student list / creation
router.route('/')
    .get(authorize('admin', 'owner'), getStudents)
    .post(authorize('admin', 'owner'), createStudent);

// Individual student
router.route('/:id')
    .get(authorize('admin', 'owner', 'student'), getStudent)
    .put(authorize('admin', 'owner'), updateStudent)
    .delete(authorize('admin', 'owner'), deleteStudent);

// Payments
router.route('/:id/payments')
    .get(authorize('admin', 'owner', 'student'), getPaymentHistory)
    .post(authorize('admin', 'owner'), recordPayment);

// Edit a specific payment — OWNER ONLY (admin explicitly blocked in controller)
router.put('/:id/payments/:paymentId', authorize('owner'), editPayment);

module.exports = router;
