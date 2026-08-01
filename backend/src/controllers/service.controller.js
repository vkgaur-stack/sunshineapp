const prisma = require('../config/prisma');

// GET /api/services — public, powers the "Our Services" page and the
// service dropdown on the appointment booking form.
async function listServices(req, res, next) {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ services });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/services  (protected)
async function createService(req, res, next) {
  try {
    const service = await prisma.service.create({ data: req.body });
    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
}

module.exports = { listServices, createService };
