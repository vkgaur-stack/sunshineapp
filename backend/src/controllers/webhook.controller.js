const prisma = require('../config/prisma');
const { notifyRaw } = require('../notifications');

// POST /api/webhooks/whatsapp
//
// Receives inbound WhatsApp messages and replies with a simple keyword
// menu — the "basic chatbot/menu" from the Phase 3 plan (BOOK / STATUS /
// HELP), deliberately without any NLP since the plan calls for none yet.
//
// NOTE ON PAYLOAD SHAPE: every WhatsApp BSP (Interakt, Gupshup, AiSensy)
// sends a differently-shaped webhook payload. Rather than hardcode one
// BSP's shape, this handler expects an already-normalized body:
//   { from: "+91...", text: "BOOK" }
// In production, add one small mapping function per BSP that extracts
// `from`/`text` from their specific payload and calls this same logic —
// keeps the menu/lookup logic itself provider-agnostic.
async function handleWhatsAppWebhook(req, res, next) {
  try {
    const { from, text } = req.body;

    if (!from || typeof text !== 'string') {
      return res.status(400).json({ error: 'Expected { from, text } in webhook body.' });
    }

    const normalized = text.trim().toUpperCase();
    const mobileNumber = from.replace(/\D/g, '').slice(-10); // last 10 digits, India-style

    let reply;

    if (normalized.includes('STATUS')) {
      const beneficiary = await prisma.beneficiary.findUnique({ where: { mobileNumber } });
      if (!beneficiary) {
        reply = "We couldn't find a registration for this number. Reply BOOK to register, or visit our website.";
      } else {
        const appointment = await prisma.appointment.findFirst({
          where: { beneficiaryId: beneficiary.id },
          orderBy: { createdAt: 'desc' },
          include: { service: true },
        });
        reply = appointment
          ? `Hi ${beneficiary.fullName}, your latest appointment for ${appointment.service.name} is: ${appointment.status}.`
          : `Hi ${beneficiary.fullName}, you don't have any appointments yet. Reply BOOK for help booking one.`;
      }
    } else if (normalized.includes('BOOK')) {
      reply =
        'To book an appointment, please visit our website and use "Book an Appointment" — ' +
        "you'll need to be registered first. Reply STATUS anytime to check an existing appointment.";
    } else {
      reply =
        'Welcome to Sunshine Social Foundation. Reply:\n' +
        'BOOK — for help booking an appointment\n' +
        'STATUS — to check your latest appointment\n' +
        'Or visit our website for full details.';
    }

    const result = await notifyRaw({
      channel: 'WHATSAPP',
      to: from,
      message: reply,
      templateType: 'CHATBOT_REPLY',
    });

    res.json({ replied: true, reply, deliveryResult: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleWhatsAppWebhook };
