const prisma = require('../config/prisma');

// GET /api/impact — public, live-computed impact metrics.
// This replaces Phase 1's hardcoded numbers on the "Our Impact" page —
// every figure here is calculated directly from real records, so it can
// never drift out of sync with what actually happened.
async function getImpactStats(req, res, next) {
  try {
    const now = new Date();

    const [
      totalBeneficiaries,
      beneficiariesServed,
      sessionsCompleted,
      campsHeld,
      distinctCities,
      redeemedCoupons,
    ] = await Promise.all([
      prisma.beneficiary.count(),
      prisma.appointment.findMany({
        where: { status: 'COMPLETED' },
        distinct: ['beneficiaryId'],
        select: { beneficiaryId: true },
      }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.camp.count({ where: { endAt: { lt: now } } }),
      prisma.beneficiary.findMany({ distinct: ['city'], select: { city: true } }),
      prisma.coupon.findMany({
        where: { status: 'REDEEMED' },
        select: { valueInPaise: true },
      }),
    ]);

    const subsidyDeliveredInPaise = redeemedCoupons.reduce(
      (sum, c) => sum + (c.valueInPaise || 0),
      0
    );

    res.json({
      totalBeneficiaries,
      beneficiariesServed: beneficiariesServed.length,
      sessionsCompleted,
      campsHeld,
      citiesServed: distinctCities.length,
      couponsRedeemed: redeemedCoupons.length,
      subsidyDeliveredInRupees: Math.round(subsidyDeliveredInPaise / 100),
      lastUpdated: now.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getImpactStats };
