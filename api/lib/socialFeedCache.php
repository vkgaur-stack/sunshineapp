<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/socialFeed.php';

// How long a cached fetch is considered fresh before we try refreshing
// again. Kept generous (1 hour) since NGO social posts don't change
// minute-to-minute, and it keeps well within Graph API rate limits.
const SOCIAL_FEED_CACHE_MINUTES = 60;

// Refreshes one platform's cache by calling the Graph API and storing the
// result. On failure, the OLD cached data is left in place (so a
// temporary Graph API hiccup doesn't blank out the page) — only the
// `error` column is updated, for admin visibility.
function refreshSocialFeedCache(string $platform): void
{
    $db = getDb();

    try {
        $posts = $platform === 'FACEBOOK' ? fetchFacebookPosts() : fetchInstagramPosts();

        $db->prepare('
            INSERT INTO social_feed_cache (platform, payload, fetched_at, error)
            VALUES (?, ?, NOW(), NULL)
            ON DUPLICATE KEY UPDATE payload = VALUES(payload), fetched_at = VALUES(fetched_at), error = NULL
        ')->execute([$platform, json_encode($posts)]);
    } catch (SocialFeedException $e) {
        // Update fetched_at too, even on failure — otherwise a persistent
        // credential problem would cause a refresh attempt (and Graph API
        // call) on every single page load forever, instead of backing off
        // to the normal cache interval.
        $existing = $db->prepare('SELECT payload FROM social_feed_cache WHERE platform = ?');
        $existing->execute([$platform]);
        $row = $existing->fetch();

        $db->prepare('
            INSERT INTO social_feed_cache (platform, payload, fetched_at, error)
            VALUES (?, ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE fetched_at = VALUES(fetched_at), error = VALUES(error)
        ')->execute([$platform, $row['payload'] ?? '[]', $e->getMessage()]);
    }
}

// Returns cached posts for a platform, refreshing first if the cache is
// missing or stale. This is what api/social-feed.php calls — callers
// never touch the Graph API directly.
function getSocialFeed(string $platform): array
{
    $db = getDb();
    $stmt = $db->prepare('SELECT * FROM social_feed_cache WHERE platform = ?');
    $stmt->execute([$platform]);
    $cached = $stmt->fetch();

    $isStale = !$cached || (strtotime($cached['fetched_at']) < time() - SOCIAL_FEED_CACHE_MINUTES * 60);

    if ($isStale) {
        refreshSocialFeedCache($platform);
        $stmt->execute([$platform]);
        $cached = $stmt->fetch();
    }

    return [
        'posts' => $cached ? json_decode($cached['payload'], true) : [],
        'fetchedAt' => $cached['fetched_at'] ?? null,
        'error' => $cached['error'] ?? null,
    ];
}
