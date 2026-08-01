const express = require('express');
const { handleWhatsAppWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

// NOTE: in production, verify the request signature/token your BSP sends
// (e.g. a shared secret header) before processing — left as a TODO here
// since the exact verification method is BSP-specific.
router.post('/whatsapp', handleWhatsAppWebhook);

module.exports = router;
