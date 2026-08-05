<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$city = $_GET['city'] ?? null;
$search = $_GET['search'] ?? null;

$sql = 'SELECT * FROM beneficiaries WHERE 1=1';
$params = [];

if ($city) {
    $sql .= ' AND city = ?';
    $params[] = $city;
}
if ($search) {
    $sql .= ' AND (full_name LIKE ? OR mobile_number LIKE ?)';
    $params[] = "%$search%";
    $params[] = "%$search%";
}
$sql .= ' ORDER BY created_at DESC LIMIT 200';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$beneficiaries = $stmt->fetchAll();

jsonResponse(['beneficiaries' => $beneficiaries, 'count' => count($beneficiaries)]);
