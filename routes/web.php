<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Student\BadgeController as StudentBadge;
use App\Http\Controllers\Student\CheckinController;
use App\Http\Controllers\Student\DashboardController as StudentDashboard;
use App\Http\Controllers\Student\HalqaController as StudentHalqa;
use App\Http\Controllers\Student\HistoryController;
use App\Http\Controllers\Student\JournalController;
use App\Http\Controllers\Student\NotificationController as StudentNotification;
use App\Http\Controllers\Student\PairController as StudentPair;
use App\Http\Controllers\Leader\HalqaDashboardController as LeaderDashboard;
use App\Http\Controllers\Leader\MeetingController as LeaderMeeting;
use App\Http\Controllers\Leader\OutreachController as LeaderOutreach;
use App\Http\Controllers\Leader\PairDetailController as LeaderPairDetail;
use App\Http\Controllers\Leader\PasswordResetController as LeaderPasswordReset;
use App\Http\Controllers\Leader\PdfExportController as LeaderPdfExport;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use Illuminate\Support\Facades\Route;

// ── Public: Auth ─────────────────────────────────────────────────────────────

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.attempt');

    Route::get('/leader/setup', [AuthController::class, 'showLeaderSetup'])->name('leader.setup');
    Route::post('/leader/setup', [AuthController::class, 'leaderSetup'])->name('leader.setup.submit');
});

// ── Authenticated: Change Password & Logout ───────────────────────────────────

Route::middleware('auth')->group(function () {
    Route::get('/change-password', [AuthController::class, 'showChangePassword'])->name('password.change');
    Route::post('/change-password', [AuthController::class, 'changePassword'])->name('password.change.update');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

// ── Student Routes ─────────────────────────────────────────────────────────────

Route::middleware(['auth', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/dashboard', [StudentDashboard::class, 'index'])->name('dashboard');
    Route::put('/settings/weekly-target', [StudentDashboard::class, 'updateWeeklyTarget'])->name('settings.weeklyTarget');

    Route::post('/checkin', [CheckinController::class, 'store'])->name('checkin.store');
    Route::put('/checkin/{submission}', [CheckinController::class, 'update'])->name('checkin.update');

    Route::get('/history', [HistoryController::class, 'index'])->name('history');
    Route::get('/pair', [StudentPair::class, 'show'])->name('pair');
    Route::get('/halqa', [StudentHalqa::class, 'show'])->name('halqa');

    Route::get('/badges', [StudentBadge::class, 'index'])->name('badges');

    Route::get('/journal', [JournalController::class, 'index'])->name('journal');
    Route::post('/journal', [JournalController::class, 'store'])->name('journal.store');

    Route::post('/notifications/{id}/read', [StudentNotification::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [StudentNotification::class, 'markAllRead'])->name('notifications.readAll');
});

// ── Leader Routes ──────────────────────────────────────────────────────────────

Route::middleware(['auth', 'role:leader'])->prefix('leader')->name('leader.')->group(function () {
    Route::get('/dashboard', [LeaderDashboard::class, 'index'])->name('dashboard');

    // Pair detail & actions
    Route::get('/members/{pair}',                                       [LeaderPairDetail::class, 'show'])->name('members.show');
    Route::post('/members/{pair}/contact',                              [LeaderPairDetail::class, 'addContact'])->name('members.contact');
    Route::put('/members/{pair}/note/{studentId}',                      [LeaderPairDetail::class, 'updatePrivateNote'])->name('members.note');
    Route::post('/members/{pair}/watchlist/{studentId}',                [LeaderPairDetail::class, 'toggleWatchlist'])->name('members.watchlist');
    Route::post('/members/{pair}/submissions/{submission}/flag',        [LeaderPairDetail::class, 'flagSubmission'])->name('members.submissions.flag');
    Route::post('/members/{pair}/submissions/{submission}/review',      [LeaderPairDetail::class, 'reviewSubmission'])->name('members.submissions.review');

    // Outreach
    Route::post('/outreach/followup/{pair}', [LeaderOutreach::class, 'markFollowedUp'])->name('outreach.followup');
    Route::post('/outreach/notify-all',      [LeaderOutreach::class, 'notifyAbsent'])->name('outreach.notifyAll');

    // Meetings
    Route::get('/meetings',              [LeaderMeeting::class, 'index'])->name('meetings');
    Route::post('/meetings',             [LeaderMeeting::class, 'store'])->name('meetings.store');
    Route::delete('/meetings/{meeting}', [LeaderMeeting::class, 'destroy'])->name('meetings.destroy');

    // Password reset
    Route::post('/students/{student}/reset-password', [LeaderPasswordReset::class, 'reset'])->name('students.resetPassword');

    // PDF export
    Route::get('/export/pdf', [LeaderPdfExport::class, 'export'])->name('export.pdf');
});

// ── Admin Routes ───────────────────────────────────────────────────────────────

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');
});

// ── Root Redirect ──────────────────────────────────────────────────────────────

Route::get('/', fn () => redirect()->route('login'));
