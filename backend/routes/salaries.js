const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Salaries endpoint - use /api/staff/:id/salaries' });
});

module.exports = router;
