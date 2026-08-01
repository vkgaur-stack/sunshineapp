const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');

// POST /api/admin/login
async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      sub: admin.id,
      role: admin.role,
      email: admin.email,
    });

    res.json({
      token,
      admin: { id: admin.id, fullName: admin.fullName, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { adminLogin };
