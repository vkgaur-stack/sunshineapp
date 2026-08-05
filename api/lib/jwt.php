<?php
// Minimal, dependency-free HS256 JWT encode/decode. Deliberately hand-rolled
// rather than pulling in firebase/php-jwt via Composer, since "plain PHP,
// safest for basic shared hosting" was the explicit choice — this way
// there's zero dependency-install step, just upload and run.
//
// Implements exactly what this app needs (HS256 signing, exp claim
// checking) — not a general-purpose JWT library. If requirements grow
// beyond this, switching to firebase/php-jwt later is a drop-in swap since
// the token shape is standard JWT.

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    $padded = str_pad($data, strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + (4 - strlen($data) % 4), '=');
    return base64_decode(strtr($padded, '-_', '+/'));
}

function signToken(array $payload, ?int $expiresInSeconds = null): string
{
    $secret = env('JWT_SECRET');
    $expiresInSeconds = $expiresInSeconds ?? (int) env('JWT_EXPIRY_SECONDS', 604800);

    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiresInSeconds;

    $segments = [
        base64UrlEncode(json_encode($header)),
        base64UrlEncode(json_encode($payload)),
    ];

    $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
    $segments[] = base64UrlEncode($signature);

    return implode('.', $segments);
}

// Returns the decoded payload array on success, or null if the token is
// malformed, has an invalid signature, or has expired.
function verifyToken(string $token): ?array
{
    $secret = env('JWT_SECRET');
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$headerB64, $payloadB64, $signatureB64] = $parts;

    $expectedSignature = base64UrlEncode(hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true));
    if (!hash_equals($expectedSignature, $signatureB64)) {
        return null;
    }

    $payload = json_decode(base64UrlDecode($payloadB64), true);
    if (!is_array($payload)) {
        return null;
    }

    if (isset($payload['exp']) && time() >= $payload['exp']) {
        return null; // expired
    }

    return $payload;
}
