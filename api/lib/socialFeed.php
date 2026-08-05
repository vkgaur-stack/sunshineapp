<?php
require_once __DIR__ . '/../config/config.php';

// Fetches from Facebook's Graph API directly via cURL (same approach as
// lib/razorpay.php) — no SDK, no Composer.
//
// SETUP REQUIRED (one-time, in your Meta Developer dashboard):
//   1. Your Instagram account must be a Business/Creator account,
//      connected to a Facebook Page you manage.
//   2. Create a Meta Developer App at developers.facebook.com, add the
//      Instagram Graph API product.
//   3. Generate a long-lived Page Access Token (~60 day lifespan — Meta
//      does not offer a truly permanent token; this needs periodic
//      renewal, there's no way to engineer around that platform limit).
//   4. Put the values in .env: FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN,
//      INSTAGRAM_BUSINESS_ACCOUNT_ID (find this via
//      GET /{page-id}?fields=instagram_business_account with your token).

class SocialFeedException extends Exception {}

const GRAPH_API_VERSION = 'v19.0';

function graphApiGet(string $path, array $params): array
{
    $url = "https://graph.facebook.com/" . GRAPH_API_VERSION . "/$path?" . http_build_query($params);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        throw new SocialFeedException("Could not reach Graph API: $curlError");
    }

    $decoded = json_decode($response, true);
    if ($httpCode >= 300) {
        $message = $decoded['error']['message'] ?? 'Unknown Graph API error';
        throw new SocialFeedException("Graph API error: $message");
    }

    return $decoded;
}

// Returns a normalized array of posts: [{id, message, imageUrl, permalink, createdAt}, ...]
function fetchFacebookPosts(int $limit = 6): array
{
    $pageId = env('FACEBOOK_PAGE_ID');
    $token = env('FACEBOOK_PAGE_ACCESS_TOKEN');

    if (!$pageId || !$token) {
        throw new SocialFeedException('FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN not configured.');
    }

    $data = graphApiGet("$pageId/posts", [
        'fields' => 'message,full_picture,permalink_url,created_time',
        'limit' => $limit,
        'access_token' => $token,
    ]);

    return array_map(function ($post) {
        return [
            'id' => $post['id'],
            'message' => $post['message'] ?? '',
            'imageUrl' => $post['full_picture'] ?? null,
            'permalink' => $post['permalink_url'] ?? null,
            'createdAt' => $post['created_time'] ?? null,
        ];
    }, $data['data'] ?? []);
}

// Returns the same normalized shape as fetchFacebookPosts().
function fetchInstagramPosts(int $limit = 6): array
{
    $igAccountId = env('INSTAGRAM_BUSINESS_ACCOUNT_ID');
    $token = env('FACEBOOK_PAGE_ACCESS_TOKEN'); // Instagram Graph API reuses the linked Page's token

    if (!$igAccountId || !$token) {
        throw new SocialFeedException('INSTAGRAM_BUSINESS_ACCOUNT_ID or FACEBOOK_PAGE_ACCESS_TOKEN not configured.');
    }

    $data = graphApiGet("$igAccountId/media", [
        'fields' => 'caption,media_type,media_url,thumbnail_url,permalink,timestamp',
        'limit' => $limit,
        'access_token' => $token,
    ]);

    return array_map(function ($post) {
        // VIDEO posts expose the preview image via thumbnail_url instead of media_url.
        $imageUrl = $post['media_type'] === 'VIDEO'
            ? ($post['thumbnail_url'] ?? null)
            : ($post['media_url'] ?? null);

        return [
            'id' => $post['id'],
            'message' => $post['caption'] ?? '',
            'imageUrl' => $imageUrl,
            'permalink' => $post['permalink'] ?? null,
            'createdAt' => $post['timestamp'] ?? null,
        ];
    }, $data['data'] ?? []);
}
