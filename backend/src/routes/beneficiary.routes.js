const express = require('express');
const {
  registerBeneficiary,
  lookupBeneficiary,
  listBeneficiaries,
} = require('../controllers/beneficiary.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth } = require('../middleware/auth');
const {
  beneficiaryRegisterSchema,
  beneficiaryLookupSchema,
} = require('../utils/schemas');

const router = express.Router();

// Public
router.post('/register', validate(beneficiaryRegisterSchema), registerBeneficiary);
router.post('/lookup', validate(beneficiaryLookupSchema), lookupBeneficiary);

// Admin (mounted separately below in admin.routes.js as well, kept here for reuse)
router.get('/', requireAdminAuth, listBeneficiaries);

module.exports = router;
