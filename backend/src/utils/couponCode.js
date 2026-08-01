const crypto = require('crypto');

// Human-readable, hard-to-guess coupon code: SSF-2026-A1B2C3
function generateCouponCode() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `SSF-${year}-${random}`;
}

module.exports = { generateCouponCode };
