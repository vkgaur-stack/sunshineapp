<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/notifications/notify.php';

applyCommonHeaders();
requireMethod('POST');

// NOTE ON PAYLOAD SHAPE: every WhatsApp BSP (Interakt, Gupshup, AiSensy)
// sends a differently-shaped webhook payload. Rather than hardcode one
// BSP's shape, this handler expects an already-normalized body:
//   { "from": "+91...", "text": "BOOK" }
// Add one small mapping function per BSP that extracts from/text from
// their specific payload and calls this same logic.
//
// Also add signature/token verification for your specific BSP before
// processing in production — left as a TODO since the method is
// BSP-specific.

$body = getJsonBody();
$from = $body['from'] ?? null;
$text = $body['text'] ?? null;

if (!$from || !is_string($text)) {
    jsonError('Expected { from, text } in webhook body.', 400);
}

$normalized = strtoupper(trim($text));
$mobileNumber = substr(preg_replace('/\D/', '', $from), -10); // last 10 digits, India-style

$db = getDb();

if (str_contains($normalized, 'STATUS')) {
    $benStmt = $db->prepare('SELECT * FROM beneficiaries WHERE mobile_number = ?');
    $benStmt->execute([$mobileNumber]);
    $beneficiary = $benStmt->fetch();

    if (!$beneficiary) {
        $reply = "We couldn't find a registration for this number. Reply BOOK to register, or visit our website.";
    } else {
        $apptStmt = $db->prepare('
            SELECT a.*, s.name AS service_name
            FROM appointments a JOIN services s ON s.id = a.service_id
            WHERE a.beneficiary_id = ?
            ORDER BY a.created_at DESC LIMIT 1
        ');
        $apptStmt->execute([$beneficiary['id']]);
        $appointment = $apptStmt->fetch();

        $reply = $appointment
            ? "Hi {$beneficiary['full_name']}, your latest appointment for {$appointment['service_name']} is: {$appointment['status']}."
            : "Hi {$beneficiary['full_name']}, you don't have any appointments yet. Reply BOOK for help booking one.";
    }
} elseif (str_contains($normalized, 'BOOK')) {
    $reply = 'To book an appointment, please visit our website and use "Book an Appointment" — ' .
        "you'll need to be registered first. Reply STATUS anytime to check an existing appointment.";
} else {
    $reply = "Welcome to Sunshine Social Foundation. Reply:\n" .
        "BOOK — for help booking an appointment\n" .
        "STATUS — to check your latest appointment\n" .
        'Or visit our website for full details.';
}

$result = notifyRaw('WHATSAPP', $from, $reply, 'CHATBOT_REPLY');

jsonResponse(['replied' => true, 'reply' => $reply, 'deliveryResult' => $result]);
