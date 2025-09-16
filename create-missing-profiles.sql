-- Create only missing profile records
-- This will skip profiles that already exist

-- Check what profiles already exist
SELECT '=== EXISTING PROFILES ===' as info;
SELECT p.id, p.email, p.role, t.slug as tenant_slug 
FROM profiles p 
JOIN tenants t ON p.tenant_id = t.id 
ORDER BY p.email;

-- Create missing profiles (using ON CONFLICT to skip existing ones)
INSERT INTO profiles (id, email, role, tenant_id) VALUES
-- Acme users
('006f2b9a-65c6-447f-9eb8-82b3dbdf1e95', 'admin@acme.test', 'admin', (SELECT id FROM tenants WHERE slug = 'acme')),
('386fee50-2ef8-4c1c-9462-caffaa0a4fe3', 'user@acme.test', 'member', (SELECT id FROM tenants WHERE slug = 'acme')),

-- Globex users
('51a45cce-a1f6-4d42-b128-6de9073e84bc', 'admin@globex.test', 'admin', (SELECT id FROM tenants WHERE slug = 'globex')),
('6ae117dd-75c3-4bb9-a399-3fec47a33ffa', 'user@globex.test', 'member', (SELECT id FROM tenants WHERE slug = 'globex'))

ON CONFLICT (id) DO NOTHING;

-- Verify all profiles now exist
SELECT '=== ALL PROFILES AFTER INSERT ===' as info;
SELECT p.id, p.email, p.role, t.slug as tenant_slug 
FROM profiles p 
JOIN tenants t ON p.tenant_id = t.id 
ORDER BY p.email;
