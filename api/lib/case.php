<?php
// Converts snake_case array keys (how MySQL/PDO naturally returns column
// names) to camelCase (what the frontend expects, matching the original
// Node/Prisma backend's convention). This is the fix for a whole class of
// "field shows blank/undefined in the UI even though the database has the
// right data" bugs — org-settings.php was the first one found, but the
// same raw-passthrough pattern existed in several other endpoints too.
function toCamelCase(string $snake): string
{
    return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $snake))));
}

// Converts every key in a single associative array (one database row).
function rowToCamelCase(?array $row): ?array
{
    if ($row === null) {
        return null;
    }
    $result = [];
    foreach ($row as $key => $value) {
        $result[toCamelCase($key)] = $value;
    }
    return $result;
}

// Converts every row in an array of associative arrays (fetchAll() result).
function rowsToCamelCase(array $rows): array
{
    return array_map('rowToCamelCase', $rows);
}
