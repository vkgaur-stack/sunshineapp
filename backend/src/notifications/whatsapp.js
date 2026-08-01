// Adapter for a WhatsApp Business Solution Provider (BSP) — Interakt,
// Gupshup, and AiSensy all expose a broadly similar "send template message"
// REST endpoint, so this shape should need only field-name tweaks to match
// whichever BSP Sunshine ends up contracting with.
//
// IMPORTANT: WhatsApp Business API requires message templates to be
// pre-approved by Meta before they can be sent outside a 24-hour customer
// service window. The `templateType` values used here (see templates.js)
// are meant to map 1:1 to template names you'll register with your BSP —
// they are not free-form text in production, even though the dev fallback
// below sends free text for convenience.

async function sendWhatsApp({ to, message, templateType }) {
  if (!process.env.WHATSAPP_API_URL) {
    console.log(`[whatsapp:dev-fallback] To: ${to} | Template: ${templateType}`);
    console.log(`[whatsapp:dev-fallback] Message: ${message}`);
    return { delivered: false, mode: 'console-log' };
  }

  const res = await fetch(process.env.WHATSAPP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.WHATSAPP_FROM_NUMBER,
      to,
      templateType,
      message,
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(`WhatsApp send failed (${res.status}): ${body}`);
  }

  return { delivered: true, mode: 'api', response: body };
}

module.exports = { sendWhatsApp };
