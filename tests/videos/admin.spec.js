/**
 * VIDEO: Admin Walkthrough
 *
 * Admin: ADMIN001 / Muraja@1446
 *
 * Flows:
 *   Login → Dashboard → Students (list + detail + import) →
 *   Halqas (create + assign) → Pairing (window + run) →
 *   Pairs (list + detail) → Leaders → Leaderboard →
 *   Pair Change Requests → Announcements → Integrity →
 *   Reports → Settings → Audit Log
 *
 * Run: npx playwright test tests/videos/admin.spec.js --headed
 */

import { test } from '@playwright/test';
import {
  injectCursor, caption, hideCaption,
  moveThenClick, liveType, pause,
} from './helpers.js';

const ADMIN = { id: 'ADMIN001', pw: 'Muraja@1446' };

// ── student data used across demo ─────────────────────────────────────────
const DEMO_STUDENT_ID = 'JUMU-2026-101';  // Sitra Kemeru — halqa 27
const DEMO_PAIR_ID    = 46;                // Fatima Ahmed + Mariam Hassan — halqa 27
const DEMO_LEADER_ID  = 'LDR-0001';

async function adminLogin(page) {
  await page.goto('/login');
  await injectCursor(page);
  await caption(page, 'Logging in as System Admin — ADMIN001', 2800);
  await liveType(page, 'input[name="student_id"], input[name="login_id"], #student_id, #login_id', ADMIN.id);
  await pause(page, 400);
  await liveType(page, 'input[type="password"]', ADMIN.pw);
  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);
}

