const nodemailer = require('nodemailer');

// Lazily builds a transporter only if SMTP is configured. In local/dev
// environments without SMTP_HOST set, emails are logged to the console
// instead of failing — keeps the donation flow working end-to-end without
// requiring an email provider just to test it.
function buildTransporter() {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendReceiptEmail({ toEmail, toName, receiptNumber, amountInRupees, purpose, date }) {
  const subject = `Your 80G Donation Receipt — ${receiptNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #2B2A28; max-width: 480px;">
      <h2 style="color:#1B3556;">Thank you, ${toName}.</h2>
      <p>Your generous donation to <strong>Sunshine Social Foundation</strong> has been received.</p>
      <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding:6px 0; color:#666;">Receipt No.</td><td style="padding:6px 0;"><strong>${receiptNumber}</strong></td></tr>
        <tr><td style="padding:6px 0; color:#666;">Amount</td><td style="padding:6px 0;">₹${amountInRupees.toLocaleString('en-IN')}</td></tr>
        <tr><td style="padding:6px 0; color:#666;">Purpose</td><td style="padding:6px 0;">${purpose}</td></tr>
        <tr><td style="padding:6px 0; color:#666;">Date</td><td style="padding:6px 0;">${date}</td></tr>
      </table>
      <p style="margin-top:16px; font-size: 13px; color:#666;">
        This donation is eligible for tax deduction under Section 80G of the
        Income Tax Act. Please retain this receipt for your records.
      </p>
    </div>
  `;

  const transporter = buildTransporter();

  if (!transporter) {
    console.log('[mailer:dev-fallback] SMTP not configured — logging receipt instead of sending.');
    console.log(`To: ${toEmail} | Subject: ${subject}`);
    return { delivered: false, mode: 'console-log' };
  }

  await transporter.sendMail({
    from: process.env.RECEIPT_FROM_EMAIL || 'Sunshine Social Foundation <no-reply@sunshinesocial.org>',
    to: toEmail,
    subject,
    html,
  });

  return { delivered: true, mode: 'smtp' };
}

module.exports = { sendReceiptEmail };
