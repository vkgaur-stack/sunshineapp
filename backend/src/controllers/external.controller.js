const prisma = require('../config/prisma');

// GET /api/external/donations?from=&to=  (requires API key, scope: donations:read)
// Read-only feed for accounting software or a CSR partner's own system to
// pull donation records without needing an admin login. This is the
// concrete example of "future integration" — a new consumer gets its own
// scoped key rather than a code change.
async function externalListDonations(req, res, next) {
  try {
    const { from, to } = req.query;

    const donations = await prisma.donation.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { donor: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    res.json({
      donations: donations.map((d) => ({
        id: d.id,
        amountInRupees: d.amountInPaise / 100,
        purpose: d.purpose,
        receiptNumber: d.receiptNumber,
        donorName: d.donor.fullName,
        donorEmail: d.donor.email,
        donorPan: d.donor.panNumber,
        date: d.createdAt,
      })),
      count: donations.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { externalListDonations };
