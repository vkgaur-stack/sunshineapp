const crypto = require('crypto');

// API keys are high-entropy random tokens, not passwords — a fast
// deterministic hash (SHA-256) for lookup is the standard approach used by
// providers like Stripe/GitHub, unlike bcrypt which is for low-entropy
// human passwords needing per-hash salting against offline brute force.
function generateApiKey() {
  const raw = `ssf_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = raw.slice(0, 12);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, prefix, hash };
}

function hashApiKey(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { generateApiKey, hashApiKey };
