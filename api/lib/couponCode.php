<?php
// Human-readable, hard-to-guess coupon code: SSF-2026-A1B2C3
function generateCouponCode(): string
{
    $year = date('Y');
    $random = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
    return "SSF-$year-$random";
}
