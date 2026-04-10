-- Add business_name and phone columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS phone text;
