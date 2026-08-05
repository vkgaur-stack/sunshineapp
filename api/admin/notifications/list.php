<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('GET');
requireAdminAuth();

$db = getDb();
$channel = $_GET['channel'] ?? null;
$status = $_GET['status'] ?? null;

$sql = 'SELECT * FROM notification_logs WHERE 1=1';
$params = [];
if ($channel) {
    $sql .= ' AND channel = ?';
    $params[] = $channel;
}
if ($status) {
    $sql .= ' AND status = ?';
    $params[] = $status;
}
$sql .= ' ORDER BY created_at DESC LIMIT 300';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$notifications = $stmt->fetchAll();

jsonResponse(['notifications' => $notifications, 'count' => count($notifications)]);
