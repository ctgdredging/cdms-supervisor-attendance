# Project Rules & Instructions

## 1. Automatic GitHub Sync Policy
- Whenever any feature, fix, or update is made in the codebase, stage all changes and create a git commit (`git add . && git commit -m "<descriptive message>"`).
- If GitHub credentials / Personal Access Token are configured in the environment or git remote, immediately run `git push origin main` so GitHub Actions automatically deploys the latest version to GitHub Pages (`https://ctgdredging.github.io/cdms-supervisor-attendance/`).

## 2. Business Rules (Chittagong Dredger Owners Association)
- Shift rotation and Monday 24h double-duty schedule calculations must be strictly adhered to.
- Salary deductions: 666.67 BDT per absent day, 1 free casual leave per month, and 2-day deduction for absence on Monday 24h duty.
- Office approval workflow: attendance submissions from supervisors require office PIN/password approval before integrating into the official monthly salary sheet.
