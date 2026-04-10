-- Add push_token column to profiles for Expo push notification delivery
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token text;
