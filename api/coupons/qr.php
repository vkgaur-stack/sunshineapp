<?php
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';

applyCommonHeaders();
requireMethod('GET');

$code = $_GET['code'] ?? null;
if (!$code) {
    jsonError('code query parameter is required.', 400);
}

// NOTE ON THIS APPROACH: generating a correct, scannable QR code in pure
// PHP with zero dependencies is genuinely hard to do reliably (the
// encoding + Reed-Solomon error correction algorithm is substantial, and
// getting it subtly wrong produces images that *look* like QR codes but
// don't scan). Rather than hand-roll that and risk an untestable bug,
// this proxies a public QR-image API server-side — the coupon code itself
// isn't secret in a way that leaking it via this URL matters (it's
// already printed/shown to the beneficiary), and proxying (rather than
// redirecting) keeps the image served from your own domain.
//
// This requires your PHP host to allow outbound HTTPS requests — true on
// virtually all standard hosting, but if yours blocks it, swap the URL
// below for another QR API provider, or a self-hosted alternative.
$qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($code);

$ch = curl_init($qrApiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);
$imageData = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($imageData === false || $httpCode >= 300) {
    jsonError('Could not generate QR code image. Check outbound network access from this server.', 502);
}

header('Content-Type: image/png');
header('Cache-Control: public, max-age=86400');
echo $imageData;
