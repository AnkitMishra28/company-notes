-- Fix user creation trigger for Supabase
-- Run this in your Supabase SQL Editor

-- First, let's check if the function exists and drop it if it does
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tenant_record RECORD;
BEGIN
  -- For demo purposes, assign users to tenants based on email domain
  IF NEW.email LIKE '%@acme.test' THEN
    SELECT * INTO tenant_record FROM tenants WHERE slug = 'acme';
  ELSIF NEW.email LIKE '%@globex.test' THEN
    SELECT * INTO tenant_record FROM tenants WHERE slug = 'globex';
  ELSE
    -- Default to Acme for any other emails
    SELECT * INTO tenant_record FROM tenants WHERE slug = 'acme';
  END IF;

  -- Determine role based on email
  INSERT INTO public.profiles (id, email, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email LIKE 'admin@%' THEN 'admin'
      ELSE 'member'
    END,
    tenant_record.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and continue
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Let's also check if our tenants exist
SELECT * FROM tenants;

-- Check if profiles table exists and is accessible
SELECT COUNT(*) as profile_count FROM profiles;
