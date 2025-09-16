-- Diagnostic script to check database setup
-- Run this in Supabase SQL Editor

-- Check if all tables exist
SELECT 'Tables Check:' as test;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('tenants', 'profiles', 'notes')
ORDER BY table_schema, table_name;

-- Check tenants data
SELECT 'Tenants Data:' as test;
SELECT id, slug, name, plan FROM tenants;

-- Check if RLS is enabled
SELECT 'RLS Status:' as test;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('tenants', 'profiles', 'notes');

-- Check current profiles (this might be empty)
SELECT 'Current Profiles:' as test;
SELECT id, email, role, tenant_id FROM profiles;

-- Check auth users
SELECT 'Auth Users:' as test;
SELECT id, email FROM auth.users;

-- Check if foreign key relationships exist
SELECT 'Foreign Keys:' as test;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('profiles', 'notes');
