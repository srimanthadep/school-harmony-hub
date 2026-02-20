const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getFeeStructures, upsertFeeStructure } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'owner'));

router.route('/').get(getSettings).put(updateSettings);
router.route('/fee-structures').get(getFeeStructures).post(upsertFeeStructure);

module.exports = router;
