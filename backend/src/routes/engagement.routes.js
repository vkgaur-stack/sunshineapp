const express = require('express');
const {
  createPartnerRequest,
  createContactMessage,
  listPartnerRequests,
  listContactMessages,
} = require('../controllers/engagement.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth } = require('../middleware/auth');
const {
  partnerRequestSchema,
  contactMessageSchema,
} = require('../utils/schemas');

const router = express.Router();

router.post('/partner-requests', validate(partnerRequestSchema), createPartnerRequest);
router.post('/contact-messages', validate(contactMessageSchema), createContactMessage);

router.get('/admin/partner-requests', requireAdminAuth, listPartnerRequests);
router.get('/admin/contact-messages', requireAdminAuth, listContactMessages);

module.exports = router;
