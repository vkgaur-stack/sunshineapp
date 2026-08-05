<?php
// Manually forces a refresh of both platforms' cached feed — useful for:
//   - Initial setup, to populate the cache before the first page load
//     (otherwise the FIRST visitor after deployment triggers the refresh,
//     which adds a brief delay to their page load)
//   - Testing that your Graph API credentials actually work (see the
//     printed output below — a real error message tells you exactly
//     what's misconfigured)
//   - Optional: point a cron job at this on a schedule (e.g. hourly) so
//     the cache is always refreshed proactively rather than lazily on
//     whatever visitor happens to trigger it
//
// Run with: php scripts/refresh-social-feed.php
// Or once via browser (delete after use — same caution as seed.php).

require_once __DIR__ . '/../lib/socialFeedCache.php';

foreach (['FACEBOOK', 'INSTAGRAM'] as $platform) {
    echo "Refreshing $platform...\n";
    refreshSocialFeedCache($platform);

    $result = getSocialFeed($platform);
    if ($result['error']) {
        echo "  ERROR: {$result['error']}\n";
    } else {
        echo "  OK — " . count($result['posts']) . " posts cached.\n";
    }
}

echo "\nDone.\n";
