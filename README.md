# Sunshine Social Foundation — Web Portal (Phase 1)

A production-grade, API-first web portal for Sunshine Social Foundation:
beneficiary registration, appointment booking, donations (Razorpay), camp
listings, partner/volunteer requests, contact, and an admin dashboard.

This is **Phase 1** of the phased delivery plan — the foundation everything
else (WhatsApp automation, coupon engine, CSR reporting, etc.) plugs into.

---

## 1. Architecture

```
frontend/   Next.js 14 (App Router) + Tailwind — public site + admin UI
backend/    Node.js + Express + Prisma + PostgreSQL — REST API
```

The frontend never talks to the database directly — everything goes through
the backend's REST API (`/api/...`). This is what makes future integrations
(mobile app, WhatsApp bot, partner clinic portal, CRM) possible without
touching the frontend.

---

## 2. Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local install, or a managed instance — Railway/Neon/RDS all work)
- A Razorpay account (test mode is fine to start) — https://dashboard.razorpay.com

---

## 3. Local Setup

### 3.1 Backend

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET, RAZORPAY_KEY_ID/SECRET

npm install
npx prisma migrate dev --name init   # creates tables in your Postgres DB
npm run prisma:seed                  # creates admin login + sample services/camp

npm run dev                          # starts API on http://localhost:4000
```

Your seeded admin login uses `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from
`.env` — set these before seeding, and change the password after first login.

### 3.2 Frontend

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local: set NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_RAZORPAY_KEY_ID

npm install
npm run dev                          # starts site on http://localhost:3000
```

Visit `http://localhost:3000`. Admin panel: `http://localhost:3000/admin`.

---

## 4. Replacing Placeholder Content

Search the codebase for `[ ` (open bracket + space) to find every marked
placeholder — office address, phone number, UPI ID, bank details, social
media links, registration number. Key locations:

| Content | File |
|---|---|
| Footer contact details | `frontend/src/components/Footer.jsx` |
| Office address/phone/hours | `frontend/src/app/contact/page.jsx` |
| UPI / bank / cheque details | `frontend/src/app/donate/page.jsx` |
| Social media links | `frontend/src/app/social/page.jsx` |
| Registration number | `frontend/src/app/about/page.jsx` |
| Impact metrics | `frontend/src/app/impact/page.jsx` (Phase 2 wires these to live data) |
| Services offered | Managed via the database — edit `backend/prisma/seed.js` or use the admin API |

**Logo:** already placed at `frontend/public/logo.png` and wired into
`Header.jsx` via `next/image`, unmodified from the file you provided. If you
get a newer/final logo file later, just replace `frontend/public/logo.png`
with the new file of the same name — no code changes needed.

---

## 5. Deployment

This is deliberately a **two-service** deployment (frontend + backend),
which is the standard, low-maintenance way to run this stack in production:

- **Backend:** any Node host — Railway, Render, a basic VPS with PM2, or a
  Docker container. Needs `DATABASE_URL` pointed at a real Postgres instance.
- **Frontend:** Vercel (built for Next.js) or the same VPS via `npm run build && npm run start`.
- **Database:** managed Postgres (Railway, Neon, Supabase, or AWS RDS) —
  avoid self-hosting Postgres unless you already run infrastructure.

Set `FRONTEND_ORIGIN` (backend) and `NEXT_PUBLIC_API_BASE_URL` (frontend) to
your real production URLs before going live.

**Before going live, also:**
1. Change `JWT_SECRET` to a long random string (never reuse the example).
2. Change the seeded admin password immediately after first login.
3. Switch Razorpay from test keys to live keys.
4. Confirm `NODE_ENV=production` on the backend (tightens error messages).

---

## 6. API Reference

See [`docs/API.md`](./docs/API.md) for the full endpoint list — this is the
contract any future integration (mobile app, WhatsApp bot, CRM) builds against.

---

## 7. What's in Phase 2 (this build)

- **Coupon/subsidy engine** — admin generates coupon batches (optionally
  tied to a specific donation), each with a unique code, QR image, subsidy
  %, value, and expiry. Coupons can be assigned to a beneficiary.
