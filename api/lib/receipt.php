<?php
require_once __DIR__ . '/../config/database.php';

// Sequential, human-readable 80G receipt number per calendar year, e.g.
// SSF/2026/000123. Same approach (and same documented caveat) as the
// Node version: counts existing receipts for the year rather than a
// dedicated sequence table — simple, and fine at NGO donation volume, but
// could theoretically race under very high concurrent donation traffic.
function generateReceiptNumber(): string
{
    $db = getDb();
    $year = date('Y');
    $stmt = $db->prepare("SELECT COUNT(*) AS cnt FROM donations WHERE receipt_number LIKE ?");
    $stmt->execute(["SSF/$year/%"]);
    $count = (int) $stmt->fetch()['cnt'];
    $next = str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
    return "SSF/$year/$next";
}
