# API Reference — Sunshine Social Foundation Backend

Base URL (local): `http://localhost:4000/api`

This is the contract the frontend builds against — and the same contract
any future integration (mobile app, WhatsApp bot, partner clinic portal,
CRM) would use. All request/response bodies are JSON.

**Auth:** admin-only endpoints require `Authorization: Bearer <token>`,
obtained from `POST /admin/login`. Public endpoints need no auth.

---

## Beneficiaries

### `POST /beneficiaries/register` — public
Registers a new beneficiary.

```json
{
  "fullName": "Asha Sharma",
  "dateOfBirth": "1958-04-12",
  "gender": "Female",
  "mobileNumber": "9876543210",
  "email": "asha@example.com",
  "addressLine": "12 MG Road",
  "city": "Indore",
  "state": "Madhya Pradesh",
  "serviceInterest": "Physiotherapy",
  "problemNotes": "Knee pain for 6 months",
  "preferredContact": "WHATSAPP",
  "consentGiven": true
}
```
→ `201 { "beneficiary": { ...id, fullName, ... } }`
→ `409` if mobile number already registered

### `POST /beneficiaries/lookup` — public
Low-friction "login" — no password, matches mobile + date of birth.
```json
{ "mobileNumber": "9876543210", "dateOfBirth": "1958-04-12" }
```
→ `200 { "beneficiary": {...} }` or `404` if not found

### `GET /beneficiaries?city=&search=` — admin
Lists beneficiaries (filterable by city, or name/mobile search).

---

## Services

### `GET /services` — public
Lists active services (powers "Our Services" page + appointment form dropdown).

### `POST /services` — admin (SUPER_ADMIN only)
Creates a service. `{ "name": "...", "description": "..." }`

---

## Camps

### `GET /camps` — public
Lists upcoming published camps.

### `POST /camps` — admin (SUPER_ADMIN, CAMP_COORDINATOR)
```json
{
  "title": "Sunshine Health Camp — Indore",
  "city": "Indore",
  "locality": "Nipania",
  "venueDetails": "Community Hall, Nipania",
  "startAt": "2026-08-25T09:00:00Z",
  "endAt": "2026-08-25T13:00:00Z",
  "capacity": 100,
  "isPublished": true
}
```

### `PATCH /camps/:id` — admin
Partial update, same fields as above.

---

## Appointments

### `POST /appointments` — public (requires an existing beneficiaryId)
```json
{
  "beneficiaryId": "uuid",
  "serviceId": "uuid",
  "campId": "uuid | omit",
  "preferredDate": "2026-08-25",
  "timeSlot": "10:00 AM – 11:00 AM",
  "notes": "optional"
}
```
→ `404` if beneficiaryId doesn't exist (frontend prompts registration first)

### `GET /appointments/mine?beneficiaryId=uuid` — public
Returns a beneficiary's own appointment history.

### `GET /appointments?status=` — admin
Lists all appointments, optionally filtered by status
(`REQUESTED | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW`).

### `PATCH /appointments/:id/status` — admin
```json
{ "status": "CONFIRMED" }
```

---

## Donations

### `POST /donations/create-order` — public
Creates a Donor record + Razorpay order.
```json
{
  "fullName": "Ramesh Gupta",
  "mobileNumber": "9123456780",
  "email": "ramesh@example.com",
  "panNumber": "ABCDE1234F",
  "amountInRupees": 500,
  "purpose": "Sponsor a Health Camp"
}
```
→ `201 { "donationId", "orderId", "amount", "currency", "keyId" }`
— frontend uses this to open Razorpay Checkout.

### `POST /donations/verify` — public
Called by the frontend after Razorpay Checkout succeeds. Verifies the
payment signature server-side (never trust client-side "success" alone).
```json
{ "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..." }
```

### `GET /donations` — admin
Lists all donations with donor info.

---

## Get Involved / Contact

### `POST /partner-requests` — public
```json
{
  "category": "VOLUNTEER",
  "orgOrName": "Individual",
  "contactName": "Priya Nair",
  "mobileNumber": "9988776655",
  "email": "priya@example.com",
  "message": "I'd like to volunteer at camps in Mumbai."
}
```
`category` must be one of: `CSR_PARTNER | MEDICAL_PARTNER | VOLUNTEER | DONOR | COMMUNITY_PARTNER`

### `POST /contact-messages` — public
```json
{
  "fullName": "Vikram Rao",
  "mobileNumber": "9012345678",
  "email": "vikram@example.com",
  "subject": "Camp query",
  "message": "When is the next camp in Pune?"
}
```

### `GET /admin/partner-requests` — admin
### `GET /admin/contact-messages` — admin

---

## Admin Auth

### `POST /admin/login` — public
```json
{ "email": "admin@sunshinesocial.org", "password": "..." }
```
→ `200 { "token": "jwt...", "admin": { "id", "fullName", "role" } }`

Roles: `SUPER_ADMIN | CAMP_COORDINATOR | FINANCE`

---

## Error Shape

All errors return:
```json
{ "error": "Human-readable message", "details": { "field": ["..."] } }
```
`details` is only present on validation failures (400).

---

## Impact (Phase 2)

### `GET /impact` — public
Live-calculated stats, no caching — always reflects current data.
```json
{
  "totalBeneficiaries": 42,
  "beneficiariesServed": 30,
  "sessionsCompleted": 55,
  "campsHeld": 3,
  "citiesServed": 2,
  "couponsRedeemed": 12,
  "subsidyDeliveredInRupees": 7200,
  "lastUpdated": "2026-07-27T10:00:00.000Z"
}
```

---

## Coupons (Phase 2)

