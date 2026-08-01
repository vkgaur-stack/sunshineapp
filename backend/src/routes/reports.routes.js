const express = require('express');
const {
  exportDonationsCsv,
  exportDonationsTallyXml,
  exportCsrSummaryXlsx,
} = require('../controllers/reports.controller');
const { requireAdminAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/donations.csv', requireAdminAuth, requireRole('SUPER_ADMIN', 'FINANCE'), exportDonationsCsv);
router.get('/donations/tally-xml', requireAdminAuth, requireRole('SUPER_ADMIN', 'FINANCE'), exportDonationsTallyXml);
router.get('/csr-summary.xlsx', requireAdminAuth, requireRole('SUPER_ADMIN', 'FINANCE'), exportCsrSummaryXlsx);

module.exports = router;
