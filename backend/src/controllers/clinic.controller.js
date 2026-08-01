const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');

// --- Admin-managed clinic network ---

// POST /api/admin/clinics  (admin: SUPER_ADMIN)
async function createClinic(req, res, next) {
  try {
    const clinic = await prisma.clinic.create({ data: req.body });
    res.status(201).json({ clinic });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/clinics  (admin)
async function listClinics(req, res, next) {
  try {
    const clinics = await prisma.clinic.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ clinics });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/clinics/:clinicId/users  (admin: SUPER_ADMIN)
// Creates a login for clinic staff. Password is generated here and
// returned once — in production this would instead trigger an invite
// email with a set-password link.
async function createClinicUser(req, res, next) {
  try {
    const { clinicId } = req.params;
    const { fullName, email, password } = req.body;

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) return res.status(404).json({ error: 'Clinic not found.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const clinicUser = await prisma.clinicUser.create({
      data: { clinicId, fullName, email, passwordHash },
    });

    res.status(201).json({
      clinicUser: { id: clinicUser.id, fullName: clinicUser.fullName, email: clinicUser.email },
    });
  } catch (err) {
    next(err);
  }
}

// --- Clinic-facing portal ---

// POST /api/clinic/login — public
async function clinicLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.clinicUser.findUnique({
      where: { email },
      include: { clinic: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      type: 'clinic',
      sub: user.id,
      clinicId: user.clinicId,
      email: user.email,
    });

    res.json({
      token,
      clinicUser: { id: user.id, fullName: user.fullName },
      clinic: { id: user.clinic.id, name: user.clinic.name, city: user.clinic.city },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/clinic/coupons/validate  (clinic auth required)
// Checks a coupon code without redeeming it — used by clinic staff before
// delivering the service, to confirm it's genuine, unused, and unexpired.
async function validateCoupon(req, res, next) {
  try {
    const { code } = req.body;

    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: { service: true, beneficiary: true },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'No coupon found with this code.' });
    }
    if (coupon.status === 'REDEEMED') {
      return res.status(400).json({ error: 'This coupon has already been redeemed.', coupon });
    }
    if (coupon.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This coupon has been cancelled.', coupon });
    }
    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired.', coupon });
    }

    res.json({ valid: true, coupon });
  } catch (err) {
    next(err);
  }
}

// POST /api/clinic/coupons/:id/redeem  (clinic auth required)
// Marks a valid coupon as redeemed at the authenticated clinic. This is
// the point where the NGO's 75% reimbursement obligation to the clinic
// is triggered (tracked here; actual payout remains a Phase 4 finance flow).
async function redeemCoupon(req, res, next) {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
    if (coupon.status === 'REDEEMED') {
      return res.status(400).json({ error: 'This coupon has already been redeemed.' });
    }
    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired.' });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
        redeemedClinicId: req.clinic.clinicId,
        redeemedByUserId: req.clinic.sub,
      },
    });

    res.json({ coupon: updated });
  } catch (err) {
    next(err);
  }
}

// GET /api/clinic/coupons/history  (clinic auth required)
// Coupons this clinic has redeemed — its own accountability/reimbursement log.
async function clinicRedemptionHistory(req, res, next) {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { redeemedClinicId: req.clinic.clinicId },
      include: { service: true, beneficiary: true },
      orderBy: { redeemedAt: 'desc' },
      take: 200,
    });
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createClinic,
  listClinics,
  createClinicUser,
  clinicLogin,
  validateCoupon,
  redeemCoupon,
  clinicRedemptionHistory,
};
