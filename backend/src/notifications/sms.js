// Adapter for an SMS gateway (MSG91, Twilio, etc.) — used as a fallback
// for beneficiaries without WhatsApp/a smartphone, matching the plan's
// "SMS fallback" requirement.
async function sendSms({ to, message }) {
  if (!process.env.SMS_API_URL) {
    console.log(`[sms:dev-fallback] To: ${to}`);
    console.log(`[sms:dev-fallback] Message: ${message}`);
    return { delivered: false, mode: 'console-log' };
  }

  const res = await fetch(process.env.SMS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SMS_API_KEY}`,
    },
    body: JSON.stringify({
      sender: process.env.SMS_SENDER_ID || 'SNSHIN',
      to,
      message,
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(`SMS send failed (${res.status}): ${body}`);
  }

  return { delivered: true, mode: 'api', response: body };
}

module.exports = { sendSms };
