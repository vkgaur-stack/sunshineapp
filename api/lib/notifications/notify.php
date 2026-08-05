<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/whatsapp.php';
require_once __DIR__ . '/sms.php';
require_once __DIR__ . '/templates.php';

// Single entry point for every outbound notification — mirrors
// notifications/index.js from the Node build. Every attempt (successful
// or not) is logged to notification_logs, and failures are always
// swallowed (never thrown) so a notification problem can never break the
// underlying business action (booking, donation, etc).
function notify(string $channel, string $to, string $templateType, array $variables, ?string $relatedType = null, ?string $relatedId = null): array
{
    $message = renderNotificationTemplate($templateType, $variables);
    $db = getDb();

    $logId = generateUuid();
    $db->prepare('
        INSERT INTO notification_logs (id, channel, to_address, template_type, related_type, related_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ')->execute([$logId, $channel, $to, $templateType, $relatedType, $relatedId, 'QUEUED']);

    try {
        if ($channel === 'WHATSAPP') {
            $result = sendWhatsApp($to, $message, $templateType);
        } elseif ($channel === 'SMS') {
            $result = sendSms($to, $message);
        } else {
            throw new Exception("notify() does not handle channel \"$channel\" — use lib/mailer.php for EMAIL.");
        }

        $db->prepare("UPDATE notification_logs SET status = 'SENT', sent_at = NOW(), provider_response = ? WHERE id = ?")
           ->execute([json_encode($result), $logId]);

        return array_merge($result, ['logId' => $logId]);
    } catch (Exception $e) {
        $db->prepare("UPDATE notification_logs SET status = 'FAILED', provider_response = ? WHERE id = ?")
           ->execute([$e->getMessage(), $logId]);
        error_log("Notification failed [$channel/$templateType] to $to: " . $e->getMessage());
        return ['delivered' => false, 'mode' => 'failed', 'logId' => $logId];
    }
}

// Sends via the beneficiary/donor's preferred channel, falling back to SMS
// if their preference isn't usable — same logic as notifyPreferred() in
// the Node build.
function notifyPreferred(string $preferredContact, ?string $phone, ?string $email, string $templateType, array $variables, ?string $relatedType = null, ?string $relatedId = null): array
{
    if ($preferredContact === 'WHATSAPP' && $phone) {
        return notify('WHATSAPP', $phone, $templateType, $variables, $relatedType, $relatedId);
    }
    if ($preferredContact === 'PHONE' && $phone) {
        return notify('SMS', $phone, $templateType, $variables, $relatedType, $relatedId);
    }
    // EMAIL preference: transactional emails go through lib/mailer.php
    // separately, not this WhatsApp/SMS-scoped function — fall through to
    // SMS here so the notification still reaches someone.
    if ($phone) {
        return notify('SMS', $phone, $templateType, $variables, $relatedType, $relatedId);
    }
    return ['delivered' => false, 'mode' => 'no-usable-contact'];
}

// For non-templated content, e.g. the WhatsApp chatbot's dynamic replies.
function notifyRaw(string $channel, string $to, string $message, string $templateType = 'CHATBOT_REPLY', ?string $relatedType = null, ?string $relatedId = null): array
{
    $db = getDb();
    $logId = generateUuid();
    $db->prepare('
        INSERT INTO notification_logs (id, channel, to_address, template_type, related_type, related_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ')->execute([$logId, $channel, $to, $templateType, $relatedType, $relatedId, 'QUEUED']);

    try {
        $result = $channel === 'WHATSAPP' ? sendWhatsApp($to, $message, $templateType) : sendSms($to, $message);
        $db->prepare("UPDATE notification_logs SET status = 'SENT', sent_at = NOW(), provider_response = ? WHERE id = ?")
           ->execute([json_encode($result), $logId]);
        return array_merge($result, ['logId' => $logId]);
    } catch (Exception $e) {
        $db->prepare("UPDATE notification_logs SET status = 'FAILED', provider_response = ? WHERE id = ?")
           ->execute([$e->getMessage(), $logId]);
        return ['delivered' => false, 'mode' => 'failed', 'logId' => $logId];
    }
}
