const prisma = require('../config/prisma');

// POST /api/beneficiaries/register
// Public endpoint — a person seeking services registers themselves.
async function registerBeneficiary(req, res, next) {
  try {
    const data = req.body;

    const existing = await prisma.beneficiary.findUnique({
      where: { mobileNumber: data.mobileNumber },
    });
    if (existing) {
      return res.status(409).json({
        error: 'A beneficiary with this mobile number is already registered.',
        beneficiaryId: existing.id,
      });
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        consentAt: data.consentGiven ? new Date() : null,
      },
    });

    res.status(201).json({ beneficiary });
  } catch (err) {
    next(err);
  }
}

// POST /api/beneficiaries/lookup
// Low-friction "login" for beneficiaries: mobile number + date of birth.
// No password — matches the elderly/middle-class user base this is built for.
async function lookupBeneficiary(req, res, next) {
  try {
    const { mobileNumber, dateOfBirth } = req.body;

    const beneficiary = await prisma.beneficiary.findFirst({
      where: {
        mobileNumber,
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    if (!beneficiary) {
      return res.status(404).json({
        error: 'No matching registration found. Please register first.',
      });
    }

    res.json({ beneficiary });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/beneficiaries  (protected)
async function listBeneficiaries(req, res, next) {
  try {
    const { city, search } = req.query;

    // NOTE: no `mode: 'insensitive'` here — that's a Postgres/MongoDB-only
    // Prisma option. MySQL's default collation (utf8mb4_general_ci) is
    // already case-insensitive for these comparisons.
    const beneficiaries = await prisma.beneficiary.findMany({
      where: {
        city: city ? { equals: city } : undefined,
        OR: search
          ? [
              { fullName: { contains: search } },
              { mobileNumber: { contains: search } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ beneficiaries, count: beneficiaries.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerBeneficiary, lookupBeneficiary, listBeneficiaries };
