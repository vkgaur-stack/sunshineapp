const prisma = require('../config/prisma');

// Generates a sequential, human-readable 80G receipt number per calendar
// year, e.g. SSF/2026/000123.
//
// NOTE: this counts existing receipts for the year rather than using a
// dedicated sequence table, which is simple but can theoretically race
// under very high concurrent donation volume. If Sunshine's donation
// volume grows enough for that to matter, replace this with a Postgres
// sequence or a SELECT ... FOR UPDATE counter row — flagged here rather
// than over-built for a Phase 2 NGO donation volume.
async function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.donation.count({
    where: {
      receiptNumber: { startsWith: `SSF/${year}/` },
    },
  });
  const next = String(count + 1).padStart(6, '0');
  return `SSF/${year}/${next}`;
}

module.exports = { generateReceiptNumber };
