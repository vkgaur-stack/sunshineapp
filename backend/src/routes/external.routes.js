const express = require('express');
const { externalListDonations } = require('../controllers/external.controller');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();

router.get('/donations', requireApiKey('donations:read'), externalListDonations);

module.exports = router;
