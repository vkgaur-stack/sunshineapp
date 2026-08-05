<?php
require_once __DIR__ . '/response.php';

// Small, dependency-free validation helpers — the PHP equivalent of the
// Zod schemas in the Node backend, just less declarative. Each function
// either returns the cleaned value or calls jsonError() and exits.

function requireField(array $body, string $field, string $label = null): mixed
{
    $label = $label ?? $field;
    if (!isset($body[$field]) || $body[$field] === '') {
        jsonError("$label is required.", 400, ['field' => $field]);
    }
    return $body[$field];
}

function optionalField(array $body, string $field, $default = null)
{
    return $body[$field] ?? $default;
}

function validateMobileNumber(string $value, string $label = 'Mobile number'): string
{
    if (!preg_match('/^[6-9]\d{9}$/', $value)) {
        jsonError("$label must be a valid 10-digit Indian mobile number.", 400);
    }
    return $value;
}

function validateEmail(?string $value, string $label = 'Email'): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
        jsonError("$label is not a valid email address.", 400);
    }
    return $value;
}

function validateEnum(string $value, array $allowed, string $label = 'Value'): string
{
    if (!in_array($value, $allowed, true)) {
        jsonError("$label must be one of: " . implode(', ', $allowed), 400);
    }
    return $value;
}

function validateUuid(string $value, string $label = 'ID'): string
{
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value)) {
        jsonError("$label is not a valid ID.", 400);
    }
    return $value;
}
