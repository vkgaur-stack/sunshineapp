const prisma = require('../config/prisma');

// The whole model is a singleton — always exactly one row. This helper
// guarantees that row exists, creating sensible defaults the very first
// time anything asks for it (so the frontend never has to handle "no
// settings exist yet" as a special case).
async function getOrCreateSettings() {
  const existing = await prisma.orgSettings.findFirst();
  if (existing) return existing;

  return prisma.orgSettings.create({
    data: { organizationName: 'Sunshine Social Foundation' },
  });
}

// GET /api/org-settings — public. Powers the Footer, About, Contact, and
// Donate pages so compliance-critical info (reg. number, bank/UPI details,
// contact info) lives in one editable place instead of being hardcoded
// text scattered across the frontend.
async function getOrgSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/org-settings — admin (SUPER_ADMIN only — this data is
// compliance-sensitive and public-facing, so it's deliberately not
// editable by camp coordinators or finance roles).
async function updateOrgSettings(req, res, next) {
  try {
    const existing = await getOrCreateSettings();
    const settings = await prisma.orgSettings.update({
      where: { id: existing.id },
      data: req.body,
    });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOrgSettings, updateOrgSettings };
