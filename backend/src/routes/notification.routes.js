const express = require('express');
const { listNotifications } = require('../controllers/notification.controller');
const { requireAdminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdminAuth, listNotifications);

module.exports = router;
