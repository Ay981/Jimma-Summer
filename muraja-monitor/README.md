# Muraja'a Monitor

A web application for managing Quran revision partnerships (muraja'a pairs) in structured Islamic programs. Built with Laravel 11, Inertia.js, and React.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.3 / Laravel 11 |
| Frontend | React 18 + Inertia.js |
| Database | PostgreSQL |
| Styles | Custom CSS with oklch design tokens |
| PDF | DomPDF |
| Deployment | Docker (Alpine Linux + nginx + PHP-FPM + Supervisord) |

---

## Roles

| Role | Access |
|---|---|
| **Admin** | Full system control — students, leaders, halqas, pairs, reports, leaderboard |
| **Leader** | Monitors their halqa — pair progress, meetings, outreach, weekly reports |
| **Student** | Submits daily muraja'a, views partner stats, journal, badges |

---

## Setup

### Local Development

```bash
cp .env.example .env
php artisan key:generate
# Configure DB_* in .env
php artisan migrate
php artisan db:seed --force
npm install && npm run dev
php artisan serve
```

### Docker (Production)

```bash
docker-compose up -d
```

On **first deploy only**, seed the database to create the admin account:

```bash
RUN_SEEDERS=true docker-compose up -d
# or: docker exec <container> php artisan db:seed --force
```

This creates `ADMIN001` with password `Muraja@1446`. The admin is forced to change this on first login.

On subsequent restarts, omit `RUN_SEEDERS` — seeders do not run by default to protect production data.

---

## Environment

Critical `.env` values for production:

```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=<generate with: php artisan key:generate>
APP_URL=https://yourdomain.com

SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

DB_CONNECTION=pgsql
DB_HOST=...
DB_PASSWORD=<use secrets manager>
```

---

## Security

This section documents the attack surfaces audited and the controls in place. Verified by a 7-agent parallel security scan covering injection, auth/authz, XSS/CSRF, file upload, sensitive data, rate limiting, and infrastructure.

---

### SQL Injection

**Protected.** All database queries use Laravel's Eloquent ORM with PDO parameterized statements. Every `selectRaw()`, `whereRaw()`, and `orderByRaw()` call in the codebase uses static SQL strings — no user input is interpolated into raw query fragments. The only string interpolation near queries uses server-controlled values (`now()->year`), never request input.

---

### Mass Assignment

**Protected.** The `User` model's `$fillable` array explicitly excludes `role`, `is_active`, `must_change_password`, and `profile_completed`. These security-critical fields are set only through explicit controller assignments — never via `$request->all()` or `fill()`. All `store()` and `update()` controller methods use field allowlists (`$request->only(...)`), not bulk input.

---

### Cross-Site Request Forgery (CSRF)

**Protected.** Laravel's `VerifyCsrfToken` middleware is active on all web routes with no exceptions configured. Inertia.js automatically attaches the XSRF-TOKEN cookie to every non-GET request. Session cookies are set with `SameSite=lax` and `HttpOnly=true`.

---

### Cross-Site Scripting (XSS)

**Protected.** The React frontend contains zero uses of `dangerouslySetInnerHTML`. All user-supplied strings (names, IDs, notes, partner details) are rendered as React text nodes, which the React runtime escapes automatically. Laravel Blade templates in PDF views use `htmlspecialchars()` on any interpolated user content. The nginx configuration adds `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN` on every response.

---

### Authentication Brute Force

**Protected.** The login endpoint (`POST /login`) is throttled to **10 attempts per minute per IP**. The leader activation endpoint (`POST /leader/setup`) is throttled to **5 attempts per hour per IP**. Exceeding these limits returns HTTP 429. Passwords are hashed with bcrypt (cost 12) via Laravel's `'hashed'` model cast.

---

### Privilege Escalation

**Protected.** Every route group is gated by `role:admin`, `role:leader`, or `role:student` middleware. Role is never accepted from request input — it is hardcoded in the controller at account creation time. The `role` field is excluded from `User::$fillable` and from the model's JSON serialization (`$hidden`), so it is never exposed to the frontend or mass-assignable.

---

### Insecure Direct Object Reference (IDOR)

**Protected.** The student dashboard scopes all data strictly to `$request->user()->id`. No student ID is accepted from the URL or request body for personal data endpoints. Leaders can only view students within their own halqa. Admins are gated by role middleware before any data is returned.

---

### Submission Tampering

**Protected.** Only the student who filed a submission (`submitted_by`) can edit it. The subject of the submission (the partner whose revision was recorded) cannot alter their own record — this prevents students from inflating their own progress metrics.

---

### CSV Injection (Formula Injection)

**Protected.** All CSV export methods sanitize user-controlled fields before writing them. Any cell value beginning with `=`, `+`, `-`, `@`, tab, or carriage return is prefixed with a tab character to prevent formula execution in Excel/LibreOffice. All values are also double-quote escaped.

---

### File Upload

**Protected.** CSV imports accept only `csv` MIME type with a 2 MB file size cap. Uploaded files are processed from PHP's temporary directory and never stored in the public webroot. No execution path allows uploaded content to be served as PHP. File download endpoints for snapshots validate that the stored path matches the expected `snapshots/*.pdf` format before serving.

---

### Session Security

**Protected.** Sessions are stored server-side in the database. Session payloads are encrypted (`SESSION_ENCRYPT=true`). Cookies are `HttpOnly` (not accessible to JavaScript), `Secure` (HTTPS only), and `SameSite=lax`. Session data uses JSON serialization, which prevents PHP object deserialization gadget-chain attacks.

---

### Sensitive Data Exposure

**Protected.** `APP_DEBUG=false` in production — no stack traces or internal paths are exposed in error responses. The `password`, `phone`, `telegram_username`, `role`, `is_active`, `must_change_password`, and `profile_completed` fields are excluded from User model JSON serialization. The `.env` file is excluded from the Docker image via `.dockerignore`. No real credentials exist in `.env.example`.

---

### Clickjacking

**Protected.** nginx sets `X-Frame-Options: SAMEORIGIN` on all responses, preventing the application from being embedded in third-party iframes.

---

### Infrastructure

**Protected.**
- `server_tokens off` in nginx suppresses version disclosure
- `.env` and `.htaccess` files return 403 if accessed directly via HTTP
- PostgreSQL is not exposed to the host (no `ports` mapping in docker-compose)
- Composer is pinned to version `2.7` for reproducible builds
- Chromium is not present in the production image (testing-only dependency removed)
- FastCGI read timeout set to 60 seconds (prevents slow-connection DoS)

---

### Known Accepted Risks

| Item | Risk | Mitigation |
|---|---|---|
| PDF generation endpoints (admin/leader) | No per-user rate limit — a compromised admin/leader session could hammer CPU-intensive PDF rendering | PDFs are admin/leader-only; add `throttle:5,1` to PDF routes if abuse occurs |
| `trustProxies(at: '*')` | Clients can spoof `X-Forwarded-For` if app is exposed directly without a proxy | Acceptable while Azure load balancer is in front; narrow to LB CIDR ranges if topology changes |
| `newProgram` data wipe | Irreversible TRUNCATE of all program data requires only role auth + string token | Protected by admin-only middleware; consider adding password re-confirmation for this action |
| Session lifetime (120 min) | Long idle window on shared devices | Acceptable for the use case; reduce if stricter security is needed |

---

## Program Lifecycle

```
Register students → Open pairing window → Students submit preferences
→ Admin runs pairing algorithm → Pairs created → Assign halqas (auto or manual)
→ Start program → Daily muraja'a submissions → Weekly leader reports
→ End program → Lock leaderboard → Archive awards → New program year
```

---

## Default Credentials

| Account | ID | Default Password | Notes |
|---|---|---|---|
| Admin | `ADMIN001` | `Muraja@1446` | Created on first seed; forced password change on login |
| Students | `JUMU-YYYY-NNN` | `Muraja@1446` | Forced password change on first login |
| Leaders | Set during activation | Chosen by leader during setup | Activation code required |
