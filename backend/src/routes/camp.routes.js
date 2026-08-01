const express = require('express');
const {
  listUpcomingCamps,
  listAllCamps,
  createCamp,
  updateCamp,
  announceCamp,
} = require('../controllers/camp.controller');
const { requireAdminAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', listUpcomingCamps);
router.get('/admin', requireAdminAuth, listAllCamps);
router.post(
  '/',
  requireAdminAuth,
  requireRole('SUPER_ADMIN', 'CAMP_COORDINATOR'),
  createCamp
);
router.patch(
  '/:id',
  requireAdminAuth,
  requireRole('SUPER_ADMIN', 'CAMP_COORDINATOR'),
  updateCamp
);
router.post(
  '/:id/announce',
  requireAdminAuth,
  requireRole('SUPER_ADMIN', 'CAMP_COORDINATOR'),
  announceCamp
);

module.exports = router;
