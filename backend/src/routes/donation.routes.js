const express = require('express');
const {
  createDonationOrder,
  verifyDonation,
  listDonations,
} = require('../controllers/donation.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth, requireRole } = require('../middleware/auth');
const { donationOrderSchema } = require('../utils/schemas');

const router = express.Router();

router.post('/create-order', validate(donationOrderSchema), createDonationOrder);
router.post('/verify', verifyDonation);
router.get('/', requireAdminAuth, requireRole('SUPER_ADMIN', 'FINANCE'), listDonations);

module.exports = router;
