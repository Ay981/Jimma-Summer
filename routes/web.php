<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CertificateVerificationController;
use App\Http\Controllers\Student\ExcuseController as StudentExcuse;
use App\Http\Controllers\Student\AnnouncementController as StudentAnnouncements;
use App\Http\Controllers\Student\BadgeController as StudentBadge;
use App\Http\Controllers\Student\CheckinController;
use App\Http\Controllers\Student\DashboardController as StudentDashboard;
use App\Http\Controllers\Student\HalqaController as StudentHalqa;
use App\Http\Controllers\Student\HistoryController;
use App\Http\Controllers\Student\JournalController;
use App\Http\Controllers\Student\NotificationController as StudentNotification;
use App\Http\Controllers\Student\PairController as StudentPair;
use App\Http\Controllers\Student\PairRequestController as StudentPairRequest;
use App\Http\Controllers\Admin\PairingController as AdminPairing;
use App\Http\Controllers\Student\ProfileController as StudentProfile;
use App\Http\Controllers\Leader\AnnouncementController as LeaderAnnouncements;
use App\Http\Controllers\Leader\HalqaDashboardController as LeaderDashboard;
use App\Http\Controllers\Leader\BroadcastController as LeaderBroadcast;
use App\Http\Controllers\Leader\MeetingController as LeaderMeeting;
use App\Http\Controllers\Leader\OutreachController as LeaderOutreach;
use App\Http\Controllers\Leader\PairDetailController as LeaderPairDetail;
use App\Http\Controllers\Leader\TestController as LeaderTest;
use App\Http\Controllers\Leader\PasswordResetController as LeaderPasswordReset;
use App\Http\Controllers\Leader\PdfExportController as LeaderPdfExport;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Admin\StudentController as AdminStudent;
use App\Http\Controllers\Admin\HalqaController as AdminHalqa;
use App\Http\Controllers\Admin\PairController as AdminPair;
use App\Http\Controllers\Admin\LeaderboardController as AdminLeaderboard;
use App\Http\Controllers\Admin\OutreachController as AdminOutreach;
use App\Http\Controllers\Admin\LeadersController as AdminLeaders;
use App\Http\Controllers\Admin\IntegrityController as AdminIntegrity;
use App\Http\Controllers\Admin\AnnouncementsController as AdminAnnouncements;
use App\Http\Controllers\Admin\ReportsController as AdminReports;
use App\Http\Controllers\Admin\SettingsController as AdminSettings;
use App\Http\Controllers\Admin\AuditController as AdminAudit;
use App\Http\Controllers\Admin\PairChangeController as AdminPairChange;
use App\Http\Controllers\Leader\PairChangeController as LeaderPairChange;
use App\Http\Controllers\OnboardingController;
use Illuminate\Support\Facades\Route;

// ── Public: Auth ─────────────────────────────────────────────────────────────

Route::get("/verify/certificate/{code}", CertificateVerificationController::class)->name("certificate.verify");

Route::middleware("guest")->group(function () {
  Route::get("/login", [AuthController::class, "showLogin"])->name("login");
  Route::post("/login", [AuthController::class, "login"])
    ->middleware("throttle:10,1")
    ->name("login.attempt");

  Route::get("/leader/setup", [AuthController::class, "showLeaderSetup"])->name(
    "leader.setup",
  );
  Route::post("/leader/setup", [AuthController::class, "leaderSetup"])
    ->middleware("throttle:5,60")
    ->name("leader.setup.submit");
});

// ── Authenticated: Change Password & Logout ───────────────────────────────────

Route::middleware("auth")->group(function () {
  Route::post("/push/register", [\App\Http\Controllers\PushController::class, "register"])
    ->name("push.register");

  Route::get("/change-password", [
    AuthController::class,
    "showChangePassword",
  ])->name("password.change");
  Route::post("/change-password", [AuthController::class, "changePassword"])
    ->middleware("throttle:5,1")
    ->name("password.change.update");
  Route::post("/logout", [AuthController::class, "logout"])->name("logout");
});

