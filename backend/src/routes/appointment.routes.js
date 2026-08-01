const express = require('express');
const {
  bookAppointment,
  myAppointments,
  listAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointment.controller');
const { validate } = require('../middleware/validate');
const { requireAdminAuth, requireRole } = require('../middleware/auth');
const { appointmentBookSchema } = require('../utils/schemas');

const router = express.Router();

router.post('/', validate(appointmentBookSchema), bookAppointment);
router.get('/mine', myAppointments);

// Admin
router.get('/', requireAdminAuth, listAppointments);
router.patch(
  '/:id/status',
  requireAdminAuth,
  requireRole('SUPER_ADMIN', 'CAMP_COORDINATOR'),
  updateAppointmentStatus
);

module.exports = router;
