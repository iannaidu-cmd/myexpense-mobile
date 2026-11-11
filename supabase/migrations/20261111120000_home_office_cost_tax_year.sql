-- Ties the annual rent / bond interest on the Home office setup screen to a
-- tax year, so it can be added to that year's Home Office claim (and only
-- that year's). Existing rows stay null and claim nothing until the user
-- saves their setup again; the setup screen asks them to.

alter table public.home_office_settings
  add column if not exists cost_tax_year text null;
