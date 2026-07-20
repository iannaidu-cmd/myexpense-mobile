-- Add terms acceptance tracking to profiles.
-- terms_accepted_at is NULL for users who have not yet accepted;
-- set to the acceptance timestamp once they confirm.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz DEFAULT NULL;
