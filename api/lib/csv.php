<?php
// Minimal, dependency-free CSV writer — donation/accounting exports are
// simple flat rows, so PHP's built-in fputcsv (via a memory stream) is all
// that's needed; no library required.
function toCsv(array $rows, array $columns): string
{
    $stream = fopen('php://memory', 'r+');

    fputcsv($stream, array_map(fn($c) => $c['label'], $columns));
    foreach ($rows as $row) {
        fputcsv($stream, array_map(fn($c) => $c['value']($row), $columns));
    }

    rewind($stream);
    $csv = stream_get_contents($stream);
    fclose($stream);

    return $csv;
}