- **Partner clinic portal** — a separate login track at `/clinic` (not part
  of the admin panel) where clinic staff validate a coupon code and mark
  it redeemed once the service is delivered. Each clinic only sees its own
  redemption history.
- **Live impact dashboard** — `/impact` and the homepage hero now pull
  real, auto-calculated numbers (`GET /api/impact`) instead of hardcoded text.
- **80G auto-receipts** — successful donations get a sequential receipt
  number and an emailed receipt automatically (falls back to a console log
  if SMTP isn't configured yet — see `backend/.env.example`).
- **Role-based access tightened** — donation records restricted to
  `SUPER_ADMIN`/`FINANCE`, appointment status changes to
  `SUPER_ADMIN`/`CAMP_COORDINATOR`, coupon issuance to `SUPER_ADMIN`/`FINANCE`.

### Setting up Phase 2 locally
1. Re-run `npx prisma migrate dev --name phase2_coupons_clinics` in `backend/`
   after pulling this update — the schema has new models (`Clinic`,
   `ClinicUser`, `Coupon`) and new fields on `Donation`/`Appointment`.
2. Re-run `npm run prisma:seed` to get a demo clinic + clinic login
   (`SEED_CLINIC_EMAIL` / `SEED_CLINIC_PASSWORD` in `.env`) and 3 sample coupons.
3. Visit `/admin/dashboard` → **Coupons** tab to generate more, or
   **Clinics** tab to onboard a real partner clinic and create its login.
4. Visit `/clinic` to try the clinic-side validate/redeem flow.
5. (Optional) Fill in `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` in `backend/.env`
   to actually send 80G receipt emails instead of console-logging them.

## 8. What's in Phase 3 (this build)

- **WhatsApp/SMS notification engine** (`backend/src/notifications/`) — a
  provider-agnostic adapter layer for WhatsApp Business API (Interakt/
  Gupshup/AiSensy-style) and SMS (MSG91/Twilio-style), with every attempt
  logged to `NotificationLog` for a real audit trail. Without provider
  credentials configured, it safely falls back to console-logging — the
  whole app still works end-to-end for local dev/demo.
- **Automatic triggers wired in**: appointment requested/confirmed,
  donation thank-you, coupon issued — all fire a notification via the
  beneficiary/donor's preferred contact channel automatically.
- **Camp announcements** — admins can trigger a one-click WhatsApp/SMS
  broadcast to every registered beneficiary in a camp's city, from the new
  **Camps tab** in the admin dashboard.
- **Basic WhatsApp chatbot menu** — `POST /api/webhooks/whatsapp` handles
  inbound messages with simple keyword logic (BOOK / STATUS / HELP), no
  NLP, matching the plan. See the code comment in
  `backend/src/controllers/webhook.controller.js` for how to adapt the
  payload shape to your specific BSP's webhook format.
- **Notifications tab** in the admin dashboard — a searchable/filterable
  log of every notification attempt, so staff can verify beneficiaries are
  actually being reached.

### Setting up Phase 3 locally
1. Re-run `npx prisma migrate dev --name phase3_notifications` in `backend/`
   — adds the `NotificationLog` table.
2. To actually send WhatsApp/SMS (rather than console-log), sign up with a
   WhatsApp BSP (Interakt, Gupshup, or AiSensy are common in India) and an
   SMS gateway (MSG91, Twilio), get your API credentials, and fill in
   `WHATSAPP_API_URL`/`WHATSAPP_API_KEY`/`WHATSAPP_FROM_NUMBER` and
   `SMS_API_URL`/`SMS_API_KEY` in `backend/.env`.
3. **Before going live with WhatsApp**, register and get Meta approval for
   template messages matching the templates in
   `backend/src/notifications/templates.js` — WhatsApp Business API
   requires pre-approved templates for messages sent outside a 24-hour
   customer service window.
4. Point your BSP's inbound webhook at `POST /api/webhooks/whatsapp` (after
   adding a small payload-mapping shim for your specific BSP — see the
   comment in `webhook.controller.js`).

## 10. What's in Phase 4 (this build)

