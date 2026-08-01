<?php
// Plain-language templates matching lib/notifications/templates.php from
// the Node build — keep these short (WhatsApp template messages have
// length/variable limits, SMS is billed per 160-char segment).
//
// NOTE: these keys must match whatever template names are registered and
// approved with your WhatsApp BSP before going live.

function renderNotificationTemplate(string $templateType, array $vars): string
{
    switch ($templateType) {
        case 'APPOINTMENT_REQUESTED':
            return "Hi {$vars['fullName']}, we've received your appointment request for {$vars['serviceName']} on {$vars['preferredDate']} ({$vars['timeSlot']}). We'll confirm shortly. — Sunshine Social Foundation";

        case 'APPOINTMENT_CONFIRMED':
            return "Hi {$vars['fullName']}, your appointment for {$vars['serviceName']} on {$vars['preferredDate']} ({$vars['timeSlot']}) is CONFIRMED. Please carry any prior medical reports. — Sunshine Social Foundation";

        case 'APPOINTMENT_REMINDER':
            return "Reminder: {$vars['fullName']}, your {$vars['serviceName']} appointment is on {$vars['preferredDate']} ({$vars['timeSlot']}). Reply CANCEL if you can't make it. — Sunshine Social Foundation";

        case 'DONATION_THANK_YOU':
            return "Thank you, {$vars['fullName']}! Your donation of \u20b9{$vars['amountInRupees']} helps deliver subsidised care. Receipt {$vars['receiptNumber']} has been emailed to you. — Sunshine Social Foundation";

        case 'COUPON_ISSUED':
            return "Hi {$vars['fullName']}, you've been issued a subsidy coupon for {$vars['serviceName']} (Code: {$vars['code']}). Valid until {$vars['expiresOn']}. Show this at any partner clinic. — Sunshine Social Foundation";

        case 'CAMP_ANNOUNCEMENT':
            return "Hi {$vars['fullName']}, join us at \"{$vars['campTitle']}\" in {$vars['city']} on {$vars['startDate']} for free/subsidised health services. Reply BOOK to register interest. — Sunshine Social Foundation";

        default:
            throw new Exception("Unknown notification template: $templateType");
    }
}