// ── Student Routes ─────────────────────────────────────────────────────────────

Route::middleware(["auth", "role:student", "throttle:30,1"])
  ->prefix("student")
  ->name("student.")
  ->group(function () {
    // Profile completion — must come before the profile guard is applied
    Route::get("/profile/complete", [StudentProfile::class, "show"])->name(
      "profile.complete",
    );
    Route::post("/profile/complete", [StudentProfile::class, "store"])->name(
      "profile.complete.store",
    );

    // Everything else requires profile completion
    Route::middleware("profile.complete")->group(function () {
      Route::get("/dashboard", [StudentDashboard::class, "index"])->name(
        "dashboard",
      );

      Route::get("/profile", [StudentProfile::class, "edit"])->name("profile.edit");
      Route::put("/profile", [StudentProfile::class, "update"])->name("profile.update");
Route::put("/settings/weekly-target", [
        StudentDashboard::class,
        "updateWeeklyTarget",
      ])->name("settings.weeklyTarget");

      Route::get("/announcements", [
        StudentAnnouncements::class,
        "index",
      ])->name("announcements");

      Route::post("/checkin", [CheckinController::class, "store"])->name(
        "checkin.store",
      );
      Route::put("/checkin/{submission}", [
        CheckinController::class,
        "update",
      ])->name("checkin.update");
      Route::post("/excuse", [StudentExcuse::class, "store"])->name(
        "excuse.store",
      );

      Route::get("/history", [HistoryController::class, "index"])->name(
        "history",
      );
      Route::get("/pair", [StudentPair::class, "show"])->name("pair");
      Route::post("/pair-request", [StudentPairRequest::class, "store"])->name(
        "pair-request.store",
      );
      Route::delete("/pair-request", [
        StudentPairRequest::class,
        "destroy",
      ])->name("pair-request.destroy");
      Route::get("/halqa", [StudentHalqa::class, "show"])->name("halqa");

      Route::get("/badges", [StudentBadge::class, "index"])->name("badges");
      Route::get("/certificate/download", [StudentDashboard::class, "downloadCertificate"])->name("certificate.download");

      Route::get("/journal", [JournalController::class, "index"])->name(
        "journal",
      );
      Route::post("/journal", [JournalController::class, "store"])->name(
        "journal.store",
      );

      Route::post("/notifications/{id}/read", [
        StudentNotification::class,
        "markRead",
      ])->name("notifications.read");
      Route::post("/notifications/{id}/seen", [
        StudentNotification::class,
        "markSeen",
      ])->name("notifications.seen");
      Route::post("/notifications/read-all", [
        StudentNotification::class,
        "markAllRead",
      ])->name("notifications.readAll");

      // Onboarding guide PDF
      Route::get("/onboarding/guide", [
        OnboardingController::class,
        "downloadStudent",
      ])->name("onboarding.guide");
    });
  });

// ── Leader Routes ──────────────────────────────────────────────────────────────

