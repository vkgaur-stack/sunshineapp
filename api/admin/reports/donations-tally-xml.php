<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'FINANCE']);

// A simplified Tally-importable XML voucher format (Receipt vouchers
// against a "Donations Received" ledger). Real-world Tally imports
// typically need ledger names matched to your actual Tally company's
// chart of accounts — adjust the two constants below before relying on this.
const LEDGER_NAME = 'Donations Received';
const CASH_LEDGER_NAME = 'Bank / Razorpay Settlement';

function escapeXmlTally(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;

$db = getDb();
$sql = "
    SELECT d.*, dn.full_name
    FROM donations d JOIN donors dn ON dn.id = d.donor_id
    WHERE d.status = 'SUCCESS'
";
$params = [];
if ($from) { $sql .= ' AND d.created_at >= ?'; $params[] = "$from 00:00:00"; }
if ($to)   { $sql .= ' AND d.created_at <= ?'; $params[] = "$to 23:59:59"; }
$sql .= ' ORDER BY d.created_at ASC';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$donations = $stmt->fetchAll();

$vouchers = '';
foreach ($donations as $d) {
    $amount = number_format($d['amount_in_paise'] / 100, 2, '.', '');
    $date = str_replace('-', '', substr($d['created_at'], 0, 10));
    $narration = escapeXmlTally("Donation from {$d['full_name']} — {$d['purpose']} — Receipt " . ($d['receipt_number'] ?? ''));

    $vouchers .= "
    <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">
      <VOUCHER VCHTYPE=\"Receipt\" ACTION=\"Create\">
        <DATE>$date</DATE>
        <NARRATION>$narration</NARRATION>
        <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>" . escapeXmlTally(CASH_LEDGER_NAME) . "</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-$amount</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>" . escapeXmlTally(LEDGER_NAME) . "</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>$amount</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>
    </TALLYMESSAGE>";
}

$xml = '<?xml version="1.0" encoding="UTF-8"?>' .
"\n<ENVELOPE>\n  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>\n" .
"  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>Vouchers</REPORTNAME>\n" .
"      </REQUESTDESC>\n      <REQUESTDATA>$vouchers\n      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>";

$filename = 'tally-donations-' . ($from ?: 'all') . '-to-' . ($to ?: 'now') . '.xml';
header('Content-Type: application/xml');
header("Content-Disposition: attachment; filename=\"$filename\"");
echo $xml;
