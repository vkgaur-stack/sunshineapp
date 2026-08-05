<?php
// API keys are high-entropy random tokens, not passwords — a fast
// deterministic hash (SHA-256) for lookup is the standard approach used by
// providers like Stripe/GitHub, unlike bcrypt which is for low-entropy
// human passwords needing per-hash salting against offline brute force.
function generateApiKey(): array
{
    $raw = 'ssf_' . bin2hex(random_bytes(24));
    $prefix = substr($raw, 0, 12);
    $hash = hash('sha256', $raw);
    return ['raw' => $raw, 'prefix' => $prefix, 'hash' => $hash];
}