Route::middleware(["auth", "role:leader"])
  ->prefix("leader")
  ->name("leader.")
  ->group(function () {
    Route::get("/dashboard", [LeaderDashboard::class, "index"])->name(
      "dashboard",
    );
    Route::get("/announcements", [LeaderAnnouncements::class, "index"])->name("announcements");
    Route::post("/announcements", [LeaderAnnouncements::class, "store"])->name("announcements.store");
    Route::delete("/announcements/{announcement}", [LeaderAnnouncements::class, "destroy"])->name("announcements.destroy");

    // Pair detail & actions
    Route::get("/members/{pair}", [LeaderPairDetail::class, "show"])->name(
      "members.show",
    );
    Route::post("/members/{pair}/contact", [
      LeaderPairDetail::class,
      "addContact",
    ])->name("members.contact");
    Route::put("/members/{pair}/note/{studentId}", [
      LeaderPairDetail::class,
      "updatePrivateNote",
    ])->name("members.note");
    Route::post("/members/{pair}/watchlist/{studentId}", [
      LeaderPairDetail::class,
      "toggleWatchlist",
    ])->name("members.watchlist");
    // Tests
    Route::post("/members/{pair}/tests", [LeaderTest::class, "store"])->name("members.tests.store");
    Route::put("/members/{pair}/tests/{test}", [LeaderTest::class, "update"])->name("members.tests.update");
    Route::delete("/members/{pair}/tests/{test}", [LeaderTest::class, "destroy"])->name("members.tests.destroy");

    Route::post("/members/{pair}/submissions/{submission}/flag", [
      LeaderPairDetail::class,
      "flagSubmission",
    ])->name("members.submissions.flag");
    Route::post("/members/{pair}/submissions/{submission}/review", [
      LeaderPairDetail::class,
      "reviewSubmission",
    ])->name("members.submissions.review");

    // Outreach
    Route::post("/outreach/followup/{pair}", [
      LeaderOutreach::class,
      "markFollowedUp",
    ])->name("outreach.followup");
    Route::post("/outreach/notify-all", [
      LeaderOutreach::class,
      "notifyAbsent",
    ])->name("outreach.notifyAll");

    // Meetings
    Route::get("/meetings", [LeaderMeeting::class, "index"])->name("meetings");
    Route::post("/meetings", [LeaderMeeting::class, "store"])->name(
      "meetings.store",
    );
    Route::put("/meetings/{meeting}", [LeaderMeeting::class, "update"])->name(
      "meetings.update",
    );
    Route::delete("/meetings/{meeting}", [
      LeaderMeeting::class,
      "destroy",
    ])->name("meetings.destroy");
    Route::post("/meetings/actions/{actionItem}/resolve", [
      LeaderMeeting::class,
      "resolveAction",
    ])->name("meetings.actions.resolve");

    // Password reset (returns temp password in flash)
    Route::post("/students/{student}/reset-password", [
      LeaderPasswordReset::class,
      "reset",
    ])->name("students.resetPassword");

    // Broadcast / nudge / escalate
    Route::post("/broadcast", [LeaderBroadcast::class, "broadcast"])->name(
      "broadcast",
    );
    Route::post("/nudge/{studentId}", [LeaderBroadcast::class, "nudge"])->name(
      "nudge",
    );
    Route::post("/escalate/{studentId}", [
      LeaderBroadcast::class,
      "escalate",
    ])->name("escalate");

    // PDF export
    Route::get("/export/pdf", [LeaderPdfExport::class, "export"])->name(
      "export.pdf",
    );
    Route::get("/certificate/download", [LeaderDashboard::class, "downloadMyCertificate"])->name("leader.certificate.download");
    Route::get("/certificates/{student}/download", [LeaderDashboard::class, "downloadStudentCertificate"])->name("leader.student.certificate.download");
    // Weekly report
    Route::get("/weekly-report", [
      App\Http\Controllers\Leader\WeeklyReportController::class,
      "index",
    ])->name("weekly-report");
    Route::get("/weekly-report/pdf", [
      App\Http\Controllers\Leader\WeeklyReportController::class,
      "pdf",
    ])->name("weekly-report.pdf");

    // Pair change requests
    Route::post("/members/{pair}/pair-change", [
      LeaderPairChange::class,
      "store",
    ])->name("pair-change.store");
    Route::get("/pair-change-requests", [
      LeaderPairChange::class,
      "index",
    ])->name("pair-change.index");

    // Onboarding guide PDF
    Route::get("/onboarding/guide", [
      OnboardingController::class,
      "downloadLeader",
    ])->name("onboarding.guide");
  });

// ── Admin Routes ───────────────────────────────────────────────────────────────

