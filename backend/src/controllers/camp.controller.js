const prisma = require('../config/prisma');
const { notifyPreferred } = require('../notifications');

// GET /api/camps — public, powers the "upcoming camps" strip on the homepage.
async function listUpcomingCamps(req, res, next) {
  try {
    const camps = await prisma.camp.findMany({
      where: { isPublished: true, startAt: { gte: new Date() } },
      orderBy: { startAt: 'asc' },
    });
    res.json({ camps });
  } catch (err) {
    next(err);
  }
}

// GET /api/camps/admin — admin, all camps regardless of publish/date status
// (the public endpoint above deliberately hides drafts and past camps).
async function listAllCamps(req, res, next) {
  try {
    const camps = await prisma.camp.findMany({ orderBy: { startAt: 'desc' } });
    res.json({ camps });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/camps  (protected)
async function createCamp(req, res, next) {
  try {
    const camp = await prisma.camp.create({
      data: {
        ...req.body,
        startAt: new Date(req.body.startAt),
        endAt: new Date(req.body.endAt),
      },
    });
    res.status(201).json({ camp });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/camps/:id  (protected)
async function updateCamp(req, res, next) {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.startAt) payload.startAt = new Date(payload.startAt);
    if (payload.endAt) payload.endAt = new Date(payload.endAt);

    const camp = await prisma.camp.update({ where: { id }, data: payload });
    res.json({ camp });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/camps/:id/announce  (protected)
// Sends a CAMP_ANNOUNCEMENT notification to every registered beneficiary in
// the camp's city — the "camp announcements to nearby registered
// beneficiaries" requirement from the Phase 3 plan. City-matched, not
// geo-radius-matched, which is a reasonable MVP given beneficiaries only
// have a city field today.
async function announceCamp(req, res, next) {
  try {
    const { id } = req.params;

    const camp = await prisma.camp.findUnique({ where: { id } });
    if (!camp) return res.status(404).json({ error: 'Camp not found.' });

    // NOTE: no `mode: 'insensitive'` — MySQL's default collation already
    // matches case-insensitively (see comment at top of schema.prisma).
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { city: { equals: camp.city } },
    });

    const results = await Promise.allSettled(
      beneficiaries.map((b) =>
        notifyPreferred({
          preferredContact: b.preferredContact,
          phone: b.mobileNumber,
          email: b.email,
          templateType: 'CAMP_ANNOUNCEMENT',
          variables: {
            fullName: b.fullName,
            campTitle: camp.title,
            city: camp.city,
            startDate: new Date(camp.startAt).toLocaleDateString('en-IN'),
          },
          relatedType: 'Camp',
          relatedId: camp.id,
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.delivered !== false).length;

    res.json({
      camp,
      targetedBeneficiaries: beneficiaries.length,
      notificationsAttempted: results.length,
      notificationsSent: sent,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUpcomingCamps, listAllCamps, createCamp, updateCamp, announceCamp };
