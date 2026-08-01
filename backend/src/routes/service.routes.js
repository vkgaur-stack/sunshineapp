const express = require('express');
const { listServices, createService } = require('../controllers/service.controller');
const { requireAdminAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', listServices);
router.post('/', requireAdminAuth, requireRole('SUPER_ADMIN'), createService);

module.exports = router;
