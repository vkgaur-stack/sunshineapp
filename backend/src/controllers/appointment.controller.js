const prisma = require('../config/prisma');
const { notifyPreferred } = require('../notifications');

// POST /api/appointments — beneficiary books an appointment.
// Requires an existing beneficiaryId (from register or lookup) — enforces
// the "only registered beneficiaries can book" rule from the brief.
async function bookAppointment(req, res, next) {
  try {
    const { beneficiaryId, serviceId, campId, preferredDate, timeSlot, notes } = req.body;

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });
    if (!beneficiary) {
      return res.status(404).json({
        error: 'Beneficiary not found. Please register before booking an appointment.',
      });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return res.status(400).json({ error: 'Selected service is not available.' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        beneficiaryId,
        serviceId,
        campId: campId || null,
        preferredDate: new Date(preferredDate),
        timeSlot,
        notes,
      },
    });

    // Best-effort notification — never blocks the booking itself.
    notifyPreferred({
      preferredContact: beneficiary.preferredContact,
      phone: beneficiary.mobileNumber,
      email: beneficiary.email,
      templateType: 'APPOINTMENT_REQUESTED',
      variables: {
        fullName: beneficiary.fullName,
        serviceName: service.name,
        preferredDate: new Date(preferredDate).toLocaleDateString('en-IN'),
        timeSlot,
      },
      relatedType: 'Appointment',
      relatedId: appointment.id,
    }).catch((err) => console.error('Appointment notification failed:', err.message));

    res.status(201).json({ appointment });
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments/mine?beneficiaryId=...
async function myAppointments(req, res, next) {
  try {
    const { beneficiaryId } = req.query;
    if (!beneficiaryId) {
      return res.status(400).json({ error: 'beneficiaryId is required' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { beneficiaryId },
      include: { service: true, camp: true },
      orderBy: { preferredDate: 'desc' },
    });

    res.json({ appointments });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/appointments  (protected)
async function listAppointments(req, res, next) {
  try {
    const { status } = req.query;

    const appointments = await prisma.appointment.findMany({
      where: status ? { status } : undefined,
      include: { beneficiary: true, service: true, camp: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ appointments, count: appointments.length });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/appointments/:id/status  (protected)
async function updateAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { beneficiary: true, service: true },
    });

    if (status === 'CONFIRMED') {
      notifyPreferred({
        preferredContact: appointment.beneficiary.preferredContact,
        phone: appointment.beneficiary.mobileNumber,
        email: appointment.beneficiary.email,
        templateType: 'APPOINTMENT_CONFIRMED',
        variables: {
          fullName: appointment.beneficiary.fullName,
          serviceName: appointment.service.name,
          preferredDate: new Date(appointment.preferredDate).toLocaleDateString('en-IN'),
          timeSlot: appointment.timeSlot,
        },
        relatedType: 'Appointment',
        relatedId: appointment.id,
      }).catch((err) => console.error('Confirmation notification failed:', err.message));
    }

    res.json({ appointment });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  bookAppointment,
  myAppointments,
  listAppointments,
  updateAppointmentStatus,
};
