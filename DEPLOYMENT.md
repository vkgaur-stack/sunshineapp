# Sunshine Social Foundation Portal — Deployment Guide

**Target environment:** Shared cPanel hosting with PHP + MySQL. No Node.js needed on the server.

---

## Structure

```
sunshine-portal/
  frontend/       Next.js source — builds to static HTML/CSS/JS
  api/            PHP backend — plain files, upload and run, no build step
  backend/        Node.js + PostgreSQL version — kept for a future migration, not deployed now
  deploy.sh       One command that builds everything into a single upload-ready folder
  DEPLOYMENT.md   This file
```

Only `frontend/` and `api/` matter for deploying today. `backend/` sits
unused until you're ready to move off shared hosting later.

---

## Quick Deploy (recommended)

From the project root, on your **local machine** (not the server — Node
is only needed here, to build the frontend once):

```bash
./deploy.sh yourdomain.com              # deploying to your domain root
./deploy.sh yourdomain.com New_Portal   # deploying to a subfolder
```

(If `./deploy.sh` says "permission denied" — some zip tools on Windows
strip the executable flag — run `bash deploy.sh yourdomain.com New_Portal` instead.)

This builds the frontend with the right settings baked in and assembles
**one folder** — `deploy_package/` — containing everything: the static
site at the top level, plus `api/` alongside it. Nothing else to combine
by hand.

**Upload the contents of `deploy_package/`** to `public_html/` (domain
root) or `public_html/New_Portal/` (subfolder), preserving the structure
exactly as-is.

Then, three one-time steps on the server:

1. **Database.** In cPanel → MySQL Databases, create a database and user.
   In phpMyAdmin, import `api/schema.sql`.
2. **Config.** In `api/`, copy `.env.example` to `.env` and fill in your
   real database credentials, a random `JWT_SECRET`
   (`php -r "echo bin2hex(random_bytes(32));"`), and your Razorpay keys.
3. **Seed data.** Run `api/scripts/seed.php` once — via SSH if you have
   it, or by briefly visiting a temporary wrapper script in the browser
   (see "No SSH access?" below), then delete that wrapper immediately.

Visit your site. Done.

---

## No SSH access?

Create a file next to `seed.php` — e.g. `api/scripts/run-once.php` — containing:
```php
<?php require __DIR__ . '/seed.php';
```
Visit it once in your browser (`https://yourdomain.com/api/scripts/run-once.php`),
confirm you see "Seed complete.", then **delete that file immediately.**

---

## Prerequisites

- [ ] cPanel with **MySQL Databases** and **phpMyAdmin**
- [ ] PHP 8.0+ selected for your domain (cPanel → MultiPHP Manager)
- [ ] PHP `zip` extension enabled (Select PHP Version → Extensions) — only
      needed for the CSR Excel export; everything else works without it
- [ ] PHP `curl` extension enabled — needed for Razorpay, coupon QR codes,
      and WhatsApp/SMS notifications. Enabled by default on nearly all PHP
      hosting; worth a quick check in the same Extensions screen if any of
      those features error out.
- [ ] Node.js 18+ on your **local machine**, to run `deploy.sh`
- [ ] A Razorpay account for donations: https://dashboard.razorpay.com
- [ ] HTTPS/SSL active on your domain before going live

---

## Third-Party Services

**Razorpay (required for donations):** start in Test Mode. Put your Key
ID/Secret in `api/.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) — the
frontend build already picks up the public key automatically via
`deploy.sh`. Switch to live keys only once you've tested a full donation
end-to-end.

**WhatsApp/SMS (optional):** works out of the box in log-only mode —
nothing breaks without it, notifications just don't actually send. To
enable real sending, fill in `WHATSAPP_API_URL`/`WHATSAPP_API_KEY` (or the
`SMS_*` equivalents) in `.env`. Requires a WhatsApp BSP (Interakt, Gupshup,
AiSensy) and Meta template approval before going live — see comments in
`api/lib/notifications/templates.php`.

**Email receipts:** uses PHP's built-in `mail()`, no SMTP setup needed.
Deliverability depends on your host's mail/DNS configuration.

---

## Testing Checklist

- [ ] Register as a beneficiary, book an appointment
- [ ] Log into `/admin`, confirm the appointment
- [ ] Make a test-mode donation, confirm a receipt number appears
- [ ] Generate a coupon, assign it, then log into `/clinic` and redeem it
- [ ] Create a camp; confirm it shows on the Home page; try Announce
- [ ] In Settings, fill in your real org details; confirm Footer/Contact/
      Donate update
- [ ] Download each report type from the Reports tab
- [ ] **Change the seeded admin and clinic passwords**

---

## Security Checklist

- [ ] `JWT_SECRET` is a real random string
- [ ] Seeded passwords changed
- [ ] `https://yourdomain.com/api/.env` returns 403/404, not file contents
- [ ] `ENVIRONMENT=production` in `.env`
- [ ] `FRONTEND_ORIGINS` in `.env` lists only your real domain
- [ ] Razorpay switched to live keys only when ready for real donations

---

## Backups

`api/scripts/backup-mysql.sh` is a ready `mysqldump` wrapper for cron:
```
0 2 * * * DB_NAME=... DB_USER=... DB_PASSWORD=... /path/to/api/scripts/backup-mysql.sh
```
No cron/SSH access? Use your host's Backup Wizard or Cron Jobs tool in
cPanel instead — some form of regular backup matters once real donation
and beneficiary data exists.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Blank white page | Frontend wasn't built via `deploy.sh` (raw source or a `.next` folder was uploaded instead of a real static build) |
| Blank page specifically under a subfolder | Rebuild with `./deploy.sh yourdomain.com YourSubfolder` — asset paths need the subfolder baked in at build time |
| 500 error on any API endpoint | Check `.env` database credentials; check cPanel → Errors |
| "Class ZipArchive not found" on CSR Excel export | Enable PHP's `zip` extension in Select PHP Version |
| CORS errors in browser console | `FRONTEND_ORIGINS` in `.env` doesn't exactly match your domain (including `https://`, no trailing slash) |
| Coupon QR codes don't load | Host may block outbound HTTPS from PHP — `api/coupons/qr.php` proxies an external QR service |
| No receipt email after donation | Host mail/DNS configuration — not a code issue |
| "Too many login attempts" while testing | Built-in rate limiting (10/15 min per IP) — working as intended |

---

## What's Deliberately Out of Scope

- Automated clinic payout tracking for reimbursed coupons
- PDF receipt attachments (current receipts are HTML email only)
- Scheduled/automatic appointment reminders (template exists in
  `templates.php`; firing it needs a cron job calling a small new script)
- A real NGO Darpan API sync (no public API exists; Settings keeps your
  numbers in one place, but filing itself is a manual government process)
