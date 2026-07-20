-- Bring two auth.users triggers into version control. Both already exist in
-- production (created directly via the SQL editor at some earlier point,
-- never migrated) — this migration is a no-op against the live database,
-- it just gives them a tracked source of truth going forward. Confirmed via
-- `pg_get_functiondef` / `pg_get_triggerdef` against production on 2026-07-20
-- while diagnosing the "Database error saving new user" signup failure
-- fixed alongside this in 20260720000000_fix_billing_guard_blocks_signup.sql.

-- Creates the public.profiles row for every new auth.users signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grants a hardcoded list of tester emails 14 days of promo access on
-- signup. External/manually provided — not something to "clean up" without
-- confirming with whoever manages tester access. Fires after
-- on_auth_user_created (alphabetical trigger ordering: 'on_auth_user_created'
-- < 'on_tester_signup'), so the profiles row already exists by the time this
-- runs its UPDATE.
CREATE OR REPLACE FUNCTION public.handle_tester_promo_access()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email IN (
    'amielkgatle@gmail.com',
    'annahmotso89@gmail.com',
    'chrispelo78@gmail.com',
    'ian.naidu@gmail.com',
    'jackieseroba@gmail.com',
    'jacobsgail54@gmail.com',
    'mokwane7@gmail.com',
    'mphatelehlahe@gmail.com',
    'putapamla@gmail.com',
    'refilweplantina8@gmail.com'
  ) THEN
    UPDATE public.profiles SET promo_expires_at = now() + interval '14 days' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_tester_signup ON auth.users;
CREATE TRIGGER on_tester_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tester_promo_access();
