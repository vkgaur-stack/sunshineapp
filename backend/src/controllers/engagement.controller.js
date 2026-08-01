const prisma = require('../config/prisma');

// POST /api/partner-requests — "Get Involved" form (CSR / medical / volunteer / donor / community)
async function createPartnerRequest(req, res, next) {
  try {
    const request = await prisma.partnerRequest.create({ data: req.body });
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
}

// POST /api/contact-messages — "Contact Us" form
async function createContactMessage(req, res, next) {
  try {
    const message = await prisma.contactMessage.create({ data: req.body });
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/partner-requests  (protected)
async function listPartnerRequests(req, res, next) {
  try {
    const requests = await prisma.partnerRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/contact-messages  (protected)
async function listContactMessages(req, res, next) {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPartnerRequest,
  createContactMessage,
  listPartnerRequests,
  listContactMessages,
};
