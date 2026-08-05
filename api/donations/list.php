<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'FINANCE']);

$db = getDb();
$stmt = $db->query('
    SELECT d.*, dn.full_name, dn.mobile_number, dn.email, dn.pan_number
    FROM donations d JOIN donors dn ON dn.id = d.donor_id
    ORDER BY d.created_at DESC LIMIT 200
');
$donations = $stmt->fetchAll();

jsonResponse(['donations' => $donations, 'count' => count($donations)]);
