<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// Singleton pattern — always exactly one row, auto-created with defaults
// on first request so the frontend never has to handle "no settings yet"
// as a special case.
$db = getDb();
$stmt = $db->query('SELECT * FROM org_settings LIMIT 1');
$settings = $stmt->fetch();

if (!$settings) {
    $id = generateUuid();
    $db->prepare("INSERT INTO org_settings (id, organization_name) VALUES (?, 'Sunshine Social Foundation')")->execute([$id]);
    $fetch = $db->prepare('SELECT * FROM org_settings WHERE id = ?');
    $fetch->execute([$id]);
    $settings = $fetch->fetch();
}

jsonResponse(['settings' => $settings]);
