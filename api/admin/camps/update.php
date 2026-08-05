<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('PATCH');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'CAMP_COORDINATOR']);

$id = $_GET['id'] ?? null;
if (!$id) {
    jsonError('Camp id is required as a query parameter (?id=...).', 400);
}
validateUuid($id);

$body = getJsonBody();
$fields = [];
$params = [];
$fieldMap = [
    'title' => 'title', 'city' => 'city', 'locality' => 'locality',
    'venueDetails' => 'venue_details', 'capacity' => 'capacity',
];
foreach ($fieldMap as $jsonKey => $column) {
    if (array_key_exists($jsonKey, $body)) {
        $fields[] = "$column = ?";
        $params[] = $body[$jsonKey];
    }
}
if (array_key_exists('startAt', $body)) {
    $fields[] = 'start_at = ?';
    $params[] = date('Y-m-d H:i:s', strtotime($body['startAt']));
}
if (array_key_exists('endAt', $body)) {
    $fields[] = 'end_at = ?';
    $params[] = date('Y-m-d H:i:s', strtotime($body['endAt']));
}
if (array_key_exists('isPublished', $body)) {
    $fields[] = 'is_published = ?';
    $params[] = $body['isPublished'] ? 1 : 0;
}

if (empty($fields)) {
    jsonError('No updatable fields provided.', 400);
}

$db = getDb();
$params[] = $id;
$db->prepare('UPDATE camps SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

$fetch = $db->prepare('SELECT * FROM camps WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['camp' => $fetch->fetch()]);
