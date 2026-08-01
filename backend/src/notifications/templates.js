// Plain-language templates for each notification type. Keep these short —
// WhatsApp template messages have length/variable limits, and SMS is
// billed per 160-character segment.
//
// NOTE: these `templateType` keys must match whatever template names get
// registered and approved with your WhatsApp BSP before going live.

const templates = {
  APPOINTMENT_REQUESTED: ({ fullName, serviceName, preferredDate, timeSlot }) =>
    `Hi ${fullName}, we've received your appointment request for ${serviceName} on ${preferredDate} (${timeSlot}). ` +
    `We'll confirm shortly. — Sunshine Social Foundation`,

  APPOINTMENT_CONFIRMED: ({ fullName, serviceName, preferredDate, timeSlot }) =>
    `Hi ${fullName}, your appointment for ${serviceName} on ${preferredDate} (${timeSlot}) is CONFIRMED. ` +
    `Please carry any prior medical reports. — Sunshine Social Foundation`,

  APPOINTMENT_REMINDER: ({ fullName, serviceName, preferredDate, timeSlot }) =>
    `Reminder: ${fullName}, your ${serviceName} appointment is on ${preferredDate} (${timeSlot}). ` +
    `Reply CANCEL if you can't make it. — Sunshine Social Foundation`,

  DONATION_THANK_YOU: ({ fullName, amountInRupees, receiptNumber }) =>
    `Thank you, ${fullName}! Your donation of ₹${amountInRupees} helps deliver subsidised care. ` +
    `Receipt ${receiptNumber} has been emailed to you. — Sunshine Social Foundation`,

  COUPON_ISSUED: ({ fullName, serviceName, code, expiresOn }) =>
    `Hi ${fullName}, you've been issued a subsidy coupon for ${serviceName} (Code: ${code}). ` +
    `Valid until ${expiresOn}. Show this at any partner clinic. — Sunshine Social Foundation`,

  CAMP_ANNOUNCEMENT: ({ fullName, campTitle, city, startDate }) =>
    `Hi ${fullName}, join us at "${campTitle}" in ${city} on ${startDate} for free/subsidised health services. ` +
    `Reply BOOK to register interest. — Sunshine Social Foundation`,
};

function renderTemplate(templateType, variables) {
  const fn = templates[templateType];
  if (!fn) throw new Error(`Unknown notification template: ${templateType}`);
  return fn(variables);
}

module.exports = { renderTemplate, templates };
