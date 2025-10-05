👉 **Download (Windows):** https://github.com/bbcclouds/findashboard/releases/latest

# FinDash — Offline Personal Finance Dashboard

**No accounts. No tracking. No subscriptions.**  
FinDash is a local-only Windows app that helps you track **net worth**, **accounts**, **debts**, **credit cards**, **investments**, and **goals**—all stored on your device.

---

## Highlights

- 💳 **Accounts & Transactions** — categories, bulk entry, internal transfers  
- 📈 **Dashboard** — net worth, performance, and asset allocation at a glance  
- 🧮 **Debt & Mortgages** — payoff tracking and amortization views  
- 💳 **Credit Cards** — balances, statements, payment helpers  
- 💼 **Investments** — Stocks, Crypto, Retirement (holdings, growth, allocation)  
- 🗄️ **Backup/Restore & CSV Export** — your data, your files  
- 🔒 **Optional Lock Screen** — basic local password gate (no cloud)  

---

## Screenshots

> More images live in [/assets/screens](assets/screens/).

### Overview
![Main Dashboard](<assets/screens/Main Dashboard.png>)
![Lock Screen](<assets/screens/Lock Screen.png>)

### Accounts & Transactions
![Account Manager](<assets/screens/Account Manager.png>)
![Account Transactions](<assets/screens/Account Transaction Overview.png>)
![Manage Categories](<assets/screens/Manage Spending Categories.png>)
![Transfer Between Accounts](<assets/screens/Transfer Between Accounts.png>)

### Income & Budgeting
![Income Overview](<assets/screens/Income Overview.png>)
![Income Management](<assets/screens/Income Management.png>)
![Income Allocation](<assets/screens/Income Allocation.png>)
![Bulk Expense Entry](<assets/screens/Bulk Expense Entry.png>)

### Debts & Home
![Debts](<assets/screens/Debt Tracker.png>)
![Home Loan Overview](<assets/screens/Home Loan Overview.png>)
![Mortgage Details](<assets/screens/Home - Mortgage Details.png>)
![Home Equity Overview](<assets/screens/Home Equity Overview.png>)

### Cards, Stocks, Retirement, Crypto, Other Assets
![Credit Card Overview](<assets/screens/Credit Card Overview.png>)
![Stocks Overview](<assets/screens/Stocks Overview.png>)
![Retirement Tracking](<assets/screens/Retirment Tracking.png>)
![Crypto](<assets/screens/Crypto.png>)
![Other Assets](<assets/screens/Other Assets.png>)

### Settings
![Settings](<assets/screens/Settings Page.png>)

---

## Install (Windows)

1. Go to **[Releases → Latest](https://github.com/bbcclouds/findashboard/releases/latest)**.  
2. Download `FinDash-Setup-vX.Y.Z.exe` (installer).  
   - New publisher? Windows SmartScreen may appear — click **More info → Run anyway**.  
   - App is fully **offline**; there’s no network activity.

**Verify (optional)**

```powershell
# In the folder where you downloaded the installer:
(Get-FileHash ".\FinDash-Setup-vX.Y.Z.exe" -Algorithm SHA256).Hash
