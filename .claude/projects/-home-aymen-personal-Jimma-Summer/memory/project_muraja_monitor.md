---
name: project-muraja-monitor
description: Muraja'a Monitor — Laravel/Inertia app for tracking Quran revision partnerships (students, leaders, admins)
metadata:
  type: project
---

Muraja'a Monitor is a Laravel 13 + Inertia.js (React) app with three user roles: student, leader, admin.

**Why:** Students track daily Quran revision (muraja'a) with accountability partners. Leaders oversee halqa groups. Admins have full access including CSV exports, leaderboard management, and PDF certificates.

**How to apply:** All feature work must respect the three-tier role model. Admin-only data (phone, telegram, memo level, scheduling preferences) should never be exposed to non-admin routes.

Key security architecture:
- Route middleware: `['auth', 'role:admin']`, `['auth', 'role:leader']`, `['auth', 'role:student']`
- `MustChangePassword` middleware applied globally to all web routes
- `profile.complete` middleware gates all student functionality past profile setup
- Object-level IDOR protection in all controllers (leaders scoped to their halqa, students scoped to their own submissions)
- User model `$hidden` covers: password, phone, telegram_username, memo_level, current_juz, available_times, available_days, is_monitored

Intentional data sharing between students and partners:
- Students see partner's `phone` and `telegram_username` (needed for contact)
- Students do NOT see partner's `memo_level`, `available_days`, scheduling preferences
