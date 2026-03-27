-- ─── Migration 000006: Add new roles + seed real users ───────────────────────

-- 1. Add new roles to the enum (safe: only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'credit_manager'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'credit_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'credit_officer'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'credit_officer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'operations_manager'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'operations_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'operations_officer'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'operations_officer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sales_manager'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'sales_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sales_officer'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'sales_officer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'care_manager'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'care_manager';
  END IF;
END$$;

-- 2. Seed real users (ON CONFLICT DO NOTHING = safe to re-run)
-- Password hash = bcrypt of 'Thara@2026' with cost 12
INSERT INTO users (email, password_hash, name_en, name_ar, role, is_active)
VALUES
  (
    'ceo@tharaco.sa',
    crypt('Thara@2026', gen_salt('bf', 12)),
    'CEO',
    'الرئيس التنفيذي',
    'super_admin',
    true
  ),
  (
    'Kalghamdi@tharaco.sa',
    crypt('Thara@2026', gen_salt('bf', 12)),
    'K. Al-Ghamdi',
    'الغامدي',
    'super_admin',
    true
  ),
  (
    'aanazi@tharaco.sa',
    crypt('Thara@2026', gen_salt('bf', 12)),
    'Abdulmajeed Al-Anazi',
    'عبدالمجيد العنزي',
    'credit_manager',
    true
  ),
  (
    'falshalwi@tharaco.sa',
    crypt('Thara@2026', gen_salt('bf', 12)),
    'Faisal Al-Shalawi',
    'فيصل الشلوي',
    'credit_officer',
    true
  ),
  (
    'malshussaini@tharaco.sa',
    crypt('Thara@2026', gen_salt('bf', 12)),
    'Mashaael',
    'مشاعل',
    'operations_manager',
    true
  ),
  (
    'malenezi@tharaco.sa',
    crypt('Thara@2026', gen_salt('bf', 12)),
    'Mansour Al-Enezi',
    'منصور العنزي',
    'sales_manager',
    true
  ),
  (
    'ralbidah@tharaco.sa',
    crypt('Thara@2026', gen_salt('bf', 12)),
    'Ruba Al-Bidah',
    'ربى',
    'care_manager',
    true
  )
ON CONFLICT (email) DO NOTHING;
