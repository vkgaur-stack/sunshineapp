const express = require('express');
const { createApiKey, listApiKeys, revokeApiKey } = require('../controllers/apiKey.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth, requireRole } = require('../middleware/auth');
const { apiKeyCreateSchema } = require('../utils/schemas');

const router = express.Router();

router.post('/', requireAdminAuth, requireRole('SUPER_ADMIN'), validate(apiKeyCreateSchema), createApiKey);
router.get('/', requireAdminAuth, requireRole('SUPER_ADMIN'), listApiKeys);
router.delete('/:id', requireAdminAuth, requireRole('SUPER_ADMIN'), revokeApiKey);

module.exports = router;
