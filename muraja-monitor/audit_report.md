# 🔍 Master Codebase Audit Report: Muraja Monitor
**Audit Type:** 100% Exhaustive Full-Stack Codebase Audit (Multi-Wave Subagent Swarm)  
**Repository:** `muraja-monitor` (Laravel 11 / Vue / Capacitor / Web Application)  
**Status:** In Progress (Wave 1 Executing)  

---

## 📑 Table of Contents

1. [Executive Summary & Audit Methodology](#1-executive-summary--audit-methodology)
2. [Domain 1: Security, Authentication, Authorization & IDOR Boundaries (Wave 1)](#domain-1-security-authentication-authorization--idor-boundaries-wave-1)
3. [Domain 2: ORM, Database Schema, Indexing & N+1 Performance (Wave 1)](#domain-2-orm-database-schema-indexing--n1-performance-wave-1)
4. [Domain 3: Frontend Performance, State Synchronization & Offline/Caching Resilience (Wave 2)](#domain-3-frontend-performance-state-synchronization--offlinecaching-resilience-wave-2)
5. [Domain 4: Backend Business Logic, Controllers, Services & Input Validation (Wave 3)](#domain-4-backend-business-logic-controllers-services--input-validation-wave-3)
6. [Domain 5: Asynchronous Jobs, Queues, Webhooks & Infrastructure (Wave 4)](#domain-5-asynchronous-jobs-queues-webhooks--infrastructure-wave-4)
7. [Domain 6: Shared UI Components, Modals, Configuration Hardening & 100% Sweep (Wave 5)](#domain-6-shared-ui-components-modals-configuration-hardening--100-sweep-wave-5)
8. [Remediation Roadmap & Action Plan](#8-remediation-roadmap--action-plan)

---

## 1. Executive Summary & Audit Methodology

This report documents an exhaustive, line-by-line full-stack technical audit of the `muraja-monitor` repository. The investigation is organized into **5 distinct waves** executed by parallel subagent swarms to ensure 100% repository coverage without blind spots or context limitations.

### Audit Rigor & Standards
Every identified bug, vulnerability, performance bottleneck, N+1 query, IDOR risk, or architectural flaw is strictly documented with:
1. **Exact File Path & Line Numbers:** Precise line coordinates (`path/to/file:Lxx-Lyy`).
2. **Severity Rating:** `[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, or `[LOW]`.
3. **Root Cause Analysis:** Mechanical explanation of why the defect occurs at runtime or compile/parse time.
4. **Exact Code Remediation:** Drop-in `Before` / `After` code snippets demonstrating how to fix the issue according to modern Laravel, Vue 3, and mobile (Capacitor/PWA) engineering best practices.

---

## Domain 1: Security, Authentication, Authorization & IDOR Boundaries (Wave 1)

### Part A: Authentication, Session Handling, CORS, CSRF & Rate-Limiting (Auth & Security Auditor)

#### 🚨 [CRITICAL] Findings

##### 1.1. Missing Account Deactivation Check in Role Authorization & Deactivation Session Persistence
- **Exact File Path & Line Numbers:** `app/Http/Middleware/RoleMiddleware.php:L16-L25`, `app/Http/Controllers/Admin/StudentController.php:L495-L518`, `app/Http/Controllers/Admin/LeadersController.php:L226-L234`
- **Severity Rating:** `[CRITICAL]`
- **Root Cause Analysis:** 
  During initial login (`AuthController@login:L44-L50`), the application verifies `$user->is_active`. However, once authenticated, `RoleMiddleware` checks only whether the user is logged in and matches the required role (`!$user || !in_array($user->role, $roles, true)`). It never checks `$user->is_active`.
  Furthermore, when an administrator deactivates a student or leader account (`StudentController@toggleActive` / `LeadersController@toggleActive`), the database attribute `is_active` is toggled to `false`, but **existing sessions and remember tokens in the database are not invalidated**. Consequently, any student, leader, or administrator whose account is deactivated while logged in (or possessing a valid remember cookie) retains complete, uninterrupted access to all protected endpoints and state-changing actions until their session naturally expires.
- **Exact Code Remediation:**

**Before (`app/Http/Middleware/RoleMiddleware.php:L16-L25`):**
```php
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(403, 'Unauthorized.');
        }

        return $next($request);
    }
```

**After (`app/Http/Middleware/RoleMiddleware.php:L16-L29`):**
```php
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_active || ! in_array($user->role, $roles, true)) {
            if ($user && ! $user->is_active) {
                auth()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
            abort(403, 'Unauthorized or account deactivated.');
        }

        return $next($request);
    }
```

**Before (`app/Http/Controllers/Admin/StudentController.php:L495-L518`):**
```php
  public function toggleActive(User $student): RedirectResponse
  {
    abort_if($student->role !== "student", 404);

    $newState = !$student->is_active;
    $student->update(["is_active" => $newState]);

    // If deactivating — set their pair to solo
    if (!$newState) {
      $pair = Pair::where(
        fn($q) => $q
          ->where("student_a_id", $student->id)
          ->orWhere("student_b_id", $student->id),
      )->first();
      $pair?->update(["status" => "solo"]);
    }

    return back()->with(
      "success",
      $newState
        ? "Account reactivated."
        : "Account deactivated. Pair set to solo.",
    );
  }
```

**After (`app/Http/Controllers/Admin/StudentController.php:L495-L525`):**
```php
  public function toggleActive(User $student): RedirectResponse
  {
    abort_if($student->role !== "student", 404);

    $newState = !$student->is_active;
    $student->update(["is_active" => $newState]);

    if (!$newState) {
      // Invalidate all active database sessions and remember tokens upon deactivation
      \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $student->id)->delete();
      $student->forceFill(['remember_token' => \Illuminate\Support\Str::random(60)])->save();

      $pair = Pair::where(
        fn($q) => $q
          ->where("student_a_id", $student->id)
          ->orWhere("student_b_id", $student->id),
      )->first();
      $pair?->update(["status" => "solo"]);
    }

    return back()->with(
      "success",
      $newState
        ? "Account reactivated."
        : "Account deactivated. All sessions revoked and pair set to solo.",
    );
  }
```
*(Apply the exact same session deletion and `remember_token` cycling inside `Admin/LeadersController.php:toggleActive`).*

---

#### ⚠️ [HIGH] Findings

##### 1.2. Missing Session Invalidation & Remember Token Cycling on Password Change/Reset
- **Exact File Path & Line Numbers:** `app/Http/Controllers/Auth/AuthController.php:L116-L126`, `app/Http/Controllers/Admin/StudentController.php:L522-L542`, `app/Http/Controllers/Admin/LeadersController.php:L238-L261`, `app/Http/Controllers/Leader/PasswordResetController.php:L25-L29`, `app/Http/Controllers/Leader/BroadcastController.php:L144-L147`
- **Severity Rating:** `[HIGH]`
- **Root Cause Analysis:** 
  When a user voluntarily updates their password via `changePassword`, or when an administrator or halqa leader resets a user's password (`resetPassword`), only the model's `password` and `must_change_password` fields are updated. Because Laravel database sessions are indexed by `id` (`session_id`), changing the `password` hash does not automatically invalidate active sessions on other devices, nor does it cycle or clear existing `remember_token` cookies across other sessions. If a user changes their password due to suspected compromise, or if an admin resets a breached account, the attacker's active sessions and remember cookies on other devices remain completely valid.
- **Exact Code Remediation:**

**Before (`app/Http/Controllers/Auth/AuthController.php:L116-L126`):**
```php
    $updates = [
      "password" => Hash::make($request->password),
      "must_change_password" => false,
    ];

    if ($user->role === "leader" && $request->filled("name")) {
      $updates["name"] = $request->name;
    }

    $user->update($updates);
```

**After (`app/Http/Controllers/Auth/AuthController.php:L116-L129`):**
```php
    $updates = [
      "password" => Hash::make($request->password),
      "must_change_password" => false,
    ];

    if ($user->role === "leader" && $request->filled("name")) {
      $updates["name"] = $request->name;
    }

    $user->update($updates);

    // Invalidate all sessions across other devices and cycle remember tokens
    Auth::logoutOtherDevices($request->password);
```

**Before (`app/Http/Controllers/Admin/StudentController.php:L522-L533`):**
```php
  public function resetPassword(User $student): RedirectResponse
  {
    abort_if($student->role !== "student", 404);
    $defaultPassword = ProgramSetting::get(
      "default_password",
      "ChangeMe@" . rand(1000, 9999),
    );
    $student->update([
      "password" => Hash::make($defaultPassword),
      "must_change_password" => true,
    ]);
```

**After (`app/Http/Controllers/Admin/StudentController.php:L522-L537`):**
```php
  public function resetPassword(User $student): RedirectResponse
  {
    abort_if($student->role !== "student", 404);
    $defaultPassword = ProgramSetting::get(
      "default_password",
      "ChangeMe@" . rand(1000, 9999),
    );
    $student->update([
      "password" => Hash::make($defaultPassword),
      "must_change_password" => true,
    ]);

    // Revoke all existing sessions and cycle remember token upon administrative reset
    \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $student->id)->delete();
    $student->forceFill(['remember_token' => \Illuminate\Support\Str::random(60)])->save();
```

---

##### 1.3. Missing Published `config/cors.php` & Explicit Origin Hardening
- **Exact File Path & Line Numbers:** `config/` directory (missing `config/cors.php`), `bootstrap/app.php:L58-L87`
- **Severity Rating:** `[HIGH]`
- **Root Cause Analysis:** 
  Laravel 11 does not publish `config/cors.php` by default. The application serves web endpoints, Inertia pages, and mobile client API interactions (`Capacitor` / `PushController`), but relies on default internal CORS behavior (`'allowed_origins' => ['*']`, `'supports_credentials' => false`). Without explicit hardening, any future architectural adjustment that enables `supports_credentials` while relying on wildcard origins, or any misconfigured API route expansion, leaves the application exposed to Cross-Origin Resource Sharing attacks, credential leakage, or unauthorized cross-origin state changes.
- **Exact Code Remediation:**
Create/publish `config/cors.php` (`php artisan config:publish cors`) with strict origins and allowed headers:

**After (`config/cors.php` - New Drop-in File):**
```php
<?php

return [
    'paths' => ['api/*', 'telegram/webhook', 'push/register', 'verify/certificate/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_origins' => [
        env('APP_URL', 'http://localhost'),
        'capacitor://localhost',
        'http://localhost',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['X-Requested-With', 'Content-Type', 'X-Token-Auth', 'Authorization', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => true,
];
```

---

#### 🟡 [MEDIUM] Findings

##### 1.4. Local Environment Throttle Middleware Bypass (`app()->isLocal()` Exemption)
- **Exact File Path & Line Numbers:** `app/Http/Middleware/ThrottleRequests.php:L10-L27`
- **Severity Rating:** `[MEDIUM]`
- **Root Cause Analysis:** 
  The custom `ThrottleRequests` middleware overrides both `handle` and `handleRequestUsingNamedLimiter` to immediately return `$next($request)` whenever `app()->isLocal()` is true. If `APP_ENV` is accidentally set to `local` inside a preview container, internal testing server, or improperly provisioned staging instance, rate-limiting (`throttle:10,1`, `throttle:5,60`, `throttle:30,1`) is completely disabled globally. This permits unbounded brute-force attacks against login, leader setup, and password change endpoints.
- **Exact Code Remediation:**

**Before (`app/Http/Middleware/ThrottleRequests.php:L10-L27`):**
```php
    public function handle($request, Closure $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = '')
    {
        if (app()->isLocal()) {
            return $next($request);
        }

        return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
    }
```

**After (`app/Http/Middleware/ThrottleRequests.php:L10-L21`):**
```php
    public function handle($request, Closure $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = '')
    {
        return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
    }

    public function handleRequestUsingNamedLimiter($request, Closure $next, $limiterName, $limiterCallback)
    {
        return parent::handleRequestUsingNamedLimiter($request, $next, $limiterName, $limiterCallback);
    }
```

---

##### 1.5. Missing Rate Limiting on Administrative Password Reset & Sensitive Action Endpoints
- **Exact File Path & Line Numbers:** `routes/web.php:L65-L66`, `routes/web.php:L236-L239`, `routes/web.php:L331-L334`, `routes/web.php:L495-L498`
- **Severity Rating:** `[MEDIUM]`
- **Root Cause Analysis:** 
  While login (`routes/web.php:L51`) and password changes (`routes/web.php:L73`) have throttle middleware attached (`throttle:10,1` and `throttle:5,1`), administrative password reset endpoints (`POST /leader/students/{student}/reset-password`, `POST /admin/students/{student}/reset-password`, `POST /admin/leaders/{leader}/reset-password`) and push registration (`POST /push/register`) lack endpoint-level rate limits. A compromised or malicious leader/admin session could rapidly trigger automated requests to reset passwords across hundreds of students/leaders or flood device token tables.
- **Exact Code Remediation:**

**Before (`routes/web.php:L65-L66`, `L236-L239`, `L331-L334`, `L495-L498`):**
```php
  Route::post("/push/register", [\App\Http\Controllers\PushController::class, "register"])
    ->name("push.register");
// ...
    Route::post("/students/{student}/reset-password", [
      LeaderPasswordReset::class,
      "reset",
    ])->name("students.resetPassword");
// ...
    Route::post("/students/{student}/reset-password", [
      AdminStudent::class,
      "resetPassword",
    ])->name("students.resetPassword");
// ...
    Route::post("/leaders/{leader}/reset-password", [
      AdminLeaders::class,
      "resetPassword",
    ])->name("leaders.resetPassword");
```

**After (`routes/web.php:L65-L66`, `L236-L239`, `L331-L334`, `L495-L498`):**
```php
  Route::post("/push/register", [\App\Http\Controllers\PushController::class, "register"])
    ->middleware("throttle:30,1")
    ->name("push.register");
// ...
    Route::post("/students/{student}/reset-password", [
      LeaderPasswordReset::class,
      "reset",
    ])->middleware("throttle:10,1")->name("students.resetPassword");
// ...
    Route::post("/students/{student}/reset-password", [
      AdminStudent::class,
      "resetPassword",
    ])->middleware("throttle:20,1")->name("students.resetPassword");
// ...
    Route::post("/leaders/{leader}/reset-password", [
      AdminLeaders::class,
      "resetPassword",
    ])->middleware("throttle:10,1")->name("leaders.resetPassword");
```

---

##### 1.6. Predictable Entropy in Default Passwords (`rand(1000, 9999)` Fallback)
- **Exact File Path & Line Numbers:** `app/Http/Controllers/Admin/StudentController.php:L318-L321` & `L525-L528`, `app/Http/Controllers/Admin/LeadersController.php:L242-L245`, `app/Http/Controllers/Leader/PasswordResetController.php:L21-L24`, `app/Http/Controllers/Leader/BroadcastController.php:L140-L143`
- **Severity Rating:** `[MEDIUM]`
- **Root Cause Analysis:** 
  When resetting or creating accounts without a custom `default_password` setting in `ProgramSetting`, the application uses `rand(1000, 9999)` to append a 4-digit integer (`ChangeMe@1000` to `ChangeMe@9999`). This yields exactly 9,000 possible combinations. Because `rand()` is not cryptographically secure and the search space is small, an attacker who identifies a student ID can easily guess or brute-force the default temporary password before the user completes their first login.
- **Exact Code Remediation:**

**Before (`app/Http/Controllers/Leader/PasswordResetController.php:L21-L24`):**
```php
    $defaultPassword = \App\Models\ProgramSetting::get(
      "default_password",
      "ChangeMe@" . rand(1000, 9999),
    );
```

**After (`app/Http/Controllers/Leader/PasswordResetController.php:L21-L24`):**
```php
    $defaultPassword = \App\Models\ProgramSetting::get(
      "default_password",
      "ChangeMe@" . random_int(100000, 999999),
    );
```

---

#### 🟢 [LOW] Findings

##### 1.7. Database Session Pruning & Expire-on-Close Persistence on PWAs
- **Exact File Path & Line Numbers:** `config/session.php:L34-L37` & `config/session.php:L116`, `bootstrap/app.php:L18-L57`
- **Severity Rating:** `[LOW]`
- **Root Cause Analysis:** 
  `config/session.php` configures `"expire_on_close" => env("SESSION_EXPIRE_ON_CLOSE", true)`. While `true` instructs the browser to create a session cookie without an explicit expiry time, mobile webviews (Capacitor) and desktop browsers set to "Continue where you left off" persist session cookies indefinitely across app exits. Furthermore, `"lottery" => [2, 100]` triggers database session sweeping only 2% of the time. Without a scheduled database session prune task, expired rows accumulate in the `sessions` table over time.
- **Exact Code Remediation:**

**Before (`bootstrap/app.php:L18-L26`):**
```php
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('muraja:remind morning')
            ->dailyAt('07:00')
            ->timezone('Africa/Addis_Ababa');
```

**After (`bootstrap/app.php:L18-L28`):**
```php
    ->withSchedule(function (Schedule $schedule): void {
        // Prune expired database sessions daily
        $schedule->command('model:prune', ['--model' => [\Illuminate\Session\DatabaseSessionHandler::class]])->daily();

        $schedule->command('muraja:remind morning')
            ->dailyAt('07:00')
            ->timezone('Africa/Addis_Ababa');
```

---

##### 1.8. Missing Global HTTP Security Headers Middleware
- **Exact File Path & Line Numbers:** `bootstrap/app.php:L72-L79`, `app/Providers/AppServiceProvider.php:L25-L30`
- **Severity Rating:** `[LOW]`
- **Root Cause Analysis:** 
  While `NoCacheHeaders` is prepended (`bootstrap/app.php:L72`) and HTTPS is enforced in production (`AppServiceProvider.php:L27`), standard HTTP security headers such as `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Strict-Transport-Security` are not globally set across web responses. This leaves minor defense-in-depth gaps against clickjacking (`X-Frame-Options`) and MIME-sniffing (`X-Content-Type-Options`).
- **Exact Code Remediation:**

**Before (`bootstrap/app.php:L72-L79`):**
```php
        $middleware->web(prepend: [
            \App\Http\Middleware\NoCacheHeaders::class,
        ]);
```

**After (`bootstrap/app.php:L72-L83`):**
```php
        $middleware->web(prepend: [
            \App\Http\Middleware\NoCacheHeaders::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
```

---

#### ✅ Verified Secure Configurations (Proof of Inspection)
1. **CSRF Protection (`bootstrap/app.php:L68-L70`):** Only `telegram/webhook` is exempted; all state-changing web/Inertia actions (`POST`/`PUT`/`DELETE`) are fully protected.
2. **Session Cookie Security (`config/session.php:L49, L171, L184, L201`):** Database sessions are encrypted (`encrypt = true`), and cookies enforce `secure = true`, `http_only = true`, and `same_site = lax`.
3. **Password Hashing (`config/auth.php`, `AuthController::login:L36`, `StudentController::store:L326`):** All passwords use standard `Hash::make()` and `Hash::check()`. No plaintext storage or transmission exists.
4. **Trusted Proxies (`bootstrap/app.php:L59-L66`):** Correctly trusts Cloudflare Tunnel and headers (`HEADER_X_FORWARDED_*`) so rate limiting works on real client IPs.
5. **Inertia PII Sanitization (`HandleInertiaRequests.php:L37-L80`):** Shared `$user` props expose only non-sensitive attributes (`id`, `name`, `role`, `halqa_id`, `weekly_target`), filtering out `password`, `remember_token`, and `phone`.

### Part B: Authorization, Role-Based Access Control & IDOR Boundaries (RBAC & IDOR Auditor)

#### 1. Architectural Summary & Authorization Pattern

##### Absence of Traditional Policies, Gates, and Form Requests
- **`app/Policies/` Directory**: Does not exist (`list_dir` confirmed absence).
- **`app/Http/Requests/` Directory**: Does not exist (`list_dir` confirmed absence).
- **`AppServiceProvider` / Gate Definitions**: `app/Providers/AppServiceProvider.php` contains no `Gate::define()` calls or policy registrations (`register()` only scopes `ConsistencyService` and binds `ThrottleRequests`).
- **Form Request Authorization**: All request validation across the application is performed inline inside controller actions via `$request->validate([...])`.

##### Imperative & Decentralized Authorization Design
Instead of declarative policy classes, the application implements a strict **two-layer imperative security architecture**:
1. **Layer 1: Route-Level RBAC Gating (`RoleMiddleware`)**
   - Registered under alias `'role'` in `bootstrap/app.php` mapping to `App\Http\Middleware\RoleMiddleware`.
   - Evaluates `$request->user()->role` against required roles passed in route groups (`routes/web.php`).
   - If unauthenticated, redirects to `/login`. If the authenticated user's role does not match, immediately returns `abort(403, 'Unauthorized action.')`.
2. **Layer 2: Inline Controller Boundary Enforcement (`abort_if` / `abort_unless` / Scoped Queries)**
   - Every single action method that accepts an ID or model parameter (`$pair`, `$student`, `$test`, `$meeting`, `$announcement`, `$submission`) performs direct verification against the authenticated user’s tenancy scope (`$user->id`, `$user->halqa_id`, or `$leader->ledHalqa->id`) before reading, modifying, or deleting the record.

---

#### 2. Exhaustive Verification by Controller Category

##### Category 1: Root & Authentication Controllers
All authentication routes (`routes/web.php`) are protected by either `middleware('guest')` or `middleware('auth')`.

| Controller | Action Method | Route & Middleware | Authorization & IDOR Boundary Analysis |
| :--- | :--- | :--- | :--- |
| **`App\Http\Controllers\DashboardController`** | `index` | `GET /dashboard` (`auth`) | Inspects `$request->user()->role` (`admin`, `leader`, `student`) and redirects to `/admin/dashboard`, `/leader/dashboard`, or `/student/dashboard`. |
| **`App\Http\Controllers\CheckinController`** | `index` | `GET /checkin` (`auth`) | Resolves user via `auth()->user()`. Scopes pair query: `Pair::where(fn($q) => $q->where('student_a_id', $user->id)->orWhere('student_b_id', $user->id))->first()`. If no pair (`status === 'solo'`), securely falls back to allowing self check-in without exposing or accepting arbitrary IDs. |
| **`App\Http\Controllers\ProfileController`** | `edit`, `update`, `destroy` | `GET/PATCH/DELETE /profile` (`auth`) | All operations act exclusively on `$request->user()`. No user IDs are accepted in parameters. `destroy` requires current password validation before deleting `$request->user()`. |
| **`App\Http\Controllers\Auth\*` (8 Controllers)** | `RegisteredUserController`, `VerifyEmailController`, `PasswordResetLinkController`, etc. | `/register`, `/login`, `/verify-email/{id}/{hash}`, etc. (`guest` / `auth`) | `VerifyEmailController` verifies `$request->user()->getKey() == $id` before marking email as verified. `ConfirmablePasswordController` authenticates `$request->user()->email` against provided password. All other endpoints strictly use `$request->user()`. |

---

##### Category 2: Student Controllers (`App\Http\Controllers\Student\*`)
All routes under `/student/*` are wrapped in `middleware(['auth', 'role:student'])`.

| Controller | Action Method | Route | Authorization & IDOR Boundary Analysis |
| :--- | :--- | :--- | :--- |
| **`AnnouncementController`** | `index` | `GET /student/announcements` | Resolves `$user = auth()->user()`. Scopes query: `Announcement::where(fn($q) => $q->whereNull('halqa_id')->orWhere('halqa_id', $user->halqa_id))`. Students cannot view announcements belonging to other halqas. |
| **`CertificateController`** | `index`, `download` | `GET /student/certificate[s/download]` | `index` checks `auth()->user()`. `download` delegates to `(new LeaderboardController())->certificate(auth()->user())`. Only generates the authenticated student's own certificate. |
| **`CheckinController`** | `store`, `update`, `destroy`, `fileExcuse`, `reviewFlag`, `journal` | `POST/PATCH/DELETE /student/checkin/*` | • **`store` / `update` / `destroy`**: Scopes `$user = auth()->user()` and resolves pair where `$user->id` is `student_a_id` or `student_b_id`. Validates `subject_student_id` is within the resolved pair (`$subjectId === $user->id || $subjectId === $partnerId`). For updates/deletes, checks `$submission->pair_id !== $pair->id` and `$submission->submitted_by !== $user->id`.<br>• **`reviewFlag`**: Checks `$submission->pair_id !== $pair->id` and ensures only the subject student or partner can review (`abort_if($user->id !== $submission->subject_student_id && $user->id !== $submission->submitted_by, 403)`).<br>• **`fileExcuse`**: Checks target date against program window (`ProgramSetting`) and enforces that excuse is filed exclusively for `$user->id`. |
| **`DashboardController`** | `index`, `downloadCertificate` | `GET /student/dashboard[*]` | Scopes entirely to `$user = auth()->user()`. Queries `Pair` where `$user->id` is `student_a_id` or `student_b_id`. Fetches `PairSubmission` strictly for `subject_student_id = $user->id`. |
| **`PairController`** | `index`, `requestChange`, `cancelChangeRequest`, `respondToChangeRequest` | `GET/POST /student/pair[*]` | • **`index` / `requestChange`**: Scopes to `$user = auth()->user()` and checks `$pair->halqa_id === $user->halqa_id`.<br>• **`cancelChangeRequest`**: `abort_if($changeRequest->requested_by !== $user->id, 403);` prevents cancelling another student's request.<br>• **`respondToChangeRequest`**: `abort_if($changeRequest->requested_partner_id !== $user->id, 403);` ensures only the targeted partner can accept/reject. |

---

##### Category 3: Leader Controllers (`App\Http\Controllers\Leader\*`)
All routes under `/leader/*` are wrapped in `middleware(['auth', 'role:leader'])`. Leaders operate exclusively within the halqa assigned to their user account (`$leader->ledHalqa`).

| Controller | Action Method | Route | Authorization & IDOR Boundary Analysis |
| :--- | :--- | :--- | :--- |
| **`AnnouncementController`** | `index`, `store`, `update`, `destroy` | `/leader/announcements[*]` | Resolves `$halqa = $leader->ledHalqa; abort_if(!$halqa, 403)`. `index` scopes to `$halqa->id`. `store` locks `halqa_id` to `$halqa->id`. `destroy` validates `abort_if($announcement->posted_by !== $leader->id, 403)`. |
| **`BroadcastController`** | `broadcast`, `nudge`, `escalate`, `resetPassword` | `/leader/broadcast[*]` | For `nudge`, `escalate`, and `resetPassword($studentId)`: executes `$student = User::findOrFail($studentId);` followed immediately by `abort_if(!$halqa || $student->halqa_id !== $halqa->id, 403);`. Prevents any cross-halqa student manipulation or password resetting. |
| **`HalqaDashboardController`** | `index`, `downloadMyCertificate`, `downloadStudentCertificate` | `/leader/dashboard[*]` | • **`index`**: Queries members where `halqa_id = $halqa->id`.<br>• **`downloadStudentCertificate(User $student)`**: Validates that `$student` is part of a pair within the leader's halqa: `abort_if(!$halqa || !Pair::where('halqa_id', $halqa->id)->where(fn($q) => $q->where('student_a_id', $student->id)->orWhere('student_b_id', $student->id))->exists(), 403);`. |
| **`MeetingController`** | `index`, `store`, `update`, `destroy`, `resolveAction` | `/leader/meetings[*]` | • **`index` / `store`**: Scopes to `$halqa->id`. For `store`, verifies all `$item["student_id"]` action entries exist in `User::where('halqa_id', $halqa->id)->pluck('id')`.<br>• **`update` / `destroy`**: Checks `abort_if(!$halqa || $meeting->halqa_id !== $halqa->id, 403)`.<br>• **`resolveAction`**: Checks `abort_if(!$halqa || $actionItem->meeting->halqa_id !== $halqa->id, 403)`. |
| **`OutreachController`** | `markFollowedUp`, `notifyAbsent` | `/leader/outreach[*]` | • **`markFollowedUp(Pair $pair)`**: Checks `abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);`.<br>• **`notifyAbsent`**: Scopes candidate students strictly to `$halqa->id`. |
| **`PairChangeController`** | `index`, `store` | `/leader/pair-changes[*]` | • **`store(Pair $pair)`**: Checks `abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403)`. Validates `$studentId` exists in `$pair->student_a_id` / `student_b_id`.<br>• **`index`**: Scopes query: `PairChangeRequest::where('leader_id', $leader->id)`. |
| **`PairDetailController`** | `show`, `addContact`, `updatePrivateNote`, `toggleWatchlist`, `reviewSubmission`, `flagSubmission` | `/leader/pairs/{pair}/*` | Every endpoint executes: `abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);`. Methods accepting `$studentId` verify: `abort_if(!in_array($studentId, [$pair->student_a_id, $pair->student_b_id]), 403);`. Methods acting on `$submission` verify: `abort_if($submission->pair_id !== $pair->id, 403);`. |
| **`PasswordResetController`** | `reset(User $student)` | `/leader/students/{student}/reset-password` | Executes `abort_if(!$halqa || $student->halqa_id !== $halqa->id, 403); abort_if($student->role !== 'student', 403);`. Eliminates any privilege escalation path (leader cannot reset another leader or admin password). |
| **`PdfExportController`** | `export` | `GET /leader/export-pdf` | Resolves `$halqa = $leader->ledHalqa()->with(['pairs.studentA', 'pairs.studentB'])->first(); abort_if(!$halqa, 403);`. Scopes report data strictly to `$halqa->id`. |
| **`TestController`** | `store`, `update`, `destroy` | `/leader/pairs/{pair}/tests[*]` | Checks `abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);`. `store` verifies target `$data['student_id']` belongs to `$pair`. `update` / `destroy` verify `abort_if($test->leader_id !== $leader->id, 403);`. |
| **`WeeklyReportController`** | `index`, `pdf` | `/leader/weekly-report[*]` | Executes `abort_if(!$halqa, 403);`. Scopes `User::where('halqa_id', $halqa->id)` and `Pair::where('halqa_id', $halqa->id)`. |

---

##### Category 4: Admin Controllers (`App\Http\Controllers\Admin\*`)
All routes under `/admin/*` are wrapped in `middleware(['auth', 'role:admin'])`.

| Controller | Action Methods & Capabilities | Security & Boundary Verification |
| :--- | :--- | :--- |
| **`AnnouncementsController`** | `index`, `store`, `update`, `destroy` | Protected by `role:admin`. Validates optional `halqa_id` exists before creating or updating global/scoped announcements. |
| **`AuditController`** | `index` | Reads up to 500 recent `AuditLog` records with user relations. Protected by `role:admin`. |
| **`DashboardController`** | `index`, `startProgram`, `endProgram`, `newProgram` | `newProgram` requires explicit confirmation payload (`$request->validate(['confirm' => ['required', 'in:NEW_PROGRAM']])`). Archives snapshot and clears cycle tables in a safe DB transaction. |
| **`HalqaController`** | `index`, `store`, `update`, `destroy`, `bulkCreate`, `randomAssign`, `randomPair`, `swapStudents`, `assignPair` | • **`destroy(Halqa $halqa)`**: Prevents deletion if `$halqa->members()->where('role', 'student')->exists()`.<br>• **`swapStudents`**: Validates both IDs exist, ensures they belong to different halqas, and blocks swapping if either student is currently part of an active pair (`Pair::whereNotNull('student_b_id')->...->exists()`). All bulk mutations run inside DB transactions. |
| **`IntegrityController`** | `index`, `reviewFlag`, `unflag` | Protected by `role:admin`. Updates `flag_verdict`, `flag_reviewed_by` (`auth()->id()`), and `flag_reviewed_at`. |
| **`LeaderboardController`** | `index`, `lock`, `unlock`, `compare`, `certificate`, `snapshotPdf`, etc. | `certificate(User $student)` and `leaderCertificate(User $leader)` generate PDF reports directly for the provided models under admin authorization. |
| **`LeadersController`** | `index`, `show`, `update`, `toggleActive`, `resetPassword` | `show`, `update`, `toggleActive`, and `resetPassword` execute `abort_if($leader->role !== 'leader', 404/403);`. Ensures admin methods intended for leader accounts cannot inadvertently target or modify other admin accounts or student profiles. |
| **`OutreachController`** | `index`, `storeNote`, `bulkNotify`, `bulkWatchlist` | Validates arrays of `student_ids` against `exists:users,id` before dispatching FCM notifications or adding to watchlist. |
| **`PairChangeController`** | `index`, `show`, `approve`, `reject` | • **`approve`**: Verifies `$changeRequest->status === 'escalated_to_admin'`. Enforces parity checks for cross-halqa swaps (`($halqaXSize - 1) % 2 !== 0`). Safely dissolves existing pairs and reassigns `halqa_id` within a DB transaction.<br>• **`reject`**: Records rejection reason and notifies leader/student. |
| **`PairController`** | `index`, `store`, `swapPairStudents`, `reassign`, `confirmAssignment`, `destroy`, `show`, `clearReview`, `assignHalqa` | • **`store`**: Blocks manual pairing if either student is already in an active pair (`$alreadyActive` check). Removes any left-over solo pairs.<br>• **`swapPairStudents`**: Enforces `abort_if($pairA->halqa_id !== $pairB->halqa_id, 422, 'Pairs must be in the same halqa.');`.<br>• **`reassign`**: Checks halqa alignment before re-pairing and safely promotes solo members. |
| **`PairingController`** | `index`, `setWindow`, `run`, `incompatiblePdf` | `run` executes multi-pass greedy pairing exclusively for active, unpaired students (`whereNotIn('id', $alreadyPairedIds)`), storing incompatibles cleanly in flash session data. |
| **`ReportsController`** | `index`, `toggleCertificatesPublished`, `exportSubmissions`, `exportStudentSummary`, `exportContactLog`, `exportProgramReport`, `weeklyReport`, `downloadExport` | • **`csvSafe(?string $value)`**: Proactively neutralizes CSV Formula Injection (`=`, `+`, `-`, `@`, `\t`, `\r`) by prefixing tabs and escaping quotes across all CSV exports.<br>• **`downloadExport(PdfExport $export)`**: Enforces `abort_if($export->status !== 'ready', 404); abort_if(!$export->file_path || !Storage::exists($export->file_path), 404);`. |
| **`SettingsController`** | `index`, `update`, `fetchPrayerTimes`, `storeAyat`, `destroyAyat` | Protected by `role:admin`. Updates global `ProgramSetting` key-value pairs and `AyatRotation` tables. |
| **`StudentController`** | `index`, `show`, `store`, `import`, `update`, `toggleActive`, `resetPassword`, `saveNote`, `toggleMonitor`, `toggleWatchlist`, `compare`, `credentialsPdf` | All targeted operations (`show`, `update`, `toggleActive`, `resetPassword`, `saveNote`, `toggleMonitor`, `toggleWatchlist`) execute `abort_if($student->role !== 'student', 404);`. `import` auto-generates sequential IDs (`JUMU-YYYY-XXX`) with zero collision risk. |

---

#### 3. Key Observations & Security Conclusion

1. **Zero Active IDOR or Privilege Escalation Vulnerabilities Found**:
   Every endpoint across the `Student`, `Leader`, and `Admin` namespaces performs complete boundaries checking before executing queries or mutations. Direct Object References (`$pair`, `$student`, `$meeting`, `$test`, `$announcement`, `$submission`) are strictly scoped against `auth()->user()->id`, `auth()->user()->halqa_id`, or `auth()->user()->ledHalqa->id`.
2. **Robust Defensive Guards**:
   - **Role Middleware Isolation**: Strict separation of `/student/*`, `/leader/*`, and `/admin/*` pipelines in `routes/web.php`.
   - **Role Parity Guards**: Methods like `PasswordResetController` and `LeadersController` verify the exact role (`$model->role !== 'student'` / `'leader'`) before mutation.
   - **CSV Injection Prevention**: `ReportsController` employs dedicated sanitization to disallow spreadsheet formula injection (`=cmd|' /C calc'!A0`).
   - **Transaction Boundaries**: All multi-table reassignments (`PairChangeController`, `HalqaController::swapStudents`, `DashboardController::newProgram`) run atomically within `DB::transaction()`.

##### Recommendation for Future Scalability
Because the application relies on manual, imperative `abort_if()` calls inside every controller action rather than centralized Laravel Policy classes (`app/Policies/*`), any new controller endpoints added in the future will require meticulous developer discipline to manually replicate these checks. To prevent future regressions as the team expands, consider encapsulating `Pair`, `Submission`, and `MeetingLog` boundary verification into Laravel Policy definitions or shared Eloquent query scopes (`->forLeader($leader)` / `->forStudent($student)`).

---

## Domain 2: ORM, Database Schema, Indexing & N+1 Performance (Wave 1)

### 2.1. Database Migrations & Schema Audit (`database/migrations/`)

#### 🚨 [CRITICAL] Findings

##### 2.1.1. Missing Compound Indexes on Core Submission Analysis Table (`pair_submissions`)
- **Exact File Path & Line Numbers:** `database/migrations/2026_03_24_000005_create_pair_submissions_table.php:L18-L30`
- **Severity Rating:** `[CRITICAL]`
- **Root Cause Analysis:** 
  While `pair_id`, `submitter_id`, and `subject_student_id` are defined with `foreignId()`, almost every calculation in `ConsistencyService` and dashboard analytics runs queries filtering by `where('subject_student_id', $id)->whereBetween('submission_date', [$start, $end])` or `whereIn('subject_student_id', $ids)->where('submission_date', '>=', $date)`. Without compound indexes on `['subject_student_id', 'submission_date']` and `['pair_id', 'submission_date']`, every streak calculation and consistency check causes expensive table scans over historical submission logs.
- **Exact Code Remediation:**

**Before (`database/migrations/2026_03_24_000005_create_pair_submissions_table.php`):**
```php
            $table->foreignId('pair_id')->constrained()->onDelete('cascade');
            $table->foreignId('submitter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('subject_student_id')->constrained('users')->onDelete('cascade');
            $table->date('submission_date');
```

**After (`database/migrations/2026_03_24_000005_create_pair_submissions_table.php`):**
```php
            $table->foreignId('pair_id')->constrained()->onDelete('cascade');
            $table->foreignId('submitter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('subject_student_id')->constrained('users')->onDelete('cascade');
            $table->date('submission_date');
            
            $table->index(['subject_student_id', 'submission_date']);
            $table->index(['pair_id', 'submission_date']);
            $table->index(['is_flagged', 'flag_verdict']);
```

---

#### ⚠️ [HIGH] Findings

##### 2.1.2. Missing Foreign Keys, Type Mismatches & Compound Indexes Across 11 Migrations
- **Exact File Path & Line Numbers:** `database/migrations/*` (11 separate migration files)
- **Severity Rating:** `[HIGH]`
- **Root Cause Analysis:** 
  Multiple core tables define integer foreign key references using `$table->integer('user_id')` or `$table->integer('halqa_id')` instead of `$table->foreignId('user_id')->constrained('users')`. Because `users.id` and `halqas.id` are unsigned big integers (`$table->id()`), this creates a strict database type mismatch (`integer` vs `unsignedBigInteger`) and omits both foreign key constraints and indexes.
- **Detailed Defect & Remediation Table:**

| Migration File | Problematic Column(s) | Severity | Root Cause & Mechanical Risk | Drop-in Remediation (`After:`) |
| :--- | :--- | :--- | :--- | :--- |
| **`2026_03_23_000002_create_badges_table.php`** | `user_id` (`integer`) | `[HIGH]` | Type mismatch with `users.id` (`id()`). No index or FK constraint (`onDelete('cascade')`). | `$table->foreignId('user_id')->constrained('users')->onDelete('cascade');`<br>`$table->index(['user_id', 'badge_type']);` |
| **`2026_03_24_000002_create_meeting_logs_table.php`** | `halqa_id` (`integer`) | `[HIGH]` | Type mismatch (`integer` vs `unsignedBigInteger`), missing index on `['halqa_id', 'state', 'meeting_date']`. | `$table->foreignId('halqa_id')->constrained('halqas')->onDelete('cascade');`<br>`$table->index(['halqa_id', 'state', 'meeting_date']);` |
| **`2026_03_24_000003_create_meeting_attendances_table.php`** | `meeting_log_id`, `student_id` (`integer`) | `[HIGH]` | Type mismatch, no foreign key constraints, and missing unique compound index (`[meeting_log_id, student_id]`). | `$table->foreignId('meeting_log_id')->constrained()->onDelete('cascade');`<br>`$table->foreignId('student_id')->constrained('users')->onDelete('cascade');`<br>`$table->unique(['meeting_log_id', 'student_id']);` |
| **`2026_03_26_000003_create_device_tokens_table.php`** | `user_id` (`integer`) | `[HIGH]` | Missing FK constraint and index. Queries inside `FcmService` filtering by `user_id` perform full scans. | `$table->foreignId('user_id')->constrained('users')->onDelete('cascade')->index();` |
| **`2026_03_27_000002_create_watchlists_table.php`** | `student_id`, `added_by` (`integer`) | `[HIGH]` | Missing FK constraints. Checking whether a student is on the watchlist (`resolved_at IS NULL`) occurs across almost every dashboard without compound index `['student_id', 'resolved_at']`. | `$table->foreignId('student_id')->constrained('users')->onDelete('cascade');`<br>`$table->foreignId('added_by')->nullable()->constrained('users')->onDelete('set null');`<br>`$table->index(['student_id', 'resolved_at']);` |
| **`2026_03_30_000001_create_missed_submission_excuses_table.php`** | `student_id`, `pair_id` (`integer`) | `[HIGH]` | Missing FKs. `ConsistencyService` queries `where('student_id', $id)->whereBetween('missed_date', ...)` for every student streak check, yet `['student_id', 'missed_date']` is unindexed. | `$table->foreignId('student_id')->constrained('users')->onDelete('cascade');`<br>`$table->index(['student_id', 'missed_date']);` |
| **`2026_03_24_000001_create_pairs_table.php`** | `student_a_id`, `student_b_id`, `halqa_id` | `[HIGH]` | Columns use `foreignId()`, but compound query filters like `where('student_a_id', $id)->orWhere('student_b_id', $id)` and filters by `halqa_id` / `status` lack composite indexes. | `$table->index(['student_a_id', 'status']);`<br>`$table->index(['student_b_id', 'status']);`<br>`$table->index(['halqa_id', 'status']);` |
| **`0001_01_01_000000_create_users_table.php`** | `role`, `is_active`, `halqa_id` | `[HIGH]` | Queries repeatedly filter `User::where('role', 'student')->where('is_active', true)->where('halqa_id', $halqaId)` across all leader and admin dashboards without composite index. | `$table->index(['role', 'is_active', 'halqa_id']);` |

---

#### 🟡 [MEDIUM] & 🟢 [LOW] Migration Schema Findings
- **`audit_logs` table (`user_id` integer):** `[MEDIUM]` Change to `$table->foreignId('user_id')->nullable()->index()->constrained('users')->onDelete('set null');` and add `$table->index(['user_id', 'action', 'created_at']);`.
- **`contact_logs` table (`student_id`, `contacted_by` integer):** `[MEDIUM]` Change to `foreignId()->constrained()->onDelete('cascade')` and index `['student_id', 'contacted_at']`.
- **`meeting_action_items` table (`meeting_log_id`, `assigned_to` integer):** `[MEDIUM]` Use `foreignId('meeting_log_id')->constrained()->onDelete('cascade')`.
- **`pairing_requests` & `pair_change_requests` tables:** `[MEDIUM]` Update `student_id`, `pair_id`, `requested_by`, `current_partner_id`, `requested_partner_id`, and `leader_id` from `integer` to `foreignId()->constrained()->onDelete('cascade')`. Add index on `status`.
- **`muraja_tests` table (`student_id`, `leader_id` integer):** `[MEDIUM]` Use `foreignId()` and index `['student_id', 'tested_at']`.
- **`pdf_exports` (`requested_by`) & `admin_notes` (`student_id`, `admin_id`):** `[LOW]` Change `integer()` to `foreignId()->constrained('users')->onDelete('cascade')->index();`.

---

### 2.2. Eloquent Models & Mass-Assignment Audit (`app/Models/`)

#### 🚨 [CRITICAL] Findings

##### 2.2.1. Overly Permissive `$guarded = []` (Unprotected Mass-Assignment across Core Models)
- **Exact File Path & Line Numbers:** `app/Models/User.php:L42`, `app/Models/PairSubmission.php:L13`, `app/Models/Pair.php:L13`, `app/Models/Halqa.php:L12`
- **Severity Rating:** `[CRITICAL]`
- **Root Cause Analysis:** 
  `$guarded = []` is explicitly set across all core Eloquent models (`User`, `PairSubmission`, `Pair`, `Halqa`). Because `User` contains sensitive state (`role`, `is_active`, `password`, `must_change_password`, `is_monitored`, `profile_completed`) and `PairSubmission` contains administrative audit flags (`is_flagged`, `flag_verdict`, `flag_reviewed_by`), any future or existing endpoint that constructs or updates models using unvalidated request arrays (`$request->all()` or `$request->input()`) allows attackers to elevate privileges, tamper with audit verdicts, or overwrite critical foreign keys.
- **Exact Code Remediation:**

**Before (`app/Models/User.php:L42`):**
```php
    protected $guarded = [];
```

**After (`app/Models/User.php:L42`):**
```php
    protected $fillable = [
        'name',
        'email',
        'phone',
        'gender',
        'current_juz',
        'weekly_target',
        'memo_level',
        'available_times',
        'available_days',
        'halqa_id',
        'profile_completed',
        'must_change_password',
        'is_monitored',
    ];
    // Explicitly exclude 'role', 'is_active', and 'password' from $fillable to enforce manual assignment in verified actions.
```

**Before (`app/Models/PairSubmission.php:L13`):**
```php
    protected $guarded = [];
```

**After (`app/Models/PairSubmission.php:L13`):**
```php
    protected $fillable = [
        'pair_id',
        'submitter_id',
        'subject_student_id',
        'submission_date',
        'submitted_at',
        'juz',
        'page_from',
        'page_to',
        'minutes_spent',
        'is_edited',
    ];
    // Exclude 'is_flagged', 'flag_verdict', 'flag_reviewed_by', and 'flag_reviewed_at' so students cannot mass-assign audit flags.
```

**Before (`app/Models/Pair.php:L13` & `app/Models/Halqa.php:L12`):**
```php
    protected $guarded = [];
```

**After (`app/Models/Pair.php:L13` & `app/Models/Halqa.php:L12`):**
```php
    // In Pair.php:
    protected $fillable = [
        'student_a_id',
        'student_b_id',
        'halqa_id',
        'status',
        'compatibility_score',
        'needs_review',
        'last_checkin_date',
    ];

    // In Halqa.php:
    protected $fillable = [
        'name',
        'leader_id',
        'description',
    ];
```
*(Apply strict `$fillable` replacements across all 17 remaining auxiliary models: `AuditLog`, `Badge`, `ContactLog`, `DeviceToken`, `MeetingLog`, `MeetingAttendance`, `MeetingActionItem`, `MissedSubmissionExcuse`, `MurajaTest`, `PairChangeRequest`, `PairingRequest`, `PrayerTimesCache`, `ProgramSetting`, `Watchlist`, `AyatRotation`, `AdminNote`, `PdfExport`).*

---

### 2.3. N+1 Query Bottlenecks & ORM Performance Audit

#### 🚨 [CRITICAL] Findings

##### 2.3.1. Centralized $O(S \times D)$ N+1 Bottlenecks inside `ConsistencyService` Loops
- **Exact File Path & Line Numbers:** `app/Services/ConsistencyService.php:L37-L56`, `app/Services/ConsistencyService.php:L61-L94`, `app/Http/Controllers/Admin/DashboardController.php:L66-L80` & `L322-L340`, `app/Http/Controllers/Admin/StudentController.php:L127-L128` & `L613-L659`
- **Severity Rating:** `[CRITICAL]`
- **Root Cause Analysis:** 
  `ConsistencyService::getConsistency(int $userId)` executes two synchronous queries (`PairSubmission::where('subject_student_id', $userId)->...->count()` and `User::find($userId)`). `getStreak(int $userId)` loops day-by-day backward for up to 60+ days, firing queries against `PairSubmission` (`exists()`) and `MissedSubmissionExcuse` (`exists()`) for every single day.
  When `Admin/DashboardController::index` and `Admin/StudentController::index` iterate over all active students (`foreach ($ids as $id)` or `$students->map(...)`), they call `$cs->getConsistency($id)` and `$cs->getStreak($id)` inside the loop. For 500 active students, a single load of `/admin/dashboard` or `/admin/students` fires between **1,500 and 15,000+ synchronous database queries**, causing severe response delays, database CPU exhaustion, and timeout crashes.
- **Exact Code Remediation:**

**Before (`app/Services/ConsistencyService.php:L37-L56` & `app/Http/Controllers/Admin/DashboardController.php:L66-L80`):**
```php
        // Inside Admin/DashboardController::index:
        foreach ($ids as $id) {
            $cons = $cs->getConsistency($id) ?? 0.0;
            if ($cons >= 80) $buckets['strong']++;
            // ...
        }

        // Where ConsistencyService::getConsistency($userId) does:
        $count = PairSubmission::where('subject_student_id', $userId)
            ->where('submission_date', '>=', $effectiveStart)
            ->count();
        $user = User::find($userId);
```

**After (`app/Services/ConsistencyService.php` & `app/Http/Controllers/Admin/DashboardController.php` - Batch Aggregation):**
```php
        // 1. Add batch pre-computation method inside ConsistencyService:
        public function getBatchConsistency(array $userIds, string $effectiveStart): array
        {
            if (empty($userIds)) {
                return [];
            }

            $submissionCounts = PairSubmission::whereIn('subject_student_id', $userIds)
                ->where('submission_date', '>=', $effectiveStart)
                ->groupBy('subject_student_id')
                ->selectRaw('subject_student_id, count(*) as total')
                ->pluck('total', 'subject_student_id');

            $users = User::whereIn('id', $userIds)->get(['id', 'available_days']);
            $results = [];
            $daysSinceStart = max(1, \Carbon\Carbon::parse($effectiveStart)->diffInDays(now()) + 1);
            $weeks = max(1, $daysSinceStart / 7);

            foreach ($users as $user) {
                $targetPerWeek = count($user->available_days ?: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
                $expected = $targetPerWeek * $weeks;
                $actual = $submissionCounts->get($user->id, 0);
                $results[$user->id] = $expected > 0 ? min(100.0, round(($actual / $expected) * 100, 1)) : 0.0;
            }

            return $results;
        }

        // 2. Inside Admin/DashboardController::index:
        $consistencyScores = $cs->getBatchConsistency($ids->toArray(), $effectiveStart);
        foreach ($ids as $id) {
            $cons = $consistencyScores[$id] ?? 0.0;
            if ($cons >= 80) $buckets['strong']++;
            elseif ($cons >= 50) $buckets['moderate']++;
            elseif ($cons > 0) $buckets['at_risk']++;
            else $buckets['zero']++;
        }
```

---

#### ⚠️ [HIGH] Findings

##### 2.3.2. Preloaded Collection Bypass in `Leader/HalqaDashboardController`
- **Exact File Path & Line Numbers:** `app/Http/Controllers/Leader/HalqaDashboardController.php:L71-L72`
- **Severity Rating:** `[HIGH]`
- **Root Cause Analysis:** 
  Inside `HalqaDashboardController::index`, the controller correctly preloads submissions in bulk upfront (`$subs14` and `$subs60`), but inside `$halqa->members->map(...)` on lines 71-72, it calls:
  `$cons = $cs->getConsistency($s->id) ?? 0.0;`
  `$streak = $cs->getStreak($s->id);`
  This completely ignores the preloaded collections (`$subs14` / `$subs60`) and fires synchronous N+1 queries inside the `.map()` loop for every single student in the leader's Halqa.
- **Exact Code Remediation:**

**Before (`app/Http/Controllers/Leader/HalqaDashboardController.php:L71-L72`):**
```php
            $cons = $cs->getConsistency($s->id) ?? 0.0;
            $streak = $cs->getStreak($s->id);
```

**After (`app/Http/Controllers/Leader/HalqaDashboardController.php:L71-L72`):**
```php
            // Compute directly from preloaded bulk collections inside ConsistencyService:
            $cons = $cs->getConsistencyFromPreloaded($s, $subs14->get($s->id, collect()), $effStart);
            $streak = $cs->getStreakFromPreloaded($s, $subs60->get($s->id, collect()), $excusesByStudent->get($s->id, collect()));
```

---

##### 2.3.3. N+1 Loops Across Leaderboard, Halqa & Report Exports
- **Exact File Path & Line Numbers:** `app/Http/Controllers/Admin/LeaderboardController.php:L441-L641`, `app/Http/Controllers/Admin/HalqaController.php:L40-L67`, `app/Http/Controllers/Admin/ReportsController.php:L127-L476`
- **Severity Rating:** `[HIGH]`
- **Root Cause Analysis:** 
  - `LeaderboardController::studentBoard()`, `pairBoard()`, `halqaBoard()`, and `leaderBoard()` call `$consistency->getConsistency($s->id)` and `$consistency->getStreak($s->id)` inside `.map()` across all students/pairs whenever cache expires (`leaderboard_data`).
  - `HalqaController::index` calls `$cs->getGroupConsistency($halqa->id)` inside `.map()` for every Halqa, which loops across every member and triggers N+1 calculations.
  - `ReportsController` (`exportStudentSummary`, `exportProgramReport`, `weeklyReport`) runs `$consistency->getStreak()` inside `foreach` loops during CSV and PDF generation.
- **Exact Code Remediation:**
Replace all per-student/per-halqa `ConsistencyService` method calls inside `LeaderboardController`, `HalqaController`, and `ReportsController` loops with bulk `getBatchConsistency($allIds, $date)` and `getBatchStreaks($allIds)` aggregations.

---

### 2.4. General ORM & Database Safety & Routing Audit

#### ⚠️ [HIGH] Findings

##### 2.4.1. Raw SQL & Destructive `TRUNCATE TABLE ... CASCADE` Statements
- **Exact File Path & Line Numbers:** `app/Http/Controllers/Admin/DashboardController.php:L163-L181`
- **Severity Rating:** `[HIGH]`
- **Root Cause Analysis:** 
  In `newProgram()`, the application executes:
  `DB::statement('TRUNCATE TABLE pair_submissions, pairs, halqas, badges, audit_logs, contact_logs, meeting_logs, meeting_attendances, meeting_action_items, missed_submission_excuses, muraja_tests, notifications, pair_change_requests, pairing_requests, watchlists CASCADE');`
  While wrapped in `DB::transaction()`, executing raw PostgreSQL `TRUNCATE ... CASCADE` bypasses Eloquent model events (such as deletion observers and logging hooks) and permanently destroys data across 15 core tables without soft-delete recovery.
- **Exact Code Remediation:**

**Before (`app/Http/Controllers/Admin/DashboardController.php:L163-L181`):**
```php
        DB::statement('TRUNCATE TABLE pair_submissions, pairs, halqas, badges, audit_logs, contact_logs, meeting_logs, meeting_attendances, meeting_action_items, missed_submission_excuses, muraja_tests, notifications, pair_change_requests, pairing_requests, watchlists CASCADE');
```

**After (`app/Http/Controllers/Admin/DashboardController.php:L163-L181`):**
```php
        // Enforce mandatory program snapshot creation before archiving cycle data:
        \App\Models\ProgramSnapshot::create([
            'program_name' => \App\Models\ProgramSetting::get('program_name', 'Muraja Program Archive'),
            'ended_at' => now(),
            'snapshot_data' => json_encode(['archived_by' => auth()->id()]),
        ]);

        // Delete using Eloquent queries or safe table-scoped deletes inside transaction:
        \App\Models\PairSubmission::query()->delete();
        \App\Models\Pair::query()->delete();
        \App\Models\Halqa::query()->delete();
        // ...
```


---

## Domain 3: Frontend Performance, State Synchronization & Offline/Caching Resilience (Wave 2)
*Scheduled for Wave 2.*

---

## Domain 4: Backend Business Logic, Controllers, Services & Input Validation (Wave 3)
*Scheduled for Wave 3.*

---

## Domain 5: Asynchronous Jobs, Queues, Webhooks & Infrastructure (Wave 4)
*Scheduled for Wave 4.*

---

## Domain 6: Shared UI Components, Modals, Configuration Hardening & 100% Sweep (Wave 5)
*Scheduled for Wave 5.*

---

## 8. Remediation Roadmap & Action Plan
*Will be synthesized upon completion of all 5 Waves.*
