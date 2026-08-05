<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// Singleton pattern — always exactly one row, auto-created with defaults
// on first request so the frontend never has to handle "no settings yet"
// as a special case.
//
// ORDER BY id ASC is required here — without it, if more than one row
// ever exists (e.g. a race condition where two page loads both hit an
// empty table and each insert a default row), a plain `LIMIT 1` has no
// guaranteed order and can return a DIFFERENT row on different requests.
// That produces exactly "I saved settings but they show blank again" —
// the write and the read silently hit different rows. This table has no
// created_at column, only updated_at (which changes on every write, so
// it can't be used to find the "first" row) — ordering by id at least
// guarantees the same row is picked consistently every time.
$db = getDb();
$stmt = $db->query('SELECT * FROM org_settings ORDER BY id ASC LIMIT 1');
$settings = $stmt->fetch();

if (!$settings) {
    $id = generateUuid();
    $db->prepare("INSERT INTO org_settings (id, organization_name) VALUES (?, 'Sunshine Social Foundation')")->execute([$id]);
    $fetch = $db->prepare('SELECT * FROM org_settings WHERE id = ?');
    $fetch->execute([$id]);
    $settings = $fetch->fetch();
}

// The database uses snake_case columns; the frontend (Footer, Contact,
// Donate, Social, Admin Settings) all expect camelCase, matching the
// original Node/Prisma backend's convention. Returning the raw PDO row
// directly here was the actual bug — every compound-word field (e.g.
// facebook_url) silently didn't match what the frontend looked for
// (facebookUrl), while single-word fields (phone, email) coincidentally
// matched either way and appeared to work.
$camelCase = [
    'organizationName' => $settings['organization_name'],
    'registrationNumber' => $settings['registration_number'],
    'ngoDarpanId' => $settings['ngo_darpan_id'],
    'panNumber' => $settings['pan_number'],
    'tanNumber' => $settings['tan_number'],
    'eightyGNumber' => $settings['eighty_g_number'],
    'registeredAddress' => $settings['registered_address'],
    'officeAddress' => $settings['office_address'],
    'officeHours' => $settings['office_hours'],
    'phone' => $settings['phone'],
    'whatsappNumber' => $settings['whatsapp_number'],
    'email' => $settings['email'],
    'bankAccountName' => $settings['bank_account_name'],
    'bankAccountNumber' => $settings['bank_account_number'],
    'bankIfsc' => $settings['bank_ifsc'],
    'bankName' => $settings['bank_name'],
    'upiId' => $settings['upi_id'],
    'facebookUrl' => $settings['facebook_url'],
    'instagramUrl' => $settings['instagram_url'],
    'youtubeUrl' => $settings['youtube_url'],
];

jsonResponse(['settings' => $camelCase]);
