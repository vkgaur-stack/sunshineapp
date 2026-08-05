<?php
// Loads .env into getenv()/$_ENV without requiring Composer or any
// third-party library — deliberately dependency-free so this runs on the
// most restrictive shared hosting with zero setup beyond uploading files.

function loadEnv(string $path): void
{
    if (!file_exists($path)) {
        // Fail loudly rather than silently running with no config — a
        // missing .env should never quietly fall through to defaults for
        // things like JWT_SECRET.
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Server misconfigured: .env file not found. Copy .env.example to .env and fill in real values.']);
        exit;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        // Strip matching surrounding quotes, if present.
        if (strlen($value) >= 2 && $value[0] === '"' && $value[-1] === '"') {
            $value = substr($value, 1, -1);
        }
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

loadEnv(__DIR__ . '/../.env');

function env(string $key, $default = null)
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}