// ════════════════════════════════════════════════════════════════════════════
test('Admin full walkthrough', async ({ page }) => {

  // ── 1. Login ──────────────────────────────────────────────────────────────
  await adminLogin(page);
  await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  await injectCursor(page);

  // ── 2. Dashboard ──────────────────────────────────────────────────────────
  await caption(page, 'STEP 1 — Admin Dashboard: live pulse of the entire Muraja\'a program', 3200);
  await pause(page, 2000);
  await caption(page, 'Key metrics: total students, active pairs, today\'s submissions, consistency trends', 3200);
  await pause(page, 2000);
  await caption(page, 'Program controls (Start / End / New Program) are accessible from the top of this page', 3200);
  await pause(page, 2000);

  // ── 3. Students list ──────────────────────────────────────────────────────
  await caption(page, 'STEP 2 — Students: full directory of all enrolled students', 3000);
  await moveThenClick(page, 'a[href*="/admin/students"]');
  await page.waitForURL('**/admin/students', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Search, filter by status, and perform quick actions on any student from this table', 3200);
  await pause(page, 2000);

  // ── 4. Student Detail ─────────────────────────────────────────────────────
  await caption(page, `STEP 3 — Opening student detail for ${DEMO_STUDENT_ID} (Sitra Kemeru)`, 3000);
  const studentDetailLink = page.locator(
    `a[href*="/admin/students/"][href*="${DEMO_STUDENT_ID}"], a:has-text("${DEMO_STUDENT_ID}"), td:has-text("${DEMO_STUDENT_ID}") a`
  ).first();
  if (await studentDetailLink.count() > 0) {
    await moveThenClick(page, `a[href*="/admin/students/"][href*="${DEMO_STUDENT_ID}"], a:has-text("${DEMO_STUDENT_ID}")`);
  } else {
    // Find by text and click the row link
    const row = page.locator(`tr:has-text("${DEMO_STUDENT_ID}") a`).first();
    if (await row.count() > 0) {
      await moveThenClick(page, `tr:has-text("${DEMO_STUDENT_ID}") a`);
    } else {
      await page.goto('/admin/students');
      await page.waitForTimeout(1000);
      // Try clicking first student link
      await page.locator('table tbody tr a').first().click();
    }
  }
  await page.waitForTimeout(2000);
  await injectCursor(page);

  await caption(page, 'Student detail shows submission timeline, contact logs, and admin notes', 3200);
  await pause(page, 2000);
  await caption(page, 'You can toggle monitoring, add to watchlist, reset password, or add a note from here', 3200);
  await pause(page, 2000);

  // ── 5. Admin note on student ──────────────────────────────────────────────
  await caption(page, 'STEP 4 — Add an admin note on this student', 3000);
  const adminNoteInput = page.locator('textarea[name="note"], textarea[name="admin_note"]').first();
  if (await adminNoteInput.count() > 0) {
    await adminNoteInput.click();
    await adminNoteInput.pressSequentially(
      'Student has not completed profile yet. Follow up by end of week to ensure onboarding is done.',
      { delay: 50 }
    );
    await pause(page, 600);
    await moveThenClick(page, 'button:has-text("Note"), button:has-text("Save"), button[type="submit"]');
    await page.waitForTimeout(1500);
    await caption(page, 'Note saved with timestamp — appears in the contact log and audit trail.', 3200);
  }
  await pause(page, 1500);

  // ── 6. Student Import ─────────────────────────────────────────────────────
  await caption(page, 'STEP 5 — Import Students: bulk-add students from a CSV file', 3200);
  await page.goto('/admin/students/import');
  await page.waitForTimeout(1500);
  await injectCursor(page);

  await caption(page, 'The CSV needs only two columns: name and phone — student IDs are auto-generated', 3200);
  await pause(page, 2000);
  await caption(page, 'Format: JUMU-{year}-{sequence} e.g. JUMU-2026-102. Default password: Muraja@1446', 3200);
  await pause(page, 2000);

  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() > 0) {
    await caption(page, 'Select your CSV file — the system processes it and creates all accounts instantly', 3000);
    await pause(page, 1500);
  }

  // ── 7. Credentials PDF ────────────────────────────────────────────────────
  await caption(page, 'STEP 6 — Download the Credentials PDF to distribute login IDs to students', 3200);
  await moveThenClick(page, 'a[href*="credentials-pdf"], button:has-text("Credentials"), a:has-text("Credentials")');
  await page.waitForTimeout(2000);
  await caption(page, 'Each student gets a card with their student ID and default password to log in.', 3200);
  await pause(page, 2000);

  // ── 8. Halqas ─────────────────────────────────────────────────────────────
  await caption(page, 'STEP 7 — Halqas: manage all halqa groups and their pair assignments', 3200);
  await moveThenClick(page, 'a[href*="/admin/halqas"]');
  await page.waitForURL('**/admin/halqas', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Each halqa row shows the name, assigned leader, number of pairs, and member count', 3200);
  await pause(page, 2000);

  await caption(page, 'Bulk Create: specify a count and the system creates halqas + leader accounts at once', 3200);
  const bulkCreateBtn = page.locator('button:has-text("Bulk"), button:has-text("Create Halqa"), a:has-text("Bulk Create")').first();
  if (await bulkCreateBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("Bulk"), button:has-text("Create Halqa"), a:has-text("Bulk Create")');
    await page.waitForTimeout(1200);
    await injectCursor(page);

    const countInput = page.locator('input[name="count"], input[type="number"]').first();
    if (await countInput.count() > 0) {
      await caption(page, 'Enter the number of halqas to create — leader accounts (LDR-XXXX) are auto-generated', 3000);
      await countInput.fill('3');
      await pause(page, 600);
      // Don't submit to avoid creating duplicate data
      await caption(page, 'Each new leader gets the default password Muraja@1446 — distributed separately', 3200);
    }
    await pause(page, 1000);
    // Close modal if open
    const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  await caption(page, 'Random Assign: instantly distribute all unassigned pairs across halqas evenly', 3200);
  await pause(page, 2000);

  // ── 9. Pairing ────────────────────────────────────────────────────────────
  await caption(page, 'STEP 8 — Pairing: manage the partner request window and run the pairing algorithm', 3200);
  await moveThenClick(page, 'a[href*="/admin/pairing"]');
  await page.waitForURL('**/admin/pairing', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);

  await caption(page, 'First, open the pairing window and set a deadline for partner requests', 3200);
  const windowBtn = page.locator('button:has-text("Open Window"), button:has-text("Pairing Window"), a:has-text("Open")').first();
  if (await windowBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("Open Window"), button:has-text("Pairing Window")');
    await page.waitForTimeout(1200);
    await injectCursor(page);

    const deadlineInput = page.locator('input[name="pairing_window_deadline"], input[type="date"]').first();
    if (await deadlineInput.count() > 0) {
      await caption(page, 'Set the deadline — students can only submit requests before this date', 2800);
      await deadlineInput.fill('2026-06-20');
      await pause(page, 600);
      await caption(page, 'Saving pairing window deadline…', 2000);
      await moveThenClick(page, 'button[type="submit"]');
      await page.waitForTimeout(1500);
      await injectCursor(page);
    }
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
    if (await cancelBtn.count() > 0) await cancelBtn.click();
  }

  await caption(page, 'All pending requests are categorised: Mutual, One-sided, and Conflict', 3200);
  await pause(page, 2000);
  await caption(page, 'Mutual = both want each other (locked first). Conflict = both want different people (random pool)', 3200);
  await pause(page, 2000);

  await caption(page, 'After the deadline, run the algorithm — it pairs students in 3 passes automatically', 3200);
  const runBtn = page.locator('button:has-text("Run Pairing"), button:has-text("Run Algorithm")').first();
  if (await runBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("Run Pairing"), button:has-text("Run Algorithm")');
    await page.waitForTimeout(2000);
    await caption(page, 'Algorithm complete: mutual pairs locked, one-sided paired, remainder matched by time overlap', 3500);
    await page.waitForTimeout(1500);
  }

  // ── 10. Pairs ─────────────────────────────────────────────────────────────
  await caption(page, 'STEP 9 — Pairs: view all created pairs, assign them to halqas, and manage integrity', 3200);
  await moveThenClick(page, 'a[href*="/admin/pairs"]');
  await page.waitForURL('**/admin/pairs', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Each pair shows both student names, their halqa, consistency, and any flags', 3200);
  await pause(page, 2000);

  // Pair detail
  await caption(page, `STEP 10 — Open Pair ${DEMO_PAIR_ID}: Fatima Ahmed + Mariam Hassan`, 3000);
  const pairLink = page.locator(`a[href*="/admin/pairs/${DEMO_PAIR_ID}"], tr:has-text("Fatima Ahmed") a`).first();
  if (await pairLink.count() > 0) {
    await moveThenClick(page, `a[href*="/admin/pairs/${DEMO_PAIR_ID}"], tr:has-text("Fatima Ahmed") a`);
    await page.waitForTimeout(2000);
    await injectCursor(page);
    await caption(page, 'Pair detail: submission timeline, flags, consistency trend, and halqa assignment', 3200);
    await pause(page, 2000);
  }

  // ── 11. Leaders ───────────────────────────────────────────────────────────
  await caption(page, 'STEP 11 — Leaders: manage all leader accounts and their halqa assignments', 3200);
  await moveThenClick(page, 'a[href*="/admin/leaders"]');
  await page.waitForURL('**/admin/leaders', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Leaders are shown with their assigned halqa, last login, and member count', 3200);
  await pause(page, 2000);

  // Leader detail
  await caption(page, `Opening leader detail for ${DEMO_LEADER_ID}`, 2800);
  const leaderLink = page.locator(`a:has-text("${DEMO_LEADER_ID}"), tr:has-text("${DEMO_LEADER_ID}") a`).first();
  if (await leaderLink.count() > 0) {
    await moveThenClick(page, `a:has-text("${DEMO_LEADER_ID}"), tr:has-text("${DEMO_LEADER_ID}") a`);
    await page.waitForTimeout(1500);
    await injectCursor(page);
    await caption(page, 'Leader detail: halqa members, login activity, meetings logged, and contact history', 3200);
    await pause(page, 2000);

    const resetPwBtn = page.locator('button:has-text("Reset Password"), button:has-text("Reset")').first();
    if (await resetPwBtn.count() > 0) {
      await caption(page, 'You can reset a leader\'s password here — the temp password is returned on screen', 3200);
      await pause(page, 1500);
    }
  }

  // ── 12. Leaderboard ───────────────────────────────────────────────────────
  await caption(page, 'STEP 12 — Leaderboard: rankings for students, pairs, halqas, and leaders', 3200);
  await moveThenClick(page, 'a[href*="/admin/leaderboard"]');
  await page.waitForURL('**/admin/leaderboard', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Rankings are based on consistency %, pages read, and streaks', 3200);
  await pause(page, 2000);
  await caption(page, 'Lock the leaderboard to freeze rankings for the report period, then export as PDF', 3200);
  await pause(page, 2000);
  await caption(page, 'Completion certificates can be generated for every student from this page', 3200);
  await pause(page, 2000);

  // ── 13. Pair Change Requests ──────────────────────────────────────────────
  await caption(page, 'STEP 13 — Pair Change Requests: review and approve or reject leader/student requests', 3200);
  await moveThenClick(page, 'a[href*="/admin/pair-changes"]');
  await page.waitForURL('**/admin/pair-changes', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Each request shows the current pair, the reason given, and who submitted it', 3200);
  await pause(page, 2000);

  const approveBtn = page.locator('button:has-text("Approve")').first();
  if (await approveBtn.count() > 0) {
    await caption(page, 'Approve to create the new assignment, or reject with a reason', 3000);
    await moveThenClick(page, 'button:has-text("Approve")');
    await page.waitForTimeout(1500);
    await caption(page, 'Pair change approved — students are automatically reassigned.', 3200);
  }
  await pause(page, 1500);

  // ── 14. Announcements ────────────────────────────────────────────────────
  await caption(page, 'STEP 14 — Announcements: broadcast messages to all students and leaders', 3200);
  await moveThenClick(page, 'a[href*="/admin/announcements"]');
  await page.waitForURL('**/admin/announcements', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);

  const newAnnouncementBtn = page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("New Announcement")').first();
  if (await newAnnouncementBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("New"), button:has-text("Create")');
    await page.waitForTimeout(1200);
    await injectCursor(page);

    const titleInput = page.locator('input[name="title"]').first();
    if (await titleInput.count() > 0) {
      await caption(page, 'Give the announcement a clear title', 2500);
      await titleInput.click();
      await titleInput.pressSequentially('Week 1 Reminder: Complete Your Daily Check-In', { delay: 60 });
      await pause(page, 500);
    }

    const bodyInput = page.locator('textarea[name="body"]').first();
    if (await bodyInput.count() > 0) {
      await caption(page, 'Write the full announcement body', 2500);
      await bodyInput.click();
      await bodyInput.pressSequentially(
        'Assalamu Alaykum! Please make sure to submit your daily check-in before midnight. Consistency from day one sets the tone for the entire program. Baarakallaahu feekum.',
        { delay: 45 }
      );
      await pause(page, 700);
      await caption(page, 'Publishing announcement — all students and leaders will see this immediately', 2800);
      await moveThenClick(page, 'button[type="submit"]');
      await page.waitForTimeout(1500);
      await caption(page, 'Announcement published and visible in all student and leader dashboards.', 3200);
    }
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
    if (await cancelBtn.count() > 0) await cancelBtn.click();
  }
  await pause(page, 1500);

  // ── 15. Integrity ─────────────────────────────────────────────────────────
  await caption(page, 'STEP 15 — Integrity: review submissions flagged by leaders for suspicious data', 3200);
  await moveThenClick(page, 'a[href*="/admin/integrity"]');
  await page.waitForURL('**/admin/integrity', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Each flagged submission shows: student, date, pages reported, and the leader\'s reason', 3200);
  await pause(page, 2000);

  const reviewBtn = page.locator('button:has-text("Review"), button:has-text("Clear")').first();
  if (await reviewBtn.count() > 0) {
    await caption(page, 'Click Review to mark it as checked, or Unflag to clear the flag entirely', 3000);
    await moveThenClick(page, 'button:has-text("Review"), button:has-text("Clear")');
    await page.waitForTimeout(1500);
  }
  await pause(page, 1500);

  // ── 16. Reports ───────────────────────────────────────────────────────────
  await caption(page, 'STEP 16 — Reports: export full program data in CSV or PDF format', 3200);
  await moveThenClick(page, 'a[href*="/admin/reports"]');
  await page.waitForURL('**/admin/reports', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);

  await caption(page, 'Available exports: Submissions CSV, Student Summary CSV, Contact Log, Program PDF', 3200);
  await pause(page, 2000);

  const weeklyReportLink = page.locator('a[href*="weekly"], button:has-text("Weekly")').first();
  if (await weeklyReportLink.count() > 0) {
    await caption(page, 'The Weekly Report gives a snapshot of the entire program for the past 7 days', 3000);
    await moveThenClick(page, 'a[href*="weekly"], button:has-text("Weekly")');
    await page.waitForTimeout(2000);
    await injectCursor(page);
    await pause(page, 2000);
    await caption(page, 'Download as PDF to share with stakeholders or archive for the program record', 3200);
    await pause(page, 2000);
  }

  // ── 17. Settings ─────────────────────────────────────────────────────────
  await caption(page, 'STEP 17 — Settings: configure program dates, prayer times, and daily Ayat rotation', 3200);
  await moveThenClick(page, 'a[href*="/admin/settings"]');
  await page.waitForURL('**/admin/settings', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);

  await caption(page, 'Set the program start and end dates — consistency calculations depend on this', 3200);
  await pause(page, 2000);
  await caption(page, 'Configure prayer times for your location — used for student availability matching', 3200);
  await pause(page, 2000);
  await caption(page, 'Ayat rotation: add Quranic verses that display daily across all dashboards', 3200);
  await pause(page, 2000);

  // ── 18. Audit Log ─────────────────────────────────────────────────────────
  await caption(page, 'STEP 18 — Audit Log: every action by every user is recorded here with timestamps', 3200);
  await moveThenClick(page, 'a[href*="/admin/audit"]');
  await page.waitForURL('**/admin/audit', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Entries include: who acted, what changed, what the old and new values were, and when', 3200);
  await pause(page, 2000);
  await caption(page, 'Use this for accountability, dispute resolution, or tracking program changes over time', 3200);
  await pause(page, 2000);

  // ── 19. Outreach ─────────────────────────────────────────────────────────
  await caption(page, 'STEP 19 — Outreach: escalation queue for students flagged by leaders or missing submissions', 3200);
  await moveThenClick(page, 'a[href*="/admin/outreach"]');
  await page.waitForURL('**/admin/outreach', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Students on the watchlist or monitor flag appear here for direct admin follow-up', 3200);
  await pause(page, 2000);
  await caption(page, 'Use bulk notify to send a message to all flagged students at once', 3200);
  await pause(page, 2000);

  await hideCaption(page);
  await caption(page, 'That covers the complete admin experience in Muraja\'a Monitor.', 3500);
  await pause(page, 2000);
});
