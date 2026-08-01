const express = require('express');
const { getOrgSettings, updateOrgSettings } = require('../controllers/orgSettings.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth, requireRole } = require('../middleware/auth');
const { orgSettingsUpdateSchema } = require('../utils/schemas');

const router = express.Router();

router.get('/org-settings', getOrgSettings); // public
router.put(
  '/admin/org-settings',
  requireAdminAuth,
  requireRole('SUPER_ADMIN'),
  validate(orgSettingsUpdateSchema),
  updateOrgSettings
);

module.exports = router;
