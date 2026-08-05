# Sunshine Social Foundation — PHP/MySQL Backend

This is a **plain PHP** (no framework, no Composer) reimplementation of the
Node.js/Express backend, built specifically to run on standard shared
cPanel-style hosting where only PHP + MySQL are available.

It is being migrated in stages, mirroring the original Node build phases.
**This is Stage 1**, covering authentication and the core beneficiary/
appointment booking flow.

---

## Why plain PHP, no framework

Basic shared hosting often can't run `composer install` (no SSH/CLI access,
or Composer isn't installed), and can't run a persistent Node process.
Plain PHP files need nothing beyond uploading them — Apache/LiteSpeed runs
`.php` files natively, no build step, no dependency install, no server
process to keep alive.

## Why file-based endpoints, not pretty URLs

Each API endpoint is a literal `.php` file (e.g. `api/beneficiaries/register.php`)
rather than routed through a front controller with `.htaccess` rewrites.
This works on every PHP host without exception — some shared hosts restrict
or misconfigure `mod_rewrite`, and file-based routing has zero dependency
on it working correctly.

---

## What's built — Stages 1 through 4 (complete)

| Area | Endpoints |
|---|---|
| Admin auth | `POST /api/admin/login.php` |
| Clinic auth | `POST /api/clinic/login.php` |
| Beneficiaries | `POST /api/beneficiaries/register.php`, `POST /api/beneficiaries/lookup.php`, `GET /api/beneficiaries/list.php` (admin) |
| Services | `GET /api/services/list.php` |
| Appointments | `POST /api/appointments/book.php`, `GET /api/appointments/mine.php`, `GET /api/appointments/list.php` (admin), `PATCH /api/appointments/update-status.php?id=...` (admin) |
| Donations | `POST /api/donations/create-order.php`, `POST /api/donations/verify.php`, `GET /api/donations/list.php` (admin) |
| Coupons | `POST /api/coupons/generate.php` (admin), `POST /api/coupons/assign.php?id=...` (admin), `GET /api/coupons/list.php` (admin), `GET /api/coupons/qr.php?code=...` (public) |
| Clinic management | `POST /api/admin/clinics/create.php`, `GET /api/admin/clinics/list.php`, `POST /api/admin/clinics/create-user.php?clinicId=...` |
| Clinic portal | `POST /api/clinic/coupons/validate.php`, `POST /api/clinic/coupons/redeem.php?id=...`, `GET /api/clinic/coupons/history.php` |
| Camps | `GET /api/camps/list.php` (public), `GET /api/admin/camps/list.php`, `POST /api/admin/camps/create.php`, `PATCH /api/admin/camps/update.php?id=...`, `POST /api/admin/camps/announce.php?id=...` |
| Notifications | `GET /api/admin/notifications/list.php`, `POST /api/webhooks/whatsapp.php` |
| Org settings | `GET /api/org-settings.php` (public), `PUT /api/admin/org-settings-update.php` |
| Reports/exports | `GET /api/admin/reports/donations-csv.php`, `GET /api/admin/reports/donations-tally-xml.php`, `GET /api/admin/reports/csr-summary-xlsx.php` |
| API keys | `POST /api/admin/api-keys/create.php`, `GET /api/admin/api-keys/list.php`, `DELETE /api/admin/api-keys/revoke.php?id=...`, `GET /api/external/donations.php` (API-key gated) |

**Everything above was tested end-to-end against a real MySQL/MariaDB
database** — roughly 73 live test cases across all four stages. Stage 4
specifically: org settings singleton behavior, API key creation/use/
revocation (including a bogus-key and a revoked-key rejection test), and
— most rigorously — downloading the actual generated CSV, Tally XML, and
XLSX files from a live running server and validating them for real:
the Tally XML parsed as well-formed XML with Python's `ElementTree`, and
the XLSX was opened with `openpyxl` to confirm sheet names, cell values,
number types, and bold header formatting all round-trip correctly.

### On the XLSX export — no PhpSpreadsheet, no Composer
`lib/xlsx.php` is a small, purpose-built Office Open XML writer using only
PHP's built-in `ZipArchive` extension (present on virtually all PHP
hosting — WordPress and most CMS platforms require it, so hosts enable it
by default). It supports exactly what these reports need: multiple sheets,
string/number cells, and bold header rows — not a general-purpose
spreadsheet library. Verified genuinely valid (not just "should work") by
actually opening generated files with `openpyxl`, including a
special-characters test (`&`, `<`, `>`, `"` all correctly XML-escaped and
round-tripped).

