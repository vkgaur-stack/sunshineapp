const prisma = require('../config/prisma');
const { sendWhatsApp } = require('./whatsapp');
const { sendSms } = require('./sms');
const { renderTemplate } = require('./templates');

// Single entry point for every outbound notification in the app. Callers
// never talk to the WhatsApp/SMS adapters directly — they call `notify()`
// with a channel preference, and every attempt (successful or not) is
// logged to NotificationLog so the admin dashboard has a real audit trail
// instead of a black box of "did this actually send?"
//
// Failures here are always swallowed (logged, not thrown) — a notification
// problem should never break the underlying business action (booking an
// appointment, confirming a donation, etc).
async function notify({ channel, to, templateType, variables, relatedType, relatedId }) {
  const message = renderTemplate(templateType, variables);

  const log = await prisma.notificationLog.create({
    data: {
      channel,
      toAddress: to,
      templateType,
      relatedType: relatedType || null,
      relatedId: relatedId || null,
      status: 'QUEUED',
    },
  });

  try {
    let result;
    if (channel === 'WHATSAPP') {
      result = await sendWhatsApp({ to, message, templateType });
    } else if (channel === 'SMS') {
      result = await sendSms({ to, message });
    } else {
      throw new Error(`notify() does not handle channel "${channel}" — use the mailer for EMAIL.`);
    }

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        providerResponse: JSON.stringify(result),
      },
    });

    return { ...result, logId: log.id };
  } catch (err) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', providerResponse: err.message },
    });
    console.error(`Notification failed [${channel}/${templateType}] to ${to}:`, err.message);
    return { delivered: false, mode: 'failed', logId: log.id };
  }
}

// Convenience wrapper: sends via the beneficiary/donor's preferred channel,
// with a sensible fallback if their preference isn't usable (e.g. they
// prefer EMAIL but have no email on file).
async function notifyPreferred({ preferredContact, phone, email, templateType, variables, relatedType, relatedId }) {
  if (preferredContact === 'WHATSAPP' && phone) {
    return notify({ channel: 'WHATSAPP', to: phone, templateType, variables, relatedType, relatedId });
  }
  if (preferredContact === 'PHONE' && phone) {
    // No voice-call channel built yet — SMS is the practical fallback.
    return notify({ channel: 'SMS', to: phone, templateType, variables, relatedType, relatedId });
  }
  if (preferredContact === 'EMAIL' && email) {
    // Email delivery for these transactional templates goes through the
    // existing mailer (see utils/mailer.js) rather than this module, which
    // is scoped to WhatsApp/SMS — callers should branch on this themselves
    // if they need EMAIL. Falling back to SMS here so the notification
    // still reaches someone rather than silently vanishing.
  }
  if (phone) {
    return notify({ channel: 'SMS', to: phone, templateType, variables, relatedType, relatedId });
  }
  return { delivered: false, mode: 'no-usable-contact' };
}

// Like notify(), but for messages that aren't one of the fixed templates —
// used by the inbound WhatsApp webhook handler for conversational replies,
// where the content is generated dynamically rather than from a fixed set.
async function notifyRaw({ channel, to, message, templateType = 'CHATBOT_REPLY', relatedType, relatedId }) {
  const log = await prisma.notificationLog.create({
    data: {
      channel,
      toAddress: to,
      templateType,
      relatedType: relatedType || null,
      relatedId: relatedId || null,
      status: 'QUEUED',
    },
  });

  try {
    const result = channel === 'WHATSAPP'
      ? await sendWhatsApp({ to, message, templateType })
      : await sendSms({ to, message });

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date(), providerResponse: JSON.stringify(result) },
    });

    return { ...result, logId: log.id };
  } catch (err) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', providerResponse: err.message },
    });
    return { delivered: false, mode: 'failed', logId: log.id };
  }
}

module.exports = { notify, notifyPreferred, notifyRaw };
