-- Medical expenses record their ITR12 medical section source code in
-- sars_field: 4005 (medical aid contributions), 4020 (claimed, not paid back),
-- 4034 (not claimed from a medical aid). See lib/itr12Summary.ts MEDICAL_TYPES.
alter table public.expenses drop constraint if exists expenses_sars_field_check;
alter table public.expenses add constraint expenses_sars_field_check check (
  sars_field is null or sars_field in (
    'Accounting Fees', 'Legal Costs', 'Consulting Fees Paid',
    'Rental Paid', 'Electricity / Rates and Taxes', 'Repairs / Maintenance', 'Other',
    '4005', '4020', '4034'
  )
);
