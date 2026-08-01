const QRCode = require('qrcode');
const prisma = require('../config/prisma');
const { generateCouponCode } = require('../utils/couponCode');
const { notifyPreferred } = require('../notifications');

// POST /api/admin/coupons/generate  (admin: SUPER_ADMIN, FINANCE)
// Generates a batch of coupons — either tied to a specific donation (the
// documented "gifting model") or issued from the general subsidy pool
// (the "need-based model"). Both paths produce the same Coupon record;
// donationId is simply optional.
async function generateCoupons(req, res, next) {
  try {
    const {
      donationId,
      serviceId,
      quantity,
      subsidyPercent,
      valueInPaise,
      expiresAt,
    } = req.body;

    if (!serviceId || !quantity || quantity < 1 || quantity > 500) {
      return res.status(400).json({ error: 'serviceId and a quantity between 1–500 are required.' });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    if (donationId) {
      const donation = await prisma.donation.findUnique({ where: { id: donationId } });
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found.' });
      }
    }

    const expiry = expiresAt ? new Date(expiresAt) : (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 6); // default 6-month validity
      return d;
    })();

    const coupons = [];
    for (let i = 0; i < quantity; i += 1) {
      coupons.push({
        code: generateCouponCode(),
        donationId: donationId || null,
        serviceId,
        subsidyPercent: subsidyPercent || 75,
        valueInPaise: valueInPaise || null,
        expiresAt: expiry,
        status: 'ISSUED',
      });
    }

    // createMany doesn't return created rows in all DBs, so we insert then
    // re-fetch by the codes we just generated.
    await prisma.coupon.createMany({ data: coupons });
    const created = await prisma.coupon.findMany({
      where: { code: { in: coupons.map((c) => c.code) } },
      include: { service: true },
    });

    res.status(201).json({ coupons: created, count: created.length });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/coupons/:id/assign  (admin: SUPER_ADMIN, CAMP_COORDINATOR)
// Assigns an ISSUED coupon to a specific beneficiary.
async function assignCoupon(req, res, next) {
  try {
    const { id } = req.params;
    const { beneficiaryId } = req.body;

    const coupon = await prisma.coupon.findUnique({ where: { id }, include: { service: true } });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
    if (coupon.status !== 'ISSUED') {
      return res.status(400).json({ error: `Coupon is ${coupon.status.toLowerCase()}, cannot be assigned.` });
    }

    const beneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } });
    if (!beneficiary) return res.status(404).json({ error: 'Beneficiary not found.' });

    const updated = await prisma.coupon.update({
      where: { id },
      data: { beneficiaryId, status: 'ASSIGNED' },
    });

    notifyPreferred({
      preferredContact: beneficiary.preferredContact,
      phone: beneficiary.mobileNumber,
      email: beneficiary.email,
      templateType: 'COUPON_ISSUED',
      variables: {
        fullName: beneficiary.fullName,
        serviceName: coupon.service.name,
        code: coupon.code,
        expiresOn: new Date(coupon.expiresAt).toLocaleDateString('en-IN'),
      },
      relatedType: 'Coupon',
      relatedId: coupon.id,
    }).catch((err) => console.error('Coupon notification failed:', err.message));

    res.json({ coupon: updated });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/coupons?status=&beneficiaryId=  (admin)
async function listCoupons(req, res, next) {
  try {
    const { status, beneficiaryId } = req.query;

    const coupons = await prisma.coupon.findMany({
      where: {
        status: status || undefined,
        beneficiaryId: beneficiaryId || undefined,
      },
      include: { service: true, beneficiary: true, redeemedAtClinic: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    res.json({ coupons, count: coupons.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/coupons/:code/qr-code — public (the code itself is the secret;
// this just renders it as a scannable image for printing/sharing).
// Returns a PNG image directly so it can be used as an <img src="..."> .
async function getCouponQrCode(req, res, next) {
  try {
    const { code } = req.params;
    const pngBuffer = await QRCode.toBuffer(code, { width: 300, margin: 1 });
    res.set('Content-Type', 'image/png');
    res.send(pngBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { generateCoupons, assignCoupon, listCoupons, getCouponQrCode };