### `POST /coupons/generate` — admin (SUPER_ADMIN, FINANCE)
```json
{
  "donationId": "uuid | omit for general pool",
  "serviceId": "uuid",
  "quantity": 10,
  "subsidyPercent": 75,
  "valueInPaise": 60000,
  "expiresAt": "2027-01-01"
}
```
→ `201 { "coupons": [...], "count": 10 }`

### `POST /coupons/:id/assign` — admin (SUPER_ADMIN, CAMP_COORDINATOR)
```json
{ "beneficiaryId": "uuid" }
```

### `GET /coupons?status=&beneficiaryId=` — admin
Lists coupons with service, beneficiary, and redeeming-clinic details.

### `GET /coupons/:code/qr-code` — public
Returns a PNG image of the coupon's QR code (embed via `<img src="...">`).

---

## Partner Clinics (Phase 2)

### `POST /admin/clinics` — admin (SUPER_ADMIN)
```json
{ "name": "...", "city": "...", "address": "...", "contactPerson": "...", "mobileNumber": "...", "email": "..." }
```

### `GET /admin/clinics` — admin

### `POST /admin/clinics/:clinicId/users` — admin (SUPER_ADMIN)
Creates a clinic staff login.
```json
{ "fullName": "...", "email": "...", "password": "..." }
```

---

## Clinic Portal (Phase 2 — separate auth from admin)

### `POST /clinic/login` — public
```json
{ "email": "...", "password": "..." }
```
→ `200 { "token": "jwt...", "clinicUser": {...}, "clinic": {...} }`

A clinic token is **not** an admin token — it's scoped to that one clinic
and only works on `/clinic/*` routes.

### `POST /clinic/coupons/validate` — clinic auth
```json
{ "code": "SSF-2026-A1B2C3" }
```
→ `200 { "valid": true, "coupon": {...} }` or `400/404` with a reason.

### `POST /clinic/coupons/:id/redeem` — clinic auth
Marks the coupon redeemed at the authenticated clinic.

### `GET /clinic/coupons/history` — clinic auth
Coupons redeemed by this clinic only.

---

## Notifications (Phase 3)

### `GET /admin/notifications?channel=&status=` — admin
Audit log of every outbound WhatsApp/SMS attempt.
```json
{
  "notifications": [
    {
      "id": "uuid", "channel": "WHATSAPP", "toAddress": "9876543210",
      "templateType": "APPOINTMENT_CONFIRMED", "relatedType": "Appointment",
      "relatedId": "uuid", "status": "SENT", "createdAt": "...", "sentAt": "..."
    }
  ],
  "count": 1
}
```

### `POST /camps/:id/announce` — admin (SUPER_ADMIN, CAMP_COORDINATOR)
Sends a `CAMP_ANNOUNCEMENT` notification to every beneficiary in the camp's city.
→ `200 { "camp": {...}, "targetedBeneficiaries": 12, "notificationsAttempted": 12, "notificationsSent": 12 }`

### `GET /camps/admin` — admin
All camps regardless of publish status (the public `GET /camps` only
returns published, upcoming camps).

### `POST /webhooks/whatsapp` — public (inbound from your WhatsApp BSP)
Expects a normalized body — add a small per-BSP mapping shim in front of
this if your provider's webhook payload is shaped differently:
```json
{ "from": "+919876543210", "text": "STATUS" }
```
Replies with a keyword-matched menu response (BOOK / STATUS / anything
else → help menu) and logs the reply to `NotificationLog`.

---

## Organization Settings (Phase 4)

### `GET /org-settings` — public
Singleton row, auto-created with defaults on first request.

### `PUT /admin/org-settings` — admin (SUPER_ADMIN only)
Any subset of fields — see `backend/prisma/schema.prisma` `OrgSettings`
model for the full field list (registration numbers, bank/UPI details,
contact info, social links).

---

## Reports & Exports (Phase 4)

All three require admin auth (`SUPER_ADMIN` or `FINANCE`) and accept
optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` query params (omit for all-time).

### `GET /admin/reports/donations.csv`
Plain CSV, importable into Tally, Zoho Books, or Excel directly.

### `GET /admin/reports/donations/tally-xml`
Simplified Tally-importable voucher XML. Edit `LEDGER_NAME` and
`CASH_LEDGER_NAME` in `reports.controller.js` to match your actual Tally
chart of accounts before relying on this.

### `GET /admin/reports/csr-summary.xlsx`
Multi-sheet Excel workbook: impact summary, donation detail, coupon
redemption detail — ready to hand to a CSR partner.

---

## API Keys & External Integrations (Phase 4)

### `POST /admin/api-keys` — admin (SUPER_ADMIN)
```json
{ "label": "Zoho Books sync", "scopes": "donations:read" }
```
→ `201 { "apiKey": "ssf_...", "warning": "Save this key now..." }` — the
raw key is shown exactly once and never retrievable again.

### `GET /admin/api-keys` — admin (SUPER_ADMIN)
### `DELETE /admin/api-keys/:id` — admin (SUPER_ADMIN) — revokes a key

### `GET /external/donations?from=&to=` — requires `X-API-Key` header with `donations:read` scope
Read-only donation feed for external systems — no admin login needed.
```bash
curl -H "X-API-Key: ssf_..." "https://yourdomain.com/api/external/donations"
```

---

## Future Integration Notes

- Every endpoint above is a stable contract — a WhatsApp bot (Phase 3) or
  partner clinic portal (Phase 2) can call the same `/appointments` and
  `/beneficiaries` endpoints the website uses, no backend changes needed.
- To add a new consumer, only a CORS entry (`FRONTEND_ORIGIN` — extend to a
  list if multiple origins are needed) and, if it needs write access, a new
  admin role or a scoped API key would need to be added.
