const ExcelJS = require('exceljs');
const prisma = require('../config/prisma');
const { toCsv } = require('../utils/csv');

function dateRangeWhere(from, to) {
  if (!from && !to) return undefined;
  return {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  };
}

// GET /admin/reports/donations.csv?from=&to=  (admin: SUPER_ADMIN, FINANCE)
// Generic accounting-import-friendly CSV — Tally, Zoho Books, Excel, and
// most bookkeeping tools can all import a plain CSV like this directly.
async function exportDonationsCsv(req, res, next) {
  try {
    const { from, to } = req.query;

    const donations = await prisma.donation.findMany({
      where: { status: 'SUCCESS', createdAt: dateRangeWhere(from, to) },
      include: { donor: true },
      orderBy: { createdAt: 'asc' },
    });

    const csv = toCsv(donations, [
      { label: 'Date', value: (d) => d.createdAt.toISOString().slice(0, 10) },
      { label: 'Receipt Number', value: (d) => d.receiptNumber || '' },
      { label: 'Donor Name', value: (d) => d.donor.fullName },
      { label: 'Donor Mobile', value: (d) => d.donor.mobileNumber },
      { label: 'Donor Email', value: (d) => d.donor.email || '' },
      { label: 'Donor PAN', value: (d) => d.donor.panNumber || '' },
      { label: 'Amount (INR)', value: (d) => (d.amountInPaise / 100).toFixed(2) },
      { label: 'Purpose', value: (d) => d.purpose },
      { label: 'Payment Reference', value: (d) => d.razorpayPaymentId || '' },
    ]);

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="donations-${from || 'all'}-to-${to || 'now'}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

// GET /admin/reports/donations/tally-xml?from=&to=  (admin: SUPER_ADMIN, FINANCE)
// A simplified Tally-importable XML voucher format (Receipt vouchers
// against a "Donations Received" ledger). Real-world Tally imports
// typically need ledger names matched to your actual Tally company's
// chart of accounts — adjust LEDGER_NAME below to match yours before use.
const LEDGER_NAME = 'Donations Received';
const CASH_LEDGER_NAME = 'Bank / Razorpay Settlement';

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]));
}

async function exportDonationsTallyXml(req, res, next) {
  try {
    const { from, to } = req.query;

    const donations = await prisma.donation.findMany({
      where: { status: 'SUCCESS', createdAt: dateRangeWhere(from, to) },
      include: { donor: true },
      orderBy: { createdAt: 'asc' },
    });

    const vouchers = donations.map((d) => {
      const amount = (d.amountInPaise / 100).toFixed(2);
      const date = d.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
      return `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Receipt" ACTION="Create">
        <DATE>${date}</DATE>
        <NARRATION>${escapeXml(`Donation from ${d.donor.fullName} — ${d.purpose} — Receipt ${d.receiptNumber || ''}`)}</NARRATION>
        <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(CASH_LEDGER_NAME)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(LEDGER_NAME)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>
    </TALLYMESSAGE>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>${vouchers}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    res.set('Content-Type', 'application/xml');
    res.set('Content-Disposition', `attachment; filename="tally-donations-${from || 'all'}-to-${to || 'now'}.xml"`);
    res.send(xml);
  } catch (err) {
    next(err);
  }
}

// GET /admin/reports/csr-summary.xlsx?from=&to=  (admin)
// A CSR-partner-ready workbook: an impact summary sheet plus supporting
// donation and coupon-redemption detail sheets — the "structured report
// matching common CSR reporting templates" from the Phase 4 plan.
async function exportCsrSummaryXlsx(req, res, next) {
  try {
    const { from, to } = req.query;
    const range = dateRangeWhere(from, to);

    const [donations, coupons, appointments, camps] = await Promise.all([
      prisma.donation.findMany({ where: { status: 'SUCCESS', createdAt: range }, include: { donor: true } }),
      prisma.coupon.findMany({ where: { status: 'REDEEMED', redeemedAt: range }, include: { service: true, beneficiary: true, redeemedAtClinic: true } }),
      prisma.appointment.count({ where: { status: 'COMPLETED', updatedAt: range } }),
      prisma.camp.count({ where: { endAt: range || { lt: new Date() } } }),
    ]);

    const totalDonated = donations.reduce((sum, d) => sum + d.amountInPaise, 0) / 100;
    const totalSubsidy = coupons.reduce((sum, c) => sum + (c.valueInPaise || 0), 0) / 100;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sunshine Social Foundation Portal';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [{ width: 32 }, { width: 20 }];
    summarySheet.addRows([
      ['Sunshine Social Foundation — Impact Summary'],
      [`Period: ${from || 'inception'} to ${to || 'present'}`],
      [],
      ['Metric', 'Value'],
      ['Total Donations Received (₹)', totalDonated.toFixed(2)],
      ['Number of Donations', donations.length],
      ['Subsidy Delivered via Coupons (₹)', totalSubsidy.toFixed(2)],
      ['Coupons Redeemed', coupons.length],
      ['Sessions Completed', appointments],
      ['Camps Held', camps],
    ]);
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.getRow(4).font = { bold: true };

    const donationsSheet = workbook.addWorksheet('Donations');
    donationsSheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Donor', key: 'donor', width: 24 },
      { header: 'Amount (₹)', key: 'amount', width: 14 },
      { header: 'Purpose', key: 'purpose', width: 28 },
      { header: 'Receipt No.', key: 'receipt', width: 20 },
    ];
    donations.forEach((d) => donationsSheet.addRow({
      date: d.createdAt.toISOString().slice(0, 10),
      donor: d.donor.fullName,
      amount: (d.amountInPaise / 100).toFixed(2),
      purpose: d.purpose,
      receipt: d.receiptNumber || '',
    }));
    donationsSheet.getRow(1).font = { bold: true };

    const couponsSheet = workbook.addWorksheet('Subsidy Redemptions');
    couponsSheet.columns = [
      { header: 'Code', key: 'code', width: 20 },
      { header: 'Service', key: 'service', width: 24 },
      { header: 'Beneficiary', key: 'beneficiary', width: 24 },
      { header: 'Clinic', key: 'clinic', width: 24 },
      { header: 'Subsidy Value (₹)', key: 'value', width: 16 },
      { header: 'Redeemed On', key: 'date', width: 14 },
    ];
    coupons.forEach((c) => couponsSheet.addRow({
      code: c.code,
      service: c.service.name,
      beneficiary: c.beneficiary?.fullName || '—',
      clinic: c.redeemedAtClinic?.name || '—',
      value: c.valueInPaise ? (c.valueInPaise / 100).toFixed(2) : '',
      date: c.redeemedAt ? c.redeemedAt.toISOString().slice(0, 10) : '',
    }));
    couponsSheet.getRow(1).font = { bold: true };

    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename="csr-summary-${from || 'all'}-to-${to || 'now'}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { exportDonationsCsv, exportDonationsTallyXml, exportCsrSummaryXlsx };
