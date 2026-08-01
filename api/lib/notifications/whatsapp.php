<?php
require_once __DIR__ . '/../../config/config.php';

// Adapter for a WhatsApp Business Solution Provider (BSP) — Interakt,
// Gupshup, and AiSensy all expose a broadly similar "send message" REST
// endpoint, so this shape should need only field-name tweaks for whichever
// BSP you contract with. Same dev-fallback pattern as lib/mailer.php: if
// WHATSAPP_API_URL isn't set, log instead of sending.
//
// IMPORTANT: WhatsApp Business API requires message templates to be
// pre-approved by Meta before sending outside a 24-hour customer-service
// window. The $templateType values used here are meant to map 1:1 to
// template names registered with your BSP.
function sendWhatsApp(string $to, string $message, string $templateType): array
{
    $apiUrl = env('WHATSAPP_API_URL');

    if (!$apiUrl) {
        error_log("[whatsapp:dev-fallback] To: $to | Template: $templateType | Message: $message");
        return ['delivered' => false, 'mode' => 'log-fallback'];
    }

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . env('WHATSAPP_API_KEY'),
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'from' => env('WHATSAPP_FROM_NUMBER'),
            'to' => $to,
            'templateType' => $templateType,
            'message' => $message,
        ]),
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode >= 300) {
        throw new Exception("WhatsApp send failed (HTTP $httpCode)");
    }

    return ['delivered' => true, 'mode' => 'api', 'response' => $response];
}
