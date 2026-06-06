# Muraja'a Monitor

A full-stack web application for managing a Quran revision (muraja'a) program. Built for Jimma University MSU Summer Revision Program — handles student onboarding, pair assignment, daily check-ins, halqa (group) management, leader monitoring, and program analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.3) |
| Frontend | React 18 + Inertia.js (no separate API) |
| Database | PostgreSQL |
| Styling | CSS custom properties (no Tailwind) |
| PDF generation | barryvdh/laravel-dompdf |
| Icons | @phosphor-icons/react |
| Build | Vite |

---

## Prerequisites

- PHP 8.3+ with extensions: `pgsql`, `pdo_pgsql`, `mbstring`, `xml`, `curl`, `zip`
- Composer
- Node.js 18+ and npm
- PostgreSQL 14+

---

## Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd muraja-monitor

# 2. Install PHP dependencies
composer install

# 3. Install JS dependencies
npm install

# 4. Copy environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate
```

### Configure `.env`

```env
APP_NAME="Muraja Monitor"
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=muraja_monitor
DB_USERNAME=your_pg_user
DB_PASSWORD=your_pg_password

SESSION_DRIVER=database
QUEUE_CONNECTION=sync
```

### Database setup

```bash
# Create the database in PostgreSQL first
createdb muraja_monitor

# Run migrations and seed (creates admin + demo accounts)
php artisan migrate --seed

# OR: wipe everything and start clean (useful during testing)
php artisan migrate:fresh --seed
```

### Run the app

```bash
# Terminal 1 — Laravel dev server
php artisan serve

# Terminal 2 — Vite (hot reload)
npm run dev
```

App runs at `http://localhost:8000`.

---

## Default Accounts (after seeding)

| Role | Login ID | Password |
|---|---|---|
| Admin | `ADMIN001` | `Muraja@1446` |
| Leader (demo) | `LDR001` | `Leader@123` |
| Student (demo) | `STU001` | `Student@123` |
| Student (demo) | `STU002` | `Student@123` |

Demo leader setup code: **`LDR-TEST`**

> All accounts with `must_change_password = true` are forced to set a new password on first login. Leaders are also asked for their real name at this step.

---

## User Roles

### Admin
Full control. Manages the entire program lifecycle.

### Leader (Halqa Leader)
Monitors their assigned halqa (group). Logs meetings, files contact notes, manages pairs, views member progress.

### Student
Submits daily muraja'a check-ins, views partner progress, requests a preferred pair partner, fills profile on first login.

---

## Program Lifecycle (Admin Workflow)

Follow these steps in order when running a new program:

### Step 1 — Import Students
1. Collect student names and phone numbers (Google Form works well)
2. Export to CSV with columns: `name`, `phone`
3. Go to **Admin → Students → Import CSV**
4. Student IDs are auto-generated as `JUMU-{year}-{sequence}` (e.g. `JUMU-2026-001`)

### Step 2 — Share Credentials
1. Go to **Admin → Students → ⬇ Credentials PDF**
2. Distribute the PDF to students — it shows each student's name, login ID, and default password
3. Students log in, change their password, then complete their profile (juz level, available days/times, health notes)

### Step 3 — Open Pairing Request Window
1. Go to **Admin → Pairing**
2. Set a deadline and click **Open Window**
3. Students can now go to **My Partner** page and enter a preferred partner's student ID
4. They can change or withdraw their request anytime before the deadline

### Step 4 — Run Pairing
1. After the deadline, go to **Admin → Pairing**
2. Review the requests table — requests are shown as **Mutual**, **One-sided**, or **Conflict**
3. Click **⚡ Run Pairing**

**Algorithm:**
- **Mutual** (A→B and B→A): always paired together
- **One-sided** (A→B, B has no request): paired together
- **Conflict** (A→B, B→C): both go to the random pool
- **Random pool**: paired by best time-slot overlap (most shared available times)
- Odd number left over: flagged for manual assignment by admin

### Step 5 — Create Halqas
1. Go to **Admin → Halqas**
2. Use **Auto-create halqas** — specify how many halqas to create
3. Leader accounts are auto-created with IDs `LDR-0001`, `LDR-0002`… and default password `Muraja@1446`
4. Distribute credentials to leaders — they log in, enter their real name, and set a password
5. Assign pairs to halqas (keeping pairs together in the same halqa)

### Step 6 — Program Running
- Students do daily check-ins via **Student → Check In**
- Leaders monitor their halqa via the Leader dashboard
- Admin monitors everything via **Admin → Dashboard**

---

## Key Pages Reference

### Admin
| URL | Purpose |
|---|---|
| `/admin/dashboard` | Program overview — pulse, charts, early warning |
| `/admin/students` | Full student list with status, flags, filters |
| `/admin/students/{id}` | Student detail — timeline, submissions, admin notes |
| `/admin/pairing` | Pairing request window control + run pairing |
| `/admin/halqas` | Halqa management, random assign, pair distribution |
| `/admin/leaders` | Leader monitoring — login activity, notes, meetings |
| `/admin/leaders/{id}` | Leader detail — members, meetings, contact notes |
| `/admin/leaderboard` | Rankings — students, pairs, halqas, leaders |
| `/admin/pairs` | All pairs, integrity flags |
| `/admin/reports` | Export PDFs — certificates, program reports |
| `/admin/announcements` | Broadcast messages to students/leaders |
| `/admin/integrity` | Flagged submissions review |
| `/admin/outreach` | Contact students, escalation queue |
| `/admin/audit` | Full audit log of all actions |
| `/admin/settings` | Program start date and global settings |

### Leader
| URL | Purpose |
|---|---|
| `/leader/dashboard` | Halqa overview — pair statuses, absence queue |
| `/leader/members/{pair}` | Pair detail — submission history, contact notes |
| `/leader/meetings` | Log and view halqa meetings |

### Student
| URL | Purpose |
|---|---|
| `/student/dashboard` | Personal stats, streak, today's check-in |
| `/student/pair` | Partner info + partner request form |
| `/student/history` | Personal submission history |
| `/student/halqa` | Halqa members overview |
| `/student/badges` | Earned badges |
| `/student/journal` | Private reflection journal |

---

## File Structure (Key Files)

```
app/
  Http/
    Controllers/
      Admin/
        DashboardController.php    # Admin dashboard data
        StudentController.php      # Students CRUD + CSV import
        HalqaController.php        # Halqa management + auto-assign
        PairingController.php      # Pairing window + run algorithm
        LeadersController.php      # Leader monitoring + detail + reset PW
        LeaderboardController.php  # Rankings calculation
      Leader/
        HalqaDashboardController.php  # Leader dashboard
        PairDetailController.php      # Pair member detail
        MeetingController.php         # Meeting logs
      Student/
        DashboardController.php    # Student dashboard
        CheckinController.php      # Daily muraja'a submission
        PairController.php         # My partner page + pairing info
        PairRequestController.php  # Submit/withdraw partner request
      Auth/
        AuthController.php         # Login, logout, change password, leader setup
    Middleware/
      MustChangePassword.php       # Forces password change on first login
      MustCompleteProfile.php      # Forces profile completion (students)
  Models/
    User.php          # Students, leaders, admin (all in one table, role column)
    Halqa.php         # Halqa groups
    Pair.php          # Student pairs (student_a_id, student_b_id)
    PairSubmission.php  # Daily check-in records
    PairingRequest.php  # Partner preference requests
    ProgramSetting.php  # Key-value program config store
    MeetingLog.php
    ContactLog.php
    Badge.php
  Services/
    ConsistencyService.php  # Consistency % and streak calculations

resources/
  js/
    Pages/
      Admin/          # All admin React pages
      Leader/         # All leader React pages
      Student/        # All student React pages
      Auth/           # Login, ChangePassword, LeaderSetup
    Components/
      UI/
        PasswordInput.jsx   # Eye-toggle password input
        BarChart.jsx
        LineChart.jsx
        Sparkline.jsx
        Heatmap.jsx
        StatusTag.jsx
    Layouts/
      AdminLayout.jsx    # Sidebar nav for admin
      LeaderLayout.jsx
      StudentLayout.jsx
  views/
    pdf/
      student-credentials.blade.php  # Credentials PDF (name, ID, password)
      certificate.blade.php          # Completion certificate
      halqa-report.blade.php         # Halqa progress report

database/
  migrations/    # 32 migrations, numbered sequentially
  seeders/
    DatabaseSeeder.php        # Runs all seeders
    DemoSeeder.php            # Demo accounts for testing
    ProgramSettingsSeeder.php # Default program settings
    AyatRotationSeeder.php    # Daily ayat rotation data
```

---

## Student ID Format

Auto-generated on CSV import: `JUMU-{year}-{sequence}`

Examples: `JUMU-2026-001`, `JUMU-2026-002`, …`JUMU-2026-099`

The sequence continues from the highest existing ID so repeated imports never collide.

---

## Password Policy

- Default password for all imported students and auto-created leaders: `Muraja@1446`
- Every account with `must_change_password = true` is intercepted after login and forced to the change-password screen
- Leaders additionally enter their real name at this step
- Students additionally complete their profile (juz, available times, health notes) after password change
- Admin can reset any student or leader password back to the default from their detail page

---

## Pairing Algorithm

Located in `PairingController::run()`.

**Pass 1 — Mutual requests:** If A requested B AND B requested A → locked pair.

**Pass 2 — One-sided requests:** If A requested B and B submitted no request → paired together. If both parties requested different people (conflict) → both go to the random pool.

**Pass 3 — Random pool:** Students paired by greedy best-fit time-slot overlap. The student with the most shared available prayer times gets matched first. If an odd number of students remain unmatched after all passes → flagged for manual admin assignment.

---

## PDF Generation

Uses `barryvdh/laravel-dompdf`. All PDF blade views are in `resources/views/pdf/`.

Available PDFs:
- **Student credentials** — `GET /admin/students/credentials-pdf`
- **Halqa report** — from Leader dashboard export
- **Completion certificate** — from Admin → Reports → Leaderboard

---

## Common Commands

```bash
# Fresh database with demo data
php artisan migrate:fresh --seed

# Fresh database with admin only
php artisan migrate:fresh --seed && php artisan tinker --execute="App\Models\User::where('role', '!=', 'admin')->delete();"

# Run a specific seeder
php artisan db:seed --class=DemoSeeder

# Clear all caches
php artisan optimize:clear

# Build for production
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Environment Notes

- `SESSION_DRIVER=database` is required (sessions are stored in the DB, not files)
- `QUEUE_CONNECTION=sync` means jobs run synchronously — fine for development; use `redis` or `database` driver in production with a queue worker
- PostgreSQL is required — the codebase uses `::text` casts and other Postgres-specific syntax that won't work on MySQL

---

## Known Limitations / Future Work

- **Trio support** — when pairing produces an odd student, they are currently flagged for manual assignment. A future version will support three-student groups (trios) with a rotating reviewer cycle.
- **Pairing window auto-close** — the deadline date is informational only; the window must be manually closed by the admin after the deadline passes.
- **Halqa assignment after pairing** — after running pairing, pairs have `halqa_id = null`. The admin must distribute pairs to halqas manually via Admin → Halqas, ensuring pairs are never split across halqas.
