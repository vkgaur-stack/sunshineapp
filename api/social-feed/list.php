<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/socialFeedCache.php';

applyCommonHeaders();
requireMethod('GET');

// Public — always serves from cache (see lib/socialFeedCache.php for why:
// fast page loads, and never hits Graph API's rate limits on every visit).
$facebook = getSocialFeed('FACEBOOK');
$instagram = getSocialFeed('INSTAGRAM');

jsonResponse([
    'facebook' => $facebook['posts'],
    'instagram' => $instagram['posts'],
    'lastUpdated' => max($facebook['fetchedAt'] ?? '', $instagram['fetchedAt'] ?? ''),
]);
