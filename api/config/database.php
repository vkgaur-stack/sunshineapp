<?php
require_once __DIR__ . '/config.php';

// A single shared PDO connection per request (PHP has no persistent
// in-process state between requests like Node does, so "singleton" here
// just means "don't reconnect twice within the same request").
function getDb(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $host = env('DB_HOST', 'localhost');
    $name = env('DB_NAME');
    $user = env('DB_USER');
    $pass = env('DB_PASS');

    $dsn = "mysql:host=$host;dbname=$name;charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // real prepared statements, not PHP-emulated
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        $detail = env('ENVIRONMENT') === 'development' ? $e->getMessage() : 'Database connection failed.';
        echo json_encode(['error' => $detail]);
        exit;
    }

    return $pdo;
}

// Generates a UUID v4 — MySQL has no built-in UUID default like Postgres,
// so every insert generates one here before writing, matching the CHAR(36)
// primary keys in schema.sql.
function generateUuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
