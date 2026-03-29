-- ─── Migration 000007: Add viewer role + seed 12 viewer users ────────────────

-- 1. Add viewer role to enum (safe: only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'viewer'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'viewer';
  END IF;
END$$;

-- 2. Seed 12 viewer users (ON CONFLICT DO NOTHING = safe to re-run)
INSERT INTO users (email, password_hash, name_en, name_ar, role, is_active)
VALUES
  ('naloufi@tharaco.sa',       crypt('Thara@2026', gen_salt('bf', 12)), 'N. Al-Oufi',        'العوفي',    'viewer', true),
  ('ralhammadi@tharaco.sa',    crypt('Thara@2026', gen_salt('bf', 12)), 'R. Al-Hammadi',     'الحمادي',   'viewer', true),
  ('aalammar@tharaco.sa',      crypt('Thara@2026', gen_salt('bf', 12)), 'A. Al-Ammar',       'العمار',    'viewer', true),
  ('ali@tharaco.sa',           crypt('Thara@2026', gen_salt('bf', 12)), 'Ali',               'علي',       'viewer', true),
  ('aalghamdi@tharaco.sa',     crypt('Thara@2026', gen_salt('bf', 12)), 'A. Al-Ghamdi',      'الغامدي',   'viewer', true),
  ('achahtout@tharaco.sa',     crypt('Thara@2026', gen_salt('bf', 12)), 'A. Chahtout',       'شحتوت',     'viewer', true),
  ('ealnahidh@tharaco.sa',     crypt('Thara@2026', gen_salt('bf', 12)), 'E. Al-Nahidh',      'النهيض',    'viewer', true),
  ('halothman@tharaco.sa',     crypt('Thara@2026', gen_salt('bf', 12)), 'H. Al-Othman',      'العثمان',   'viewer', true),
  ('halbaz@tharaco.sa',        crypt('Thara@2026', gen_salt('bf', 12)), 'H. Al-Baz',         'الباز',     'viewer', true),
  ('m.aldaij@tharaco.sa',      crypt('Thara@2026', gen_salt('bf', 12)), 'M. Al-Daij',        'الدايج',    'viewer', true),
  ('ralahmari@tharaco.sa',     crypt('Thara@2026', gen_salt('bf', 12)), 'R. Al-Ahmari',      'الأحمري',   'viewer', true),
  ('walabdulkarim@tharaco.sa', crypt('Thara@2026', gen_salt('bf', 12)), 'W. Al-Abdulkarim',  'عبدالكريم', 'viewer', true)
ON CONFLICT (email) DO NOTHING;
