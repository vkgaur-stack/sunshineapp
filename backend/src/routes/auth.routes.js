const express = require('express');
const { adminLogin } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { adminLoginSchema } = require('../utils/schemas');

const router = express.Router();

router.post('/login', validate(adminLoginSchema), adminLogin);

module.exports = router;
