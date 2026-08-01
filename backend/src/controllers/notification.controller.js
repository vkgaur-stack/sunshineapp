const prisma = require('../config/prisma');

// GET /api/admin/notifications?channel=&status=  (protected)
// Admin-visible audit log of every WhatsApp/SMS notification attempt —
// lets staff verify beneficiaries are actually being reached, and debug
// failures without digging through server logs.
async function listNotifications(req, res, next) {
  try {
    const { channel, status } = req.query;

    const notifications = await prisma.notificationLog.findMany({
      where: {
        channel: channel || undefined,
        status: status || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    res.json({ notifications, count: notifications.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications };
