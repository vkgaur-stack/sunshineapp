<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN', 'CAMP_COORDINATOR']);

$body = getJsonBody();
$title = requireField($body, 'title', 'Title');
$city = requireField($body, 'city', 'City');
$startAt = requireField($body, 'startAt', 'Start date/time');
$endAt = requireField($body, 'endAt', 'End date/time');

$db = getDb();
$id = generateUuid();
$stmt = $db->prepare('
    INSERT INTO camps (id, title, city, locality, venue_details, start_at, end_at, capacity, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
');
$stmt->execute([
    $id, $title, $city, optionalField($body, 'locality'), optionalField($body, 'venueDetails'),
    date('Y-m-d H:i:s', strtotime($startAt)), date('Y-m-d H:i:s', strtotime($endAt)),
    optionalField($body, 'capacity'), optionalField($body, 'isPublished', false) ? 1 : 0,
]);

$fetch = $db->prepare('SELECT * FROM camps WHERE id = ?');
$fetch->execute([$id]);

jsonResponse(['camp' => $fetch->fetch()], 201);
