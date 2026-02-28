const express = require('express');
const { getGeminiContext } = require('../controllers/geminiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get Gemini context data - only for authenticated users
router.get('/context', protect, getGeminiContext);

module.exports = router;
