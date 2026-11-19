-- ITR12 field for categories that span several SARS fields.
-- Professional Fees → Accounting Fees / Legal Costs / Consulting Fees Paid
-- Home Office      → Rental Paid / Electricity / Rates and Taxes /
--                    Repairs / Maintenance / Other (cleaning)
-- Null means the category's default field (lib/itr12Summary.ts).
alter table public.expenses add column if not exists sars_field text;

alter table public.expenses drop constraint if exists expenses_sars_field_check;
alter table public.expenses add constraint expenses_sars_field_check check (
  sars_field is null or sars_field in (
    'Accounting Fees', 'Legal Costs', 'Consulting Fees Paid',
    'Rental Paid', 'Electricity / Rates and Taxes', 'Repairs / Maintenance', 'Other'
  )
);