Route::middleware(["auth", "role:admin"])
  ->prefix("admin")
  ->name("admin.")
  ->group(function () {
    Route::get("/dashboard", [AdminDashboard::class, "index"])->name(
      "dashboard",
    );
    Route::post("/program/start", [
      AdminDashboard::class,
      "startProgram",
    ])->name("program.start");
    Route::post("/program/end", [AdminDashboard::class, "endProgram"])->name(
      "program.end",
    );
    Route::post("/program/new", [AdminDashboard::class, "newProgram"])->name(
      "program.new",
    );

    // Students
    Route::get("/students", [AdminStudent::class, "index"])->name("students");
    Route::get("/students/credentials-pdf", [
      AdminStudent::class,
      "credentialsPdf",
    ])->name("students.credentialsPdf");
    Route::get("/students/compare", [AdminStudent::class, "compare"])->name(
      "students.compare",
    );
    Route::get("/students/{student}", [AdminStudent::class, "show"])->name(
      "students.show",
    );
    Route::post("/students", [AdminStudent::class, "store"])->name(
      "students.store",
    );
    Route::post("/students/import", [AdminStudent::class, "import"])->name(
      "students.import",
    );
    Route::put("/students/{student}", [AdminStudent::class, "update"])->name(
      "students.update",
    );
    Route::post("/students/{student}/toggle-active", [
      AdminStudent::class,
      "toggleActive",
    ])->name("students.toggleActive");
    Route::post("/students/{student}/reset-password", [
      AdminStudent::class,
      "resetPassword",
    ])->name("students.resetPassword");
    Route::post("/students/{student}/note", [
      AdminStudent::class,
      "saveNote",
    ])->name("students.note");
    Route::post("/students/{student}/toggle-monitor", [
      AdminStudent::class,
      "toggleMonitor",
    ])->name("students.toggleMonitor");
    Route::post("/students/{student}/toggle-watchlist", [
      AdminStudent::class,
      "toggleWatchlist",
    ])->name("students.toggleWatchlist");

    // Halqas
    Route::get("/halqas", [AdminHalqa::class, "index"])->name("halqas");
    Route::get("/halqas/{halqa}/dashboard", [
      AdminHalqa::class,
      "dashboard",
    ])->name("halqas.dashboard");
    Route::get("/halqas/{halqa}/members/{pair}", [
      AdminHalqa::class,
      "memberShow",
    ])->name("halqas.members.show");
    Route::post("/halqas", [AdminHalqa::class, "store"])->name("halqas.store");
    Route::post("/halqas/bulk-create", [AdminHalqa::class, "bulkCreate"])->name(
      "halqas.bulkCreate",
    );
    Route::post("/halqas/random-assign", [
      AdminHalqa::class,
      "randomAssign",
    ])->name("halqas.randomAssign");
    Route::post("/halqas/swap-students", [
      AdminHalqa::class,
      "swapStudents",
    ])->name("halqas.swapStudents");
    Route::put("/halqas/{halqa}", [AdminHalqa::class, "update"])->name(
      "halqas.update",
    );
    Route::delete("/halqas/{halqa}", [AdminHalqa::class, "destroy"])->name(
      "halqas.destroy",
    );
    Route::post("/halqas/{halqa}/assign-pair", [
      AdminHalqa::class,
      "assignPair",
    ])->name("halqas.assignPair");
    Route::post("/halqas/{halqa}/random-pair", [
      AdminHalqa::class,
      "randomPair",
    ])->name("halqas.randomPair");

    // Pairs
    Route::get("/pairs", [AdminPair::class, "index"])->name("pairs");
    Route::post("/pairs", [AdminPair::class, "store"])->name("pairs.store");
    Route::post("/pairs/confirm-assignment", [
      AdminPair::class,
      "confirmAssignment",
    ])->name("pairs.confirmAssignment");
    Route::post("/pairs/swap-students", [
      AdminPair::class,
      "swapPairStudents",
    ])->name("pairs.swapStudents");
    Route::post("/pairs/cross-halqa", [
      AdminPair::class,
      "crossHalqaPair",
    ])->name("pairs.crossHalqa");
    Route::delete("/pairs/{pair}", [AdminPair::class, "destroy"])->name(
      "pairs.destroy",
    );
    Route::put("/pairs/{pair}/halqa", [AdminPair::class, "assignHalqa"])->name(
      "pairs.assignHalqa",
    );
    Route::post("/pairs/reassign", [AdminPair::class, "reassign"])->name(
      "pairs.reassign",
    );
    Route::get("/pairs/{pair}", [AdminPair::class, "show"])->name("pairs.show");
    Route::post("/pairs/{pair}/clear-review", [
      AdminPair::class,
      "clearReview",
    ])->name("pairs.clearReview");

    // Pair change requests
    Route::get("/pair-changes", [AdminPairChange::class, "index"])->name(
      "pair-changes.index",
    );
    Route::get("/pair-changes/{changeRequest}", [
      AdminPairChange::class,
      "show",
    ])->name("pair-changes.show");
    Route::post("/pair-changes/{changeRequest}/approve", [
      AdminPairChange::class,
      "approve",
    ])->name("pair-changes.approve");
    Route::post("/pair-changes/{changeRequest}/reject", [
      AdminPairChange::class,
      "reject",
    ])->name("pair-changes.reject");

    // Leaderboard
    Route::get("/leaderboard", [AdminLeaderboard::class, "index"])->name(
      "leaderboard",
    );
    Route::post("/leaderboard/lock", [AdminLeaderboard::class, "lock"])->name(
      "leaderboard.lock",
    );
    Route::post("/leaderboard/unlock", [
      AdminLeaderboard::class,
      "unlock",
    ])->name("leaderboard.unlock");
    Route::get("/leaderboard/certificate/{student}", [
      AdminLeaderboard::class,
      "certificate",
    ])->name("leaderboard.certificate");
    Route::get("/leaderboard/leader-certificate/{leader}", [
      AdminLeaderboard::class,
      "leaderCertificate",
    ])->name("leaderboard.leader.certificate");
    Route::get("/leaderboard/halqa-certificate/{halqa}", [
      AdminLeaderboard::class,
      "halqaCertificate",
    ])->name("leaderboard.halqa.certificate");
    Route::get("/leaderboard/snapshots/compare", [
      AdminLeaderboard::class,
      "compare",
    ])->name("leaderboard.compare");
    Route::get("/leaderboard/snapshots/{snapshot}/pdf", [
      AdminLeaderboard::class,
      "snapshotPdf",
    ])->name("leaderboard.snapshot.pdf");
    Route::get("/leaderboard/pdf", [
      AdminReports::class,
      "exportProgramReport",
    ])->name("leaderboard.pdf");

    // Outreach
    Route::get("/outreach", [AdminOutreach::class, "index"])->name("outreach");
    Route::post("/outreach/note", [AdminOutreach::class, "storeNote"])->name(
      "outreach.note",
    );
    Route::post("/outreach/bulk-notify", [
      AdminOutreach::class,
      "bulkNotify",
    ])->name("outreach.bulkNotify");
    Route::post("/outreach/bulk-watchlist", [
      AdminOutreach::class,
      "bulkWatchlist",
    ])->name("outreach.bulkWatchlist");

    // Pairing management
    Route::get("/pairing", [AdminPairing::class, "index"])->name("pairing");
    Route::post("/pairing/window", [AdminPairing::class, "setWindow"])->name(
      "pairing.window",
    );
    Route::post("/pairing/run", [AdminPairing::class, "run"])->name(
      "pairing.run",
    );
    Route::get("/pairing/incompatible-pdf", [
      AdminPairing::class,
      "incompatiblePdf",
    ])->name("pairing.incompatiblePdf");

    // Leaders
    Route::get("/leaders", [AdminLeaders::class, "index"])->name("leaders");
    Route::get("/leaders/{leader}", [AdminLeaders::class, "show"])->name(
      "leaders.show",
    );
    Route::put("/leaders/{leader}", [AdminLeaders::class, "update"])->name(
      "leaders.update",
    );
    Route::post("/leaders/{leader}/reset-password", [
      AdminLeaders::class,
      "resetPassword",
    ])->name("leaders.resetPassword");
    Route::post("/leaders/{leader}/toggle-active", [
      AdminLeaders::class,
      "toggleActive",
    ])->name("leaders.toggleActive");

    // Integrity
    Route::get("/integrity", [AdminIntegrity::class, "index"])->name(
      "integrity",
    );
    Route::post("/integrity/{submission}/review", [
      AdminIntegrity::class,
      "reviewFlag",
    ])->name("integrity.review");
    Route::post("/integrity/{submission}/unflag", [
      AdminIntegrity::class,
      "unflag",
    ])->name("integrity.unflag");

    // Announcements
    Route::get("/announcements", [AdminAnnouncements::class, "index"])->name(
      "announcements",
    );
    Route::post("/announcements", [AdminAnnouncements::class, "store"])->name(
      "announcements.store",
    );
    Route::put("/announcements/{announcement}", [
      AdminAnnouncements::class,
      "update",
    ])->name("announcements.update");
    Route::delete("/announcements/{announcement}", [
      AdminAnnouncements::class,
      "destroy",
    ])->name("announcements.destroy");

    // Reports
    Route::get("/reports", [AdminReports::class, "index"])->name("reports");
    Route::get("/reports/weekly", [AdminReports::class, "weeklyReport"])->name(
      "reports.weekly",
    );
    Route::get("/reports/weekly/pdf", [
      AdminReports::class,
      "weeklyReportPdf",
    ])->name("reports.weekly.pdf");
    Route::get("/reports/submissions", [
      AdminReports::class,
      "exportSubmissions",
    ])->name("reports.submissions");
    Route::get("/reports/student-summary", [
      AdminReports::class,
      "exportStudentSummary",
    ])->name("reports.studentSummary");
    Route::get("/reports/contact-log", [
      AdminReports::class,
      "exportContactLog",
    ])->name("reports.contactLog");
    Route::get("/reports/certificates", [
      AdminReports::class,
      "exportCertificatesZip",
    ])->name("reports.certificates");
    Route::post("/reports/certificates/publish", [AdminReports::class, "toggleCertificatesPublished"])->name("reports.certificates.publish");
    Route::get("/reports/exports/{export}/download", [
      AdminReports::class,
      "downloadExport",
    ])->name("reports.exports.download");
    Route::get("/reports/program-report", [
      AdminReports::class,
      "exportProgramReport",
    ])->name("reports.programReport");

    // Settings
    Route::get("/settings", [AdminSettings::class, "index"])->name("settings");
    Route::put("/settings", [AdminSettings::class, "update"])->name(
      "settings.update",
    );
    Route::post("/settings/prayer-times", [
      AdminSettings::class,
      "fetchPrayerTimes",
    ])->name("settings.prayerTimes");
    Route::post("/settings/ayat", [AdminSettings::class, "storeAyat"])->name(
      "settings.ayat.store",
    );
    Route::delete("/settings/ayat/{ayat}", [
      AdminSettings::class,
      "destroyAyat",
    ])->name("settings.ayat.destroy");

    // Audit
    Route::get("/audit", [AdminAudit::class, "index"])->name("audit");

    // Onboarding screenshot recapture
    Route::post("/onboarding/recapture", [
      OnboardingController::class,
      "recapture",
    ])->name("onboarding.recapture");
  });

// ── Root Redirect ──────────────────────────────────────────────────────────────

Route::get("/", fn() => redirect()->route("login"));
