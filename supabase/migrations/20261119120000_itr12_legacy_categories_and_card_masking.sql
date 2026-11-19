-- ITR12 alignment (19 Nov 2026)
--
-- 1. Old category labels on saved expenses miss the ITR12 field lookup and
--    fall back to "Other" (e.g. "Telephone & Cell" should be "Telephone").
--    Rename them to the canonical labels in constants/categories.ts. The app
--    also maps these names at export time (lib/itr12Summary.ts), so this is
--    for consistency across every screen, not a hard requirement.
-- 2. Bank statement imports copied the full card number into vendor names and
--    it was printed in every export. Keep only the last four digits.
--    Phone numbers (10-11 digits) are untouched.

update public.expenses set category = 'Telephone & Internet'
  where category in ('Telephone & Cell', 'Phone & Internet');

update public.expenses set category = 'Marketing & Advertising'
  where category = 'Advertising & Marketing';

update public.expenses set category = 'Vehicle Expenses'
  where category = 'Fuel & Oil';

update public.expenses set category = 'Travel & Transport'
  where category = 'Travel – Business';

-- Hardware is the usual case; domains and hosting saved here should be moved
-- to Software & Subscriptions by the user.
update public.expenses set category = 'Equipment & Tools'
  where category = 'Computer & IT Equipment';

update public.expenses
  set vendor = regexp_replace(vendor, '(?<![0-9])[0-9]{8,15}([0-9]{4})(?![0-9])', '****\1', 'g')
  where vendor ~ '[0-9]{12,19}';

update public.expenses
  set vendor = regexp_replace(vendor, '(?<![0-9])[0-9]{4}[ -][0-9]{4}[ -][0-9]{4}[ -][0-9]{0,3}([0-9]{4})(?![0-9])', '****\1', 'g')
  where vendor ~ '[0-9]{4}[ -][0-9]{4}[ -][0-9]{4}[ -][0-9]{4}';

update public.income
  set description = regexp_replace(description, '(?<![0-9])[0-9]{8,15}([0-9]{4})(?![0-9])', '****\1', 'g')
  where description ~ '[0-9]{12,19}';
