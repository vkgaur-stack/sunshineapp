<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/razorpay.php';
require_once __DIR__ . '/../lib/receipt.php';
require_once __DIR__ . '/../lib/mailer.php';
require_once __DIR__ . '/../lib/notifications/notify.php';

applyCommonHeaders();
requireMethod('POST');

$body = getJsonBody();
$orderId = requireField($body, 'razorpay_order_id');
$paymentId = requireField($body, 'razorpay_payment_id');
$signature = requireField($body, 'razorpay_signature');

if (!razorpayVerifySignature($orderId, $paymentId, $signature)) {
    $db = getDb();
    $db->prepare("UPDATE donations SET status = 'FAILED' WHERE razorpay_order_id = ?")->execute([$orderId]);
    jsonError('Payment verification failed.', 400);
}

$db = getDb();
$stmt = $db->prepare('
    SELECT d.*, dn.full_name, dn.email, dn.mobile_number
    FROM donations d JOIN donors dn ON dn.id = d.donor_id
    WHERE d.razorpay_order_id = ?
');
$stmt->execute([$orderId]);
$donation = $stmt->fetch();

if (!$donation) {
    jsonError('Donation not found for this order.', 404);
}

$receiptNumber = generateReceiptNumber();

$update = $db->prepare("
    UPDATE donations
    SET status = 'SUCCESS', razorpay_payment_id = ?, receipt_number = ?
    WHERE id = ?
");
$update->execute([$paymentId, $receiptNumber, $donation['id']]);

// Best-effort — a failed email should never block payment confirmation.
if ($donation['email']) {
    $sent = sendReceiptEmail(
        $donation['email'],
        $donation['full_name'],
        $receiptNumber,
        $donation['amount_in_paise'] / 100,
        $donation['purpose'],
        date('j F Y')
    );
    if ($sent) {
        $db->prepare('UPDATE donations SET receipt_sent_at = NOW() WHERE id = ?')->execute([$donation['id']]);
    }
}

// WhatsApp/SMS thank-you — separate from the email receipt, reaches the
// donor even if they mistyped their email or prefer WhatsApp.
if ($donation['mobile_number']) {
    try {
        notify(
            'WHATSAPP',
            $donation['mobile_number'],
            'DONATION_THANK_YOU',
            [
                'fullName' => $donation['full_name'],
                'amountInRupees' => $donation['amount_in_paise'] / 100,
                'receiptNumber' => $receiptNumber,
            ],
            'Donation',
            $donation['id']
        );
    } catch (Exception $e) {
        error_log('Donation thank-you notification failed: ' . $e->getMessage());
    }
}

jsonResponse(['success' => true, 'receiptNumber' => $receiptNumber]);