- **Database switched from PostgreSQL to MySQL** — matching typical shared
  cPanel hosting (see section 12 below). If you later host the backend
  somewhere PostgreSQL-friendly instead, switch `provider` back to
  `"postgresql"` in `schema.prisma` (see the comment at the top of that
  file for the one other thing to revert).
- **Centralized organization settings** — a single **Settings** tab in
  admin now controls registration numbers, bank/UPI details, office
  contact info, and social links. The Footer, About, Contact, and Donate
  pages all pull from this instead of hardcoded placeholder text.
- **Accounting & CSR exports** — a new **Reports** tab in admin generates:
  - A plain donations CSV (importable into Tally, Zoho Books, or Excel)
  - A simplified Tally-importable voucher XML
  - A CSR-partner-ready Excel workbook (impact summary + donation and
    coupon-redemption detail sheets)
- **API keys for external integrations** — also in the Settings tab.
  Generate a scoped, revocable key (e.g. `donations:read`) for an
  accounting system or a CSR partner's own dashboard to pull data via
  `GET /api/external/donations` with an `X-API-Key` header — no admin
  login needed for that integration.
- **Security hardening**:
  - `trust proxy` set (needed correctness for rate limiting and IP
    logging behind cPanel/Passenger or any reverse proxy)
  - CORS now supports a comma-separated list of allowed origins
  - Login endpoints (`/admin/login`, `/clinic/login`) have a stricter,
    separate rate limit against brute-forcing
- **Backup script** — `backend/scripts/backup-mysql.sh`, a cron-ready
  `mysqldump` wrapper with automatic old-backup cleanup.

### Setting up Phase 4 locally
1. Update `DATABASE_URL` in `backend/.env` to a MySQL connection string
   (see the updated `.env.example`), then run
   `npx prisma migrate dev --name phase4_mysql_settings_apikeys`.
   **Note:** since the database provider changed, if you have existing
   Postgres data you care about, export it first — this isn't an
   in-place data migration, it's a fresh schema on a new database engine.
2. Visit `/admin/dashboard` → **Settings** tab and fill in your real
   registration number, bank/UPI details, and contact info — this
   immediately updates the public site.
3. Try the **Reports** tab to download a sample CSV/XML/Excel export.
4. Generate a test API key in **Settings**, then try:
   ```bash
   curl -H "X-API-Key: <your key>" http://localhost:4000/api/external/donations
   ```

## 11. What's Still Deferred

- Automated payout tracking to clinics for reimbursed coupons
- PDF receipt attachments (current receipts are HTML email only)
- Scheduled appointment reminders (needs a cron/scheduled job — the
  `APPOINTMENT_REMINDER` template already exists and is ready to use)
- Geo-radius camp targeting (current announcements match by exact city
  string, not distance)
- A real NGO Darpan API sync (no public API exists for this today — the
  Settings tab keeps the numbers in one place, but filing/verification on
  NGO Darpan itself remains a manual government-portal process)

## 12. Deploying to Shared cPanel Hosting

This app can run on shared cPanel hosting **if your host's cPanel includes
a "Setup Node.js App" tool** (Passenger/CloudLinux Node.js Selector) —
common even on basic shared plans from many providers. Check under
**Software** in cPanel.

**If it's there:**
1. Create a MySQL database and user via cPanel's "MySQL Databases" tool.
2. Upload the `backend/` folder, set `DATABASE_URL` to your cPanel MySQL
   credentials, and point cPanel's Node.js App tool at `src/server.js`.
3. Build the frontend **locally** (`npm run build` inside `frontend/`) —
   shared hosting CPU/RAM limits often can't handle a production build —
   then upload the built output and run it via the same Node.js App tool,
   or export it as static where possible.
4. Watch for outbound-network restrictions during `npm install`: Prisma
   needs to download its query engine binary once. If your host blocks
   this, the engine can be downloaded on an unrestricted machine and
   uploaded alongside the app — ask if this comes up.

**If it's not there:** the practical path is hosting the Node.js parts
(backend + frontend) on a Node-friendly host (Railway, Render, or a small
VPS all work well and are inexpensive), while still using your existing
cPanel MySQL database if it's reachable from outside, or a managed MySQL
instance otherwise.
