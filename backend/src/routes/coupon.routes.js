const express = require('express');
const {
  generateCoupons,
  assignCoupon,
  listCoupons,
  getCouponQrCode,
} = require('../controllers/coupon.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth, requireRole } = require('../middleware/auth');
const { couponGenerateSchema, couponAssignSchema } = require('../utils/schemas');

const router = express.Router();

// Public — QR image is safe to expose (the code is the printed secret, the
// image endpoint just renders it; knowing a random UUID's code isn't
// possible without already having the coupon).
router.get('/:code/qr-code', getCouponQrCode);

// Admin
router.post(
  '/generate',
  requireAdminAuth,
  requireRole('SUPER_ADMIN', 'FINANCE'),
  validate(couponGenerateSchema),
  generateCoupons
);
router.post(
  '/:id/assign',
  requireAdminAuth,
  requireRole('SUPER_ADMIN', 'CAMP_COORDINATOR'),
  validate(couponAssignSchema),
  assignCoupon
);
router.get('/', requireAdminAuth, listCoupons);

module.exports = router;
