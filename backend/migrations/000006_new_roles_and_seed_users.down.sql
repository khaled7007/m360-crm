-- ─── Rollback 000006 ─────────────────────────────────────────────────────────
-- Remove seeded users (by email)
DELETE FROM users WHERE email IN (
  'ceo@tharaco.sa',
  'Kalghamdi@tharaco.sa',
  'aanazi@tharaco.sa',
  'falshalwi@tharaco.sa',
  'malshussaini@tharaco.sa',
  'malenezi@tharaco.sa',
  'ralbidah@tharaco.sa'
);

-- Note: PostgreSQL does not support removing enum values.
-- The new roles (super_admin, credit_manager, etc.) remain in the enum.
-- To remove them you must recreate the type, which requires a full schema migration.