### Notification triggers now wired in
- Booking an appointment → `APPOINTMENT_REQUESTED`
- Confirming an appointment (admin) → `APPOINTMENT_CONFIRMED`
- Successful donation → `DONATION_THANK_YOU` (WhatsApp/SMS, alongside the
  email receipt from Stage 2)
- Assigning a coupon to a beneficiary → `COUPON_ISSUED`
- Announcing a camp (admin) → `CAMP_ANNOUNCEMENT` to every beneficiary in
  that camp's city

All notification attempts — successful or not — are logged to
`notification_logs` and visible via `GET /api/admin/notifications/list.php`.
Without `WHATSAPP_API_URL`/`SMS_API_URL` configured, messages log instead
of sending (via PHP's `error_log()`), same safe-default pattern as the
mailer from Stage 2.

### A subtlety worth knowing: "sent" vs. "logged"
`api/admin/camps/announce.php` reports `notificationsSent` using a strict
"was this actually delivered" check (`delivered !== false`), which is
`false` in dev-fallback/log-only mode — so with no WhatsApp/SMS provider
configured, this count will correctly show `0` even though every attempt
succeeded and is logged. This exactly matches the Node build's equivalent
logic — not a bug, but worth knowing so a `0` doesn't look alarming during
local testing.

### On the WhatsApp webhook
`api/webhooks/whatsapp.php` expects an already-normalized
`{ "from": "...", "text": "..." }` body. Every WhatsApp BSP sends a
differently-shaped webhook payload — add a small per-BSP mapping function
in front of this endpoint (or inside it) that extracts `from`/`text` from
your specific provider's format. Also add your BSP's signature/token
verification before processing in production (left as a TODO — the
method is provider-specific).

## Migration Complete

All four stages are now ported: auth/beneficiaries/appointments (Stage 1),
donations/coupons/clinics (Stage 2), notifications/camps (Stage 3), and
reports/settings/API keys (Stage 4). This PHP backend now has full
functional parity with the Node.js/Express backend in `../backend/`.

### Env vars added in Stage 4
```
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET   — already required since Stage 2
```
No new environment variables were needed for Stage 4 — org settings,
reports, and API keys all work with the same `.env` from earlier stages.

## Notes From Testing This Build

**A genuine bug this testing caught (Stage 2):** `api/donations/verify.php`
initially called `requireField()` without `require`-ing `lib/validate.php`
— a mistake `php -l` (syntax-only checking) cannot catch, since calling an
undefined function is a runtime error, not a parse error. It only surfaced
by actually running the endpoint and reading the error log. Fixed, and a
small audit script now checks every endpoint's function usage against its
requires to catch this class of bug going forward.

**On the QR code endpoint (Stage 2):** `api/coupons/qr.php` proxies a
public QR-image API (`api.qrserver.com`) server-side rather than
generating the QR code in pure PHP. Hand-rolling correct QR encoding (with
Reed-Solomon error correction) from scratch risks a subtle bug that
produces images that *look* like QR codes but don't actually scan — not
worth that risk for a zero-dependency constraint. This does mean **your
PHP host needs to allow outbound HTTPS requests** (true on virtually all
standard hosting). If yours blocks it, swap the URL in that file for
another QR API provider.

---

## Local Setup

**Prerequisite:** the CSR summary export (Stage 4) needs PHP's `zip`
extension (`ZipArchive` class) enabled — this is on by default on nearly
all hosting (WordPress and most CMS platforms require it), but if you hit
an error on that one report, check `php -m | grep zip` and enable it via
your host's PHP configuration if missing. Nothing else in this backend
needs it.

### 1. Database
```bash
mysql -u your_user -p your_database < schema.sql
```

### 2. Config
```bash
cp .env.example .env
```
Edit `.env` with your real DB credentials and a long random `JWT_SECRET`
(generate one with `php -r "echo bin2hex(random_bytes(32));"`).

### 3. Seed data
```bash
php scripts/seed.php
```
Creates the admin login (from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in
`.env`), sample services, and a demo partner clinic + clinic login.

### 4. Run locally
```bash
php -S localhost:8080
```
Then test, e.g.:
```bash
curl -X POST http://localhost:8080/api/admin/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sunshinesocial.org","password":"your-seeded-password"}'
```

---

## Deploying to cPanel Shared Hosting

**Simplest path: use `../deploy.sh` from the project root** — it builds
the frontend and assembles a single `deploy_package/` folder containing
this `api/` folder plus the static site, ready to upload as one unit. See
`../DEPLOYMENT.md` for the full walkthrough.

Manual steps, if you're deploying this folder on its own:

1. Create a MySQL database and user via cPanel's **MySQL Databases** tool.
   cPanel-created names are usually prefixed, e.g. `cpaneluser_sunshine`.
2. Import `schema.sql` via **phpMyAdmin** (Import tab) or the command line
   if your host offers SSH access.
3. Upload this entire `api/` folder via **File Manager** or FTP, as a
   subfolder of `public_html` — e.g. `public_html/api/`.
4. Create `.env` on the server (via File Manager — don't upload your local
   one if it has different credentials) with your real DB credentials.
5. Run `php scripts/seed.php` once — either via an SSH session if your
   host provides one, or temporarily via a one-off script accessed through
   the browser (delete it immediately after running).
6. Point your frontend's API base URL at `https://yourdomain.com/api/`
   (or wherever you uploaded this folder).

**No Node.js, no Composer, no build step required at any point.**

---

## Security Notes

- Passwords are hashed with PHP's `password_hash()` (bcrypt) — same
  standard as the Node version.
- JWTs are signed HS256, hand-rolled without a library (see `lib/jwt.php`)
  specifically to avoid a Composer dependency — tested against tampering,
  expiry, and wrong-secret scenarios.
- All database queries use PDO prepared statements — no raw string
  interpolation into SQL anywhere.
- CORS is restricted to the origins listed in `FRONTEND_ORIGINS` (comma-separated).
- Admin and clinic tokens carry a `type` claim and are checked accordingly
  — a clinic login cannot be used on an admin endpoint, and vice versa
  (verified in testing).

## A Note on Keeping This in Sync

If you also keep the Node.js backend (`../backend/`) around — for example
to run locally during development, or if you later move to Node-friendly
hosting — be aware these are two independent implementations against
compatible schemas, not one codebase with two adapters. A change to
business logic (e.g. a new validation rule) needs to be made in both
places if you want to keep them behaviorally identical.

## Facebook/Instagram Feed

`GET /social-feed/list.php` (public) returns cached posts from both
platforms, powering the Social page and Home page media section. Works
gracefully with zero configuration — shows empty results, no errors,
until you connect real credentials.

**One-time setup** (in your Meta Developer dashboard — see the full
walkthrough in `lib/socialFeed.php`):
1. Instagram account must be Business/Creator, linked to a Facebook Page
2. Create a Meta Developer App, add the Instagram Graph API product
3. Generate a long-lived Page Access Token (~60 days, needs periodic renewal)
4. Set `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN`,
   `INSTAGRAM_BUSINESS_ACCOUNT_ID` in `.env`

**Test your credentials** once set:
```bash
php scripts/refresh-social-feed.php
```
Prints a clear success/error message per platform — the fastest way to
confirm your token and IDs are correct before checking the live site.

Posts are cached for 60 minutes (`lib/socialFeedCache.php`) — if a Graph
API call ever fails (expired token, rate limit), the *previous* cached
posts stay showing rather than the page going blank; only the error gets
logged for admin visibility.

## Hero Media Carousel (Home Page)

`GET /media-hero/list.php` (public) powers the rotating photo/video
banner in the homepage hero, which replaced the impact-stats cards there.

**No admin UI, no upload form — just a folder.** Create
`public_html/media/hero/` once via File Manager (a sibling to `public_html/api/`,
**not** inside it — this is deliberate, so neither an `api/` redeploy nor
a frontend rebuild can ever touch or wipe out uploaded media). From then
on, dropping image/video files directly into that folder is the entire
publishing workflow — no code change, no redeploy, nothing to run.

- Supported: `.jpg .jpeg .png .webp .gif` (images), `.mp4 .webm .mov` (video)
- **Ordering:** alphabetical by filename — prefix with numbers to control
  rotation order, e.g. `01-camp-photo.jpg`, `02-therapy-video.mp4`,
  `03-team-photo.jpg`
- Empty or missing folder degrades gracefully (a friendly placeholder
  message, not an error) — verified in testing
