const express = require('express');
const {
  createClinic,
  listClinics,
  createClinicUser,
  clinicLogin,
  validateCoupon,
  redeemCoupon,
  clinicRedemptionHistory,
} = require('../controllers/clinic.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth, requireRole, requireClinicAuth } = require('../middleware/auth');
const {
  clinicCreateSchema,
  clinicUserCreateSchema,
  clinicLoginSchema,
  couponCodeSchema,
} = require('../utils/schemas');

const router = express.Router();

// --- Admin: manage the partner clinic network ---
router.post(
  '/admin/clinics',
  requireAdminAuth,
  requireRole('SUPER_ADMIN'),
  validate(clinicCreateSchema),
  createClinic
);
router.get('/admin/clinics', requireAdminAuth, listClinics);
router.post(
  '/admin/clinics/:clinicId/users',
  requireAdminAuth,
  requireRole('SUPER_ADMIN'),
  validate(clinicUserCreateSchema),
  createClinicUser
);

// --- Clinic-facing portal ---
router.post('/clinic/login', validate(clinicLoginSchema), clinicLogin);
router.post('/clinic/coupons/validate', requireClinicAuth, validate(couponCodeSchema), validateCoupon);
router.post('/clinic/coupons/:id/redeem', requireClinicAuth, redeemCoupon);
router.get('/clinic/coupons/history', requireClinicAuth, clinicRedemptionHistory);

module.exports = router;
