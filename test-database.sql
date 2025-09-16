-- Test script to check database setup
-- Run this in Supabase SQL Editor

-- Check if tenants exist
SELECT 'Tenants:' as test_name, COUNT(*) as count FROM tenants;

-- Check if profiles table exists
SELECT 'Profiles table exists:' as test_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
            THEN 'YES' ELSE 'NO' END as result;

-- Check if auth.users table exists
SELECT 'Auth users table exists:' as test_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
            THEN 'YES' ELSE 'NO' END as result;

-- Check current users in auth.users
SELECT 'Current auth users:' as test_name, COUNT(*) as count FROM auth.users;

-- Check current profiles
SELECT 'Current profiles:' as test_name, COUNT(*) as count FROM profiles;

-- Show tenant details
SELECT 'Tenant details:' as test_name, slug, name, plan FROM tenants;
