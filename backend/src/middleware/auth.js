const { verifyToken } = require('../utils/jwt');
const { hashApiKey } = require('../utils/apiKey');
const prisma = require('../config/prisma');

// Verifies a bearer token and attaches the decoded payload to req.admin.
// Used to protect all /api/admin/* routes.
function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const decoded = verifyToken(token);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Restricts a route to specific admin roles, e.g. requireRole('SUPER_ADMIN', 'FINANCE')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Verifies a bearer token issued to clinic staff (separate trust boundary
// from AdminUser — a clinic login can only validate/redeem coupons for its
// own clinic, never see beneficiary lists, donations, or other admin data).
function requireClinicAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.type !== 'clinic') {
      return res.status(403).json({ error: 'This endpoint requires a clinic login.' });
    }
    req.clinic = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Verifies an external integration's API key (header: X-API-Key) and
// checks it carries the required scope. This is the auth boundary for
// third-party/future integrations (accounting sync, a CSR partner's own
// dashboard, etc.) — deliberately separate from admin/clinic logins so a
// leaked integration key can be revoked without touching staff accounts.
function requireApiKey(requiredScope) {
  return async (req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    if (!providedKey) {
      return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    try {
      const hash = hashApiKey(providedKey);
      const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hash } });

      if (!apiKey || !apiKey.isActive) {
        return res.status(401).json({ error: 'Invalid or revoked API key' });
      }

      const scopes = apiKey.scopes.split(',').map((s) => s.trim());
      if (!scopes.includes(requiredScope)) {
        return res.status(403).json({ error: `This key lacks the "${requiredScope}" scope.` });
      }

      // Best-effort — don't block the request if this update fails.
      prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

      req.apiKey = apiKey;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireAdminAuth, requireRole, requireClinicAuth, requireApiKey };
