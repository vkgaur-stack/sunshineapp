const express = require('express');
const { getImpactStats } = require('../controllers/impact.controller');

const router = express.Router();

router.get('/', getImpactStats);

module.exports = router;
