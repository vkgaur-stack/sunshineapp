<?php
require_once __DIR__ . '/../lib/response.php';

applyCommonHeaders();
requireMethod('GET');

// Scans a folder OUTSIDE both the frontend build and the versioned api/
// codebase — public_html/media/hero/ — so dropping new photos/videos in
// via File Manager never requires redeploying anything. Sibling to api/,
// not inside it, specifically so a future `git push` redeploy of api/
// (or a frontend rebuild) can never touch or wipe out uploaded media.
//
// SETUP: create the folder once via File Manager at
//   public_html/media/hero/
// then just drag files into it — this endpoint picks them up automatically,
// no code changes or redeploys needed for new uploads.
//
// ORDERING: files are listed alphabetically by filename. To control the
// rotation order, prefix filenames with numbers: 01-camp-photo.jpg,
// 02-therapy-session.mp4, 03-team-photo.jpg, etc.

$mediaDir = __DIR__ . '/../../media/hero';

$imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$videoExtensions = ['mp4', 'webm', 'mov'];

$items = [];

if (is_dir($mediaDir)) {
    $files = scandir($mediaDir);
    sort($files, SORT_NATURAL | SORT_FLAG_CASE);

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

        if (in_array($ext, $imageExtensions, true)) {
            $items[] = ['url' => '/media/hero/' . rawurlencode($file), 'type' => 'image'];
        } elseif (in_array($ext, $videoExtensions, true)) {
            $items[] = ['url' => '/media/hero/' . rawurlencode($file), 'type' => 'video'];
        }
        // Any other file type (e.g. a stray .txt or .DS_Store) is silently ignored.
    }
}

jsonResponse(['items' => $items]);
