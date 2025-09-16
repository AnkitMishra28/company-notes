-- Get the IDs you need for creating the profile
-- Run this in Supabase SQL Editor

-- Get tenant IDs
SELECT 'Tenant IDs:' as info;
SELECT id, slug, name FROM tenants;

-- Get user ID from auth.users (replace with your actual email)
SELECT 'User ID for admin@acme.test:' as info;
SELECT id, email FROM auth.users WHERE email = 'admin@acme.test';

-- If the user doesn't exist, check what users you have
SELECT 'All auth users:' as info;
SELECT id, email FROM auth.users;
