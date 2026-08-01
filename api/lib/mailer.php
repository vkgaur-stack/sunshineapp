<?php
require_once __DIR__ . '/../config/config.php';

// Sends the 80G donation receipt email using PHP's built-in mail()
// function — deliberately not SMTP/PHPMailer, since mail() works
// out-of-the-box on virtually all shared PHP hosting with zero
// configuration (unlike the Node version, which needed SMTP credentials).
//
// NOTE: mail() deliverability depends on your host having a properly
// configured mail server and SPF/DKIM records for your domain — if
// receipts land in spam, that's a hosting/DNS configuration issue to fix
// with your host, not a code issue.
function sendReceiptEmail(string $toEmail, string $toName, string $receiptNumber, float $amountInRupees, string $purpose, string $date): bool
{
    $subject = "Your 80G Donation Receipt — $receiptNumber";

    $html = "
    <div style='font-family: Arial, sans-serif; color: #2B2A28; max-width: 480px;'>
      <h2 style='color:#1B3556;'>Thank you, " . htmlspecialchars($toName) . ".</h2>
      <p>Your generous donation to <strong>Sunshine Social Foundation</strong> has been received.</p>
      <table style='width:100%; border-collapse: collapse; margin-top: 16px;'>
        <tr><td style='padding:6px 0; color:#666;'>Receipt No.</td><td style='padding:6px 0;'><strong>" . htmlspecialchars($receiptNumber) . "</strong></td></tr>
        <tr><td style='padding:6px 0; color:#666;'>Amount</td><td style='padding:6px 0;'>&#8377;" . number_format($amountInRupees, 2) . "</td></tr>
        <tr><td style='padding:6px 0; color:#666;'>Purpose</td><td style='padding:6px 0;'>" . htmlspecialchars($purpose) . "</td></tr>
        <tr><td style='padding:6px 0; color:#666;'>Date</td><td style='padding:6px 0;'>" . htmlspecialchars($date) . "</td></tr>
      </table>
      <p style='margin-top:16px; font-size: 13px; color:#666;'>
        This donation is eligible for tax deduction under Section 80G of the
        Income Tax Act. Please retain this receipt for your records.
      </p>
    </div>";

    $fromEmail = env('RECEIPT_FROM_EMAIL', 'no-reply@sunshinesocial.org');
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Sunshine Social Foundation <$fromEmail>\r\n";

    // mail() returns true only if the message was accepted for delivery
    // by the local mail transport — not a guarantee of actual inbox
    // delivery, same caveat as any fire-and-forget email send.
    return @mail($toEmail, $subject, $html, $headers);
}
