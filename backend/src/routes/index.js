const express = require('express');

const authRoutes = require('./auth.routes');
const beneficiaryRoutes = require('./beneficiary.routes');
const serviceRoutes = require('./service.routes');
const campRoutes = require('./camp.routes');
const appointmentRoutes = require('./appointment.routes');
const donationRoutes = require('./donation.routes');
const engagementRoutes = require('./engagement.routes');
const couponRoutes = require('./coupon.routes');
const clinicRoutes = require('./clinic.routes');
const impactRoutes = require('./impact.routes');
const notificationRoutes = require('./notification.routes');
const webhookRoutes = require('./webhook.routes');
const orgSettingsRoutes = require('./orgSettings.routes');
const apiKeyRoutes = require('./apiKey.routes');
const externalRoutes = require('./external.routes');
const reportsRoutes = require('./reports.routes');

const router = express.Router();

// Public + shared routes
router.use('/admin', authRoutes); // POST /api/admin/login
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/services', serviceRoutes);
router.use('/camps', campRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/donations', donationRoutes);
router.use('/', engagementRoutes); // /partner-requests, /contact-messages, /admin/partner-requests, /admin/contact-messages
router.use('/coupons', couponRoutes); // GET /:code/qr-code (public), rest admin
router.use('/', clinicRoutes); // /clinic/*, /admin/clinics*
router.use('/impact', impactRoutes); // GET /api/impact (public, live stats)
router.use('/admin/notifications', notificationRoutes); // GET /api/admin/notifications
router.use('/webhooks', webhookRoutes); // POST /api/webhooks/whatsapp
router.use('/', orgSettingsRoutes); // GET /org-settings (public), PUT /admin/org-settings
router.use('/admin/api-keys', apiKeyRoutes); // manage external integration keys
router.use('/external', externalRoutes); // API-key-gated endpoints for third-party integrations
router.use('/admin/reports', reportsRoutes); // CSV/Tally-XML/CSR-xlsx exports

// NOTE: admin listing for beneficiaries is exposed at GET /api/beneficiaries
// (protected by requireAdminAuth inside beneficiary.routes.js), so no
// separate /admin/beneficiaries mount is needed here.

module.exports = router;
