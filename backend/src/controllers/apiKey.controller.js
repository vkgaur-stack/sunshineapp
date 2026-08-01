const prisma = require('../config/prisma');
const { generateApiKey } = require('../utils/apiKey');

// POST /api/admin/api-keys  (admin: SUPER_ADMIN)
// The full key is returned exactly once, in this response — it is never
// retrievable again (only the hash is stored). If it's lost, revoke it and
// issue a new one.
async function createApiKey(req, res, next) {
  try {
    const { label, scopes } = req.body;

    if (!label || !scopes) {
      return res.status(400).json({ error: 'label and scopes are required.' });
    }

    const { raw, prefix, hash } = generateApiKey();

    await prisma.apiKey.create({
      data: { label, scopes, keyPrefix: prefix, keyHash: hash },
    });

    res.status(201).json({
      apiKey: raw,
      warning: 'Save this key now — it will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/api-keys  (admin)
async function listApiKeys(req, res, next) {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, label: true, keyPrefix: true, scopes: true,
        isActive: true, createdAt: true, lastUsedAt: true,
      },
    });
    res.json({ apiKeys: keys });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/api-keys/:id  (admin: SUPER_ADMIN)
async function revokeApiKey(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
    res.json({ revoked: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createApiKey, listApiKeys, revokeApiKey };
