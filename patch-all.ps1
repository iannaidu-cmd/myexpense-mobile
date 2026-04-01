$app = "C:\Users\ADMIN\Documents\MyExpense\Mobile App\MyExpense\app"

function Patch-BackHeader {
  param([string]$File, [string]$Title, [string]$Subtitle = "")
  if (-not (Test-Path $File)) { Write-Host "  MISSING FILE: $(Split-Path $File -Leaf)"; return }
  $c = Get-Content $File -Raw -Encoding UTF8
  if ($c -match "MXBackHeader") { Write-Host "  SKIP: $(Split-Path $File -Leaf)"; return }

  $imp = 'import { MXBackHeader } from "@/components/MXBackHeader";'
  if ($c -notmatch [regex]::Escape($imp)) {
    $c = $c -replace '((?:import [^\n]+\n)+)', "`$1$imp`n"
  }

  $sub = if ($Subtitle) { "`n        subtitle=`"$Subtitle`"" } else { "" }
  $jsx = "      <MXBackHeader title=`"$Title`"$sub />"

  $pattern = '(?s)(\s+)<View\s+style=\{\{[^{}]*paddingHorizontal:\s*space\.lg[^{}]*\}\}>.*?</View>'
  if ($c -match $pattern) {
    $c = $c -replace $pattern, "`n$jsx"
    Set-Content $File $c -Encoding UTF8 -NoNewline
    Write-Host "  PATCHED: $(Split-Path $File -Leaf)"
  } else {
    Write-Host "  WARNING (manual): $(Split-Path $File -Leaf)"
  }
}

Write-Host "`n--- Patching screens ---`n"
Patch-BackHeader "$app\add-income.tsx"                "Add Income"
Patch-BackHeader "$app\income-history.tsx"             "Income History"
Patch-BackHeader "$app\add-expense-manual.tsx"         "Add Expense"
Patch-BackHeader "$app\quick-add-expense.tsx"          "Quick Add"
Patch-BackHeader "$app\expense-detail.tsx"             "Expense Detail"
Patch-BackHeader "$app\edit-expense.tsx"               "Edit Expense"
Patch-BackHeader "$app\expense-history.tsx"            "All Expenses"
Patch-BackHeader "$app\receipt-review.tsx"             "Review Receipt"      "Confirm expense details"
Patch-BackHeader "$app\upload-from-gallery.tsx"        "Upload Receipt"
Patch-BackHeader "$app\scan-receipt-camera.tsx"        "Scan Receipt"
Patch-BackHeader "$app\scan-receipt-processing.tsx"    "Processing Receipt"  "Analysing with Claude AI"
Patch-BackHeader "$app\recent-activity-feed.tsx"       "Recent Activity"
Patch-BackHeader "$app\tax-summary.tsx"                "Tax Summary"         "2024/25 tax year"
Patch-BackHeader "$app\category-breakdown.tsx"         "Category Breakdown"  "ITR12 deduction analysis"
Patch-BackHeader "$app\deductibility-guide.tsx"        "Deductibility Guide" "SARS ITR12 reference"
Patch-BackHeader "$app\vat-summary.tsx"                "VAT Summary"
Patch-BackHeader "$app\itr12-export-setup.tsx"         "ITR12 Export"        "Configure your return"
Patch-BackHeader "$app\itr12-export-preview.tsx"       "Export Preview"      "Review before exporting"
Patch-BackHeader "$app\itr12-pdf-report.tsx"           "ITR12 PDF Report"
Patch-BackHeader "$app\itr12-efiling-guide.tsx"        "eFiling Guide"       "Submit to SARS"
Patch-BackHeader "$app\tax-year-selector.tsx"          "Tax Year"
Patch-BackHeader "$app\reports-dashboard.tsx"          "Reports"
Patch-BackHeader "$app\mileage-tracker.tsx"            "Mileage Tracker"     "SARS deemed rate R4.84/km"
Patch-BackHeader "$app\mileage-history.tsx"            "Mileage History"
Patch-BackHeader "$app\mileage-trip-summary.tsx"       "Trip Summary"
Patch-BackHeader "$app\bank-accounts.tsx"              "Bank Accounts"       "Manage your banking details"
Patch-BackHeader "$app\paywall-upgrade.tsx"            "Upgrade to Premium"
Patch-BackHeader "$app\settings-screens.tsx"           "Settings"
Patch-BackHeader "$app\forgot-password.tsx"            "Forgot Password"
Patch-BackHeader "$app\reset-password.tsx"             "Reset Password"
Patch-BackHeader "$app\email-verification.tsx"         "Verify Email"
Patch-BackHeader "$app\terms.tsx"                      "Terms of Service"
Patch-BackHeader "$app\privacy.tsx"                    "Privacy Policy"
Patch-BackHeader "$app\filter-sort.tsx"                "Filter & Sort"
Patch-BackHeader "$app\empty-state-no-expenses.tsx"    "No Expenses Yet"
Patch-BackHeader "$app\empty-state-no-reports.tsx"     "No Reports Yet"
Patch-BackHeader "$app\success-confirmation.tsx"       "Done"
Patch-BackHeader "$app\delete-confirmation.tsx"        "Confirm Delete"
Write-Host "`n--- Complete. Run: npx expo start --clear ---"
