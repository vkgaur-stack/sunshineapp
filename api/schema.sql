-- Sunshine Social Foundation — MySQL Schema
-- Mirrors backend/prisma/schema.prisma field-for-field so the two
-- implementations (Node/Prisma and this PHP version) stay interchangeable
-- against the same database if ever needed.
--
-- Import via cPanel's phpMyAdmin, or:
--   mysql -u your_user -p your_database < schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Beneficiaries
-- ============================================================
CREATE TABLE IF NOT EXISTS beneficiaries (
  id                CHAR(36)     NOT NULL PRIMARY KEY,
  full_name         VARCHAR(191) NOT NULL,
  date_of_birth     DATE         NOT NULL,
  gender            VARCHAR(50)  NOT NULL,
  mobile_number     VARCHAR(20)  NOT NULL UNIQUE,
  email             VARCHAR(191) NULL,
  address_line      VARCHAR(255) NULL,
  city              VARCHAR(100) NOT NULL,
  state             VARCHAR(100) NOT NULL,
  service_interest  VARCHAR(191) NULL,
  problem_notes     TEXT         NULL,
  preferred_contact  ENUM('PHONE','WHATSAPP','EMAIL') NOT NULL DEFAULT 'WHATSAPP',
  consent_given     TINYINT(1)   NOT NULL DEFAULT 0,
  consent_at        DATETIME     NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_beneficiary_mobile (mobile_number),
  INDEX idx_beneficiary_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Services
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  name         VARCHAR(191) NOT NULL,
  description  TEXT         NOT NULL,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Camps
-- ============================================================
CREATE TABLE IF NOT EXISTS camps (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  title          VARCHAR(191) NOT NULL,
  city           VARCHAR(100) NOT NULL,
  locality       VARCHAR(191) NULL,
  venue_details  TEXT         NULL,
  start_at       DATETIME     NOT NULL,
  end_at         DATETIME     NOT NULL,
  capacity       INT          NULL,
  is_published   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  beneficiary_id  CHAR(36)     NOT NULL,
  service_id      CHAR(36)     NOT NULL,
  camp_id         CHAR(36)     NULL,
  preferred_date  DATE         NOT NULL,
  time_slot       VARCHAR(100) NOT NULL,
  notes           TEXT         NULL,
  status          ENUM('REQUESTED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW')
                   NOT NULL DEFAULT 'REQUESTED',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
  CONSTRAINT fk_appt_service FOREIGN KEY (service_id) REFERENCES services(id),
  CONSTRAINT fk_appt_camp FOREIGN KEY (camp_id) REFERENCES camps(id),
  INDEX idx_appt_beneficiary (beneficiary_id),
  INDEX idx_appt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Donors & Donations
-- ============================================================
CREATE TABLE IF NOT EXISTS donors (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  full_name      VARCHAR(191) NOT NULL,
  mobile_number  VARCHAR(20)  NOT NULL,
  email          VARCHAR(191) NULL,
  pan_number     VARCHAR(20)  NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS donations (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  donor_id              CHAR(36)     NOT NULL,
  amount_in_paise       INT          NOT NULL,
  purpose               VARCHAR(191) NOT NULL DEFAULT 'General Fund',
  status                ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  razorpay_order_id     VARCHAR(191) NULL UNIQUE,
  razorpay_payment_id   VARCHAR(191) NULL,
  receipt_number        VARCHAR(50)  NULL UNIQUE,
  receipt_sent_at       DATETIME     NULL,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_donation_donor FOREIGN KEY (donor_id) REFERENCES donors(id),
  INDEX idx_donation_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Admin Users
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  full_name      VARCHAR(191) NOT NULL,
  email          VARCHAR(191) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('SUPER_ADMIN','CAMP_COORDINATOR','FINANCE') NOT NULL DEFAULT 'CAMP_COORDINATOR',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Get Involved / Contact
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_requests (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  category       VARCHAR(50)  NOT NULL, -- CSR_PARTNER | MEDICAL_PARTNER | VOLUNTEER | DONOR | COMMUNITY_PARTNER
  org_or_name    VARCHAR(191) NOT NULL,
  contact_name   VARCHAR(191) NOT NULL,
  mobile_number  VARCHAR(20)  NOT NULL,
  email          VARCHAR(191) NULL,
  message        TEXT         NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'NEW', -- NEW | CONTACTED | CLOSED
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  full_name      VARCHAR(191) NOT NULL,
  mobile_number  VARCHAR(20)  NOT NULL,
  email          VARCHAR(191) NULL,
  subject        VARCHAR(191) NULL,
  message        TEXT         NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'NEW',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Partner Clinics
-- ============================================================
CREATE TABLE IF NOT EXISTS clinics (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  name            VARCHAR(191) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  address         TEXT         NULL,
  contact_person  VARCHAR(191) NULL,
  mobile_number   VARCHAR(20)  NULL,
  email           VARCHAR(191) NULL,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clinic_users (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  clinic_id      CHAR(36)     NOT NULL,
  full_name      VARCHAR(191) NOT NULL,
  email          VARCHAR(191) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinicuser_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Coupons (subsidy engine)
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id                 CHAR(36)     NOT NULL PRIMARY KEY,
  code               VARCHAR(50)  NOT NULL UNIQUE,
  donation_id        CHAR(36)     NULL,
  beneficiary_id     CHAR(36)     NULL,
  service_id         CHAR(36)     NOT NULL,
  appointment_id     CHAR(36)     NULL UNIQUE,
  subsidy_percent    INT          NOT NULL DEFAULT 75,
  value_in_paise     INT          NULL,
  status             ENUM('ISSUED','ASSIGNED','REDEEMED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'ISSUED',
  issued_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at         DATETIME     NOT NULL,
  redeemed_at        DATETIME     NULL,
  redeemed_clinic_id CHAR(36)     NULL,
  redeemed_by_user_id CHAR(36)    NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_coupon_donation FOREIGN KEY (donation_id) REFERENCES donations(id),
  CONSTRAINT fk_coupon_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
  CONSTRAINT fk_coupon_service FOREIGN KEY (service_id) REFERENCES services(id),
  CONSTRAINT fk_coupon_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  CONSTRAINT fk_coupon_clinic FOREIGN KEY (redeemed_clinic_id) REFERENCES clinics(id),
  INDEX idx_coupon_status (status),
  INDEX idx_coupon_beneficiary (beneficiary_id),
  INDEX idx_coupon_donation (donation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Notifications (Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id                 CHAR(36)     NOT NULL PRIMARY KEY,
  channel            ENUM('WHATSAPP','SMS','EMAIL') NOT NULL,
  to_address         VARCHAR(191) NOT NULL,
  template_type      VARCHAR(100) NOT NULL,
  related_type       VARCHAR(50)  NULL,
  related_id         CHAR(36)     NULL,
  status             ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
  provider_response  TEXT         NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at            DATETIME     NULL,
  INDEX idx_notif_status (status),
  INDEX idx_notif_channel (channel),
  INDEX idx_notif_related (related_type, related_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Org Settings (Phase 4, singleton row) & API Keys
-- ============================================================
CREATE TABLE IF NOT EXISTS org_settings (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  organization_name     VARCHAR(191) NOT NULL DEFAULT 'Sunshine Social Foundation',
  registration_number   VARCHAR(100) NULL,
  ngo_darpan_id         VARCHAR(100) NULL,
  pan_number            VARCHAR(20)  NULL,
  tan_number            VARCHAR(20)  NULL,
  eighty_g_number       VARCHAR(100) NULL,
  registered_address    TEXT         NULL,
  office_address        TEXT         NULL,
  office_hours          VARCHAR(191) NULL,
  phone                 VARCHAR(20)  NULL,
  whatsapp_number       VARCHAR(20)  NULL,
  email                 VARCHAR(191) NULL,
  bank_account_name     VARCHAR(191) NULL,
  bank_account_number   VARCHAR(50)  NULL,
  bank_ifsc             VARCHAR(20)  NULL,
  bank_name             VARCHAR(191) NULL,
  upi_id                VARCHAR(100) NULL,
  facebook_url          VARCHAR(255) NULL,
  instagram_url         VARCHAR(255) NULL,
  youtube_url           VARCHAR(255) NULL,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_keys (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  label         VARCHAR(191) NOT NULL,
  key_prefix    VARCHAR(20)  NOT NULL,
  key_hash      VARCHAR(64)  NOT NULL UNIQUE,
  scopes        VARCHAR(255) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at  DATETIME     NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Social Feed Cache (Facebook/Instagram) — Phase: Social Integration
-- ============================================================
CREATE TABLE IF NOT EXISTS social_feed_cache (
  platform    VARCHAR(20)  NOT NULL PRIMARY KEY, -- 'FACEBOOK' or 'INSTAGRAM'
  payload     TEXT         NOT NULL,             -- JSON array of normalized posts
  fetched_at  DATETIME     NOT NULL,
  error       TEXT         NULL                  -- last fetch error, if any (for admin visibility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
