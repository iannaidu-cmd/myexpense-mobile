-- Fix tax_year on all existing expense rows.
-- Prior builds hardcoded ACTIVE_TAX_YEAR = "2024/25", so every record created
-- before build #14 has the wrong tax_year regardless of its actual date.
-- SA tax year: 1 March of year N → last day of February of year N+1.

UPDATE expenses
SET tax_year = CASE
  WHEN expense_date >= '2026-03-01' THEN '2026/27'
  WHEN expense_date >= '2025-03-01' THEN '2025/26'
  WHEN expense_date >= '2024-03-01' THEN '2024/25'
  WHEN expense_date >= '2023-03-01' THEN '2023/24'
  WHEN expense_date >= '2022-03-01' THEN '2022/23'
  WHEN expense_date >= '2021-03-01' THEN '2021/22'
  ELSE tax_year
END
WHERE expense_date IS NOT NULL;
