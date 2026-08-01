<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
$clinic = requireClinicAuth();

$db = getDb();
$stmt = $db->prepare('
    SELECT c.*, s.name AS service_name, b.full_name AS beneficiary_name
    FROM coupons c
    JOIN services s ON s.id = c.service_id
    LEFT JOIN beneficiaries b ON b.id = c.beneficiary_id
    WHERE c.redeemed_clinic_id = ?
    ORDER BY c.redeemed_at DESC
    LIMIT 200
');
$stmt->execute([$clinic['clinicId']]);

jsonResponse(['coupons' => $stmt->fetchAll()]);
