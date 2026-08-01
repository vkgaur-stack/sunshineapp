<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/auth.php';

applyCommonHeaders();
requireMethod('PUT');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']); // compliance-sensitive, public-facing data

$db = getDb();
$existing = $db->query('SELECT * FROM org_settings LIMIT 1')->fetch();
if (!$existing) {
    $id = generateUuid();
    $db->prepare("INSERT INTO org_settings (id, organization_name) VALUES (?, 'Sunshine Social Foundation')")->execute([$id]);
    $fetch = $db->prepare('SELECT * FROM org_settings WHERE id = ?');
    $fetch->execute([$id]);
    $existing = $fetch->fetch();
}

$body = getJsonBody();

$fieldMap = [
    'organizationName' => 'organization_name', 'registrationNumber' => 'registration_number',
    'ngoDarpanId' => 'ngo_darpan_id', 'panNumber' => 'pan_number', 'tanNumber' => 'tan_number',
    'eightyGNumber' => 'eighty_g_number', 'registeredAddress' => 'registered_address',
    'officeAddress' => 'office_address', 'officeHours' => 'office_hours', 'phone' => 'phone',
    'whatsappNumber' => 'whatsapp_number', 'email' => 'email',
    'bankAccountName' => 'bank_account_name', 'bankAccountNumber' => 'bank_account_number',
    'bankIfsc' => 'bank_ifsc', 'bankName' => 'bank_name', 'upiId' => 'upi_id',
    'facebookUrl' => 'facebook_url', 'instagramUrl' => 'instagram_url', 'youtubeUrl' => 'youtube_url',
];

$setClauses = [];
$params = [];
foreach ($fieldMap as $jsonKey => $column) {
    if (array_key_exists($jsonKey, $body)) {
        if ($jsonKey === 'email') {
            validateEmail($body[$jsonKey]);
        }
        $setClauses[] = "$column = ?";
        $params[] = $body[$jsonKey];
    }
}

if (empty($setClauses)) {
    jsonError('No updatable fields provided.', 400);
}

$params[] = $existing['id'];
$db->prepare('UPDATE org_settings SET ' . implode(', ', $setClauses) . ' WHERE id = ?')->execute($params);

$fetch = $db->prepare('SELECT * FROM org_settings WHERE id = ?');
$fetch->execute([$existing['id']]);

jsonResponse(['settings' => $fetch->fetch()]);
