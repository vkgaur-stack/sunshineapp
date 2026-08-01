<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/validate.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/apikey.php';

applyCommonHeaders();
requireMethod('POST');
$admin = requireAdminAuth();
requireRole($admin, ['SUPER_ADMIN']);

$body = getJsonBody();
$label = requireField($body, 'label', 'Label');
$scopes = requireField($body, 'scopes', 'Scopes');

$key = generateApiKey();

$db = getDb();
$id = generateUuid();
$db->prepare('
    INSERT INTO api_keys (id, label, key_prefix, key_hash, scopes)
    VALUES (?, ?, ?, ?, ?)
')->execute([$id, $label, $key['prefix'], $key['hash'], $scopes]);

// The full key is returned exactly once — only the hash is stored. If
// it's lost, revoke it and issue a new one.
jsonResponse([
    'apiKey' => $key['raw'],
    'warning' => 'Save this key now — it will not be shown again.',
], 201);
