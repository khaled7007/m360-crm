-- Remove viewer users (cannot remove enum value in PostgreSQL, so only remove users)
DELETE FROM users WHERE email IN (
  'naloufi@tharaco.sa', 'ralhammadi@tharaco.sa', 'aalammar@tharaco.sa',
  'ali@tharaco.sa', 'aalghamdi@tharaco.sa', 'achahtout@tharaco.sa',
  'ealnahidh@tharaco.sa', 'halothman@tharaco.sa', 'halbaz@tharaco.sa',
  'm.aldaij@tharaco.sa', 'ralahmari@tharaco.sa', 'walabdulkarim@tharaco.sa'
);
