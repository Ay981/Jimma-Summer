/**
 * VIDEO: Student Walkthrough — JUMU-2026-212 (Sitra kemeru)  [Mobile — iPhone 14]
 *
 * Flow:
 *   Login → Change Password → Complete Profile → Dashboard →
 *   Daily Check-In → Edit Submission → Submission History →
 *   Pair Request (screenshot demo) → My Partner →
 *   Halqa → Journal → Badges → Announcements
 *
 * Run: npx playwright test tests/videos/student.spec.js --headed
 *
 * Prerequisites (run before each recording):
 *   php artisan tinker --execute="
 *     \$u = App\Models\User::where('student_id','JUMU-2026-212')->first();
 *     App\Models\PairSubmission::where('submitted_by',\$u->id)->delete();
 *     App\Models\JournalEntry::where('user_id',\$u->id)->delete();
 *     \$u->update(['password'=>Hash::make('Muraja@1446'),'must_change_password'=>true,'profile_completed'=>false,'profile_completed_at'=>null]);
 *   "
 *
 * Pair-request demo screenshot → tests/videos/pair-request.png
 */

import { test } from '@playwright/test';
import { resolve } from 'path';
import {
  injectCursor, caption, hideCaption,
  annotate, annotateLocator, clearAnnotations,
  showImageOverlay, hideImageOverlay,
  moveThenClick, liveType, scrollTo, pause,
} from './helpers.js';

const STUDENT = {
  id:        'JUMU-2026-212',
  name:      'Sitra kemeru',
  defaultPw: 'Muraja@1446',
  newPw:     'Sitra@2026!',
};

const PARTNER_ID       = 'JUMU-1446-010';
const PAIR_REQUEST_IMG = resolve('tests/videos/pair-request.png');

// ════════════════════════════════════════════════════════════════════════════
test('Sitra kemeru — full student journey (mobile)', async ({ page }) => {

  // ── 1. Login ──────────────────────────────────────────────────────────────
  await page.goto('/login');
  await injectCursor(page);
  await caption(page, 'STEP 1 — Students open this login page to access the system', 2500);

  await annotate(page, '#student_id', 'Student ID');
  await caption(page, `Enter Student ID: ${STUDENT.id}`, 1800);
  await liveType(page, '#student_id', STUDENT.id);
  await clearAnnotations(page);
  await pause(page, 400);

  await annotate(page, '#password', 'Password');
  await caption(page, 'Default password provided by the admin at registration', 2000);
  await liveType(page, '#password', STUDENT.defaultPw);
  await clearAnnotations(page);
  await pause(page, 500);

  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(1500);

  // ── 2. Change password ────────────────────────────────────────────────────
  await page.waitForURL('**/change-password', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 2 — First login requires setting a personal password', 2800);

  await annotate(page, '#password', 'New Password');
  await caption(page, 'Choose a strong personal password', 1800);
  await liveType(page, '#password', STUDENT.newPw);
  await clearAnnotations(page);
  await pause(page, 400);

  await annotate(page, '#password_confirmation', 'Confirm Password');
  await caption(page, 'Re-enter to confirm', 1800);
  await liveType(page, '#password_confirmation', STUDENT.newPw);
  await clearAnnotations(page);
  await pause(page, 500);

  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);

  // ── 3. Complete profile ───────────────────────────────────────────────────
  await page.waitForURL('**/profile/complete', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 3 — Complete your profile so the system can match you with a partner', 2800);

  const memoSel = page.locator('[data-onboard="memo-level"]');
  await annotate(page, '[data-onboard="memo-level"]', 'Memorisation Level');
  await caption(page, 'How much of the Quran have you memorised? — 11 to 20 juz', 2500);
  await scrollTo(page, memoSel);
  await memoSel.selectOption('11_20');
  await clearAnnotations(page);
  await pause(page, 600);

  const juzSel = page.locator('select').nth(1);
  await annotate(page, 'select', 'Current Juz', { nth: 1 });
  await caption(page, 'Which Juz are you currently revising? — Juz 15', 2200);
  await scrollTo(page, juzSel);
  await juzSel.selectOption('15');
  await clearAnnotations(page);
  await pause(page, 600);

  await caption(page, 'Select the days you are available for revision', 2200);
  for (const day of ['Mon', 'Wed', 'Fri', 'Sat', 'Sun']) {
    const btn = page.locator(`button:has-text("${day}")`).first();
    await scrollTo(page, btn);
    await btn.tap();
    await pause(page, 280);
  }
  await pause(page, 400);

  await caption(page, 'Select the prayer times when you are free to revise', 2200);
  for (const time of ['After Asr', 'After Isha']) {
    const btn = page.locator(`button:has-text("${time}")`).first();
    await scrollTo(page, btn);
    await btn.tap();
    await pause(page, 280);
  }
  await pause(page, 400);

  const telegramEl = page.locator('[data-onboard="telegram-input"]');
  await annotate(page, '[data-onboard="telegram-input"]', 'Telegram Username');
  await caption(page, 'Add your Telegram so your partner can contact you', 2200);
  await scrollTo(page, telegramEl);
  await telegramEl.tap();
  await telegramEl.clear();
  await telegramEl.pressSequentially('sitra_kemeru_212', { delay: 80 });
  await clearAnnotations(page);
  await pause(page, 600);

  await moveThenClick(page, '[data-onboard="complete-btn"]');
  await page.waitForTimeout(2500);

  // ── 4. Dashboard ──────────────────────────────────────────────────────────
  await page.waitForURL('**/student/dashboard', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 4 — Student Dashboard: your daily hub for everything in the program', 2800);
  await pause(page, 1800);
  await caption(page, 'Streak, consistency %, weekly target, and today\'s check-in form are all here', 2800);
  await pause(page, 1800);

  // ── 5. Daily check-in ─────────────────────────────────────────────────────
  await caption(page, 'STEP 5 — Daily Check-In: record today\'s Muraja\'a session', 2800);

  const juzField = page.locator('[data-onboard="juz-field"]');
  await annotate(page, '[data-onboard="juz-field"]', 'Juz Revised');
  await caption(page, 'Select the Juz you revised today', 2000);
  await scrollTo(page, juzField);
  await juzField.selectOption('15');
  await clearAnnotations(page);
  await pause(page, 500);

  const form      = page.locator('[data-onboard="submission-form"]');
  const numInputs = form.locator('input[type="number"]');

  await annotateLocator(page, numInputs.nth(0), 'Page From');
  await caption(page, 'First page covered today — page 89', 2000);
  await scrollTo(page, numInputs.nth(0));
  await numInputs.nth(0).tap();
  await numInputs.nth(0).fill('89');
  await clearAnnotations(page);
  await pause(page, 350);

  await annotateLocator(page, numInputs.nth(1), 'Page To');
  await caption(page, 'Last page covered — page 110', 2000);
  await scrollTo(page, numInputs.nth(1));
  await numInputs.nth(1).tap();
  await numInputs.nth(1).fill('110');
  await clearAnnotations(page);
  await pause(page, 350);

  await annotateLocator(page, numInputs.nth(2), 'Minutes Spent');
  await caption(page, 'Total time spent revising — 45 minutes', 1800);
  await scrollTo(page, numInputs.nth(2));
  await numInputs.nth(2).tap();
  await numInputs.nth(2).fill('45');
  await clearAnnotations(page);
  await pause(page, 500);

  await moveThenClick(page, '[data-onboard="submit-btn"]');
  await page.waitForTimeout(2000);
  await caption(page, 'Check-in recorded! Streak and consistency % update automatically.', 2800);
  await pause(page, 1500);

  // ── 6. Edit submission ────────────────────────────────────────────────────
  // The "Edit" button lives inside the submission card (data-onboard="submission-form"),
  // NOT the weekly target editor which has its own "Edit target" button.
  await caption(page, 'STEP 6 — Made a mistake? Click Edit right on the dashboard to correct it', 2800);

  const submissionCard = page.locator('[data-onboard="submission-form"]');
  const editBtn = submissionCard.getByRole('button', { name: 'Edit', exact: true });

  if (await editBtn.count() > 0) {
    await scrollTo(page, editBtn);
    await editBtn.tap();
    await page.waitForTimeout(1500);

    // EditSubmissionForm: juz select + three number inputs (page_from, page_to, minutes_spent)
    const editNumInputs = submissionCard.locator('input[type="number"]');

    if (await editNumInputs.count() > 0) {
      await annotateLocator(page, editNumInputs.nth(0), 'Corrected Page From');
      await caption(page, 'Correcting the starting page — changing to 85', 2000);
      await scrollTo(page, editNumInputs.nth(0));
      await editNumInputs.nth(0).tap();
      await editNumInputs.nth(0).fill('85');
      await clearAnnotations(page);
      await pause(page, 400);

      // Save Changes button (exact text, not the Cancel button)
      const saveBtn = submissionCard.getByRole('button', { name: 'Save Changes', exact: true });
      await caption(page, 'Saving the corrected submission…', 1600);
      await scrollTo(page, saveBtn);
      await saveBtn.tap();
      await page.waitForTimeout(2000);
      await caption(page, 'Updated — the system marks it as edited so the leader can see.', 2800);
    }
  } else {
    await caption(page, 'The Edit button appears in the confirmation banner right after submitting', 2800);
  }
  await pause(page, 1500);

  // ── 7. Submission history ─────────────────────────────────────────────────
  await caption(page, 'STEP 7 — Submission History: all your past sessions, month by month', 2500);
  await moveThenClick(page, 'a[href*="/student/history"]');
  await page.waitForURL('**/student/history', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'Each row shows date, juz, pages, time spent, and whether it was edited', 2800);
  await pause(page, 1800);

  // ── 8. Pair request demo (screenshot overlay) ─────────────────────────────
  await caption(page, 'STEP 8 — Pair Request: students can request a preferred partner before pairing runs', 2800);
  await pause(page, 600);
  await showImageOverlay(
    page,
    PAIR_REQUEST_IMG,
    'Enter your preferred partner\'s Student ID — if they also request you, the algorithm prioritises your match'
  );
  await pause(page, 5000);
  await hideImageOverlay(page);
  await pause(page, 800);

  // ── 9. My Partner ─────────────────────────────────────────────────────────
  await caption(page, 'STEP 9 — My Partner: see your partner\'s contact info, streak, and latest submission', 2800);
  await moveThenClick(page, 'a[href*="/student/pair"]');
  await page.waitForURL('**/student/pair', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, `Paired with ${PARTNER_ID} — Telegram handle, consistency %, and pair stats shown here`, 3200);
  await pause(page, 1800);

  // ── 10. Halqa ─────────────────────────────────────────────────────────────
  await caption(page, 'STEP 10 — My Halqa: see your whole group, leader, and everyone\'s activity', 2500);
  await moveThenClick(page, 'a[href*="/student/halqa"]');
  await page.waitForURL('**/student/halqa', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'All pairs in your halqa listed with consistency % and latest submissions', 2800);
  await pause(page, 1800);
  await caption(page, 'Your leader\'s name is at the top — they monitor the group and can reach out', 2800);
  await pause(page, 1800);

  // ── 11. Journal ───────────────────────────────────────────────────────────
  await caption(page, 'STEP 11 — Journal: private daily reflections — only you can read these', 2500);
  await moveThenClick(page, 'a[href*="/student/journal"]');
  await page.waitForURL('**/student/journal', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1500);

  const journalInput = page.locator('textarea').first();
  if (await journalInput.count() > 0) {
    await annotateLocator(page, journalInput, 'Journal Entry');
    await caption(page, 'Write your reflection for today', 2000);
    await scrollTo(page, journalInput);
    await journalInput.tap();
    await journalInput.pressSequentially(
      "Good session after Asr. Completed the Al-Kahf target. Grateful for the consistency this week.",
      { delay: 50 }
    );
    await clearAnnotations(page);
    await pause(page, 700);
    await moveThenClick(page, 'button[type="submit"]');
    await page.waitForTimeout(1800);
    await caption(page, 'Entry saved — no admin or leader can read your journal. Completely private.', 2800);
  }
  await pause(page, 1500);

  // ── 12. Badges ────────────────────────────────────────────────────────────
  // Badges is accessible via the Medal icon in the mobile header (top-right).
  await caption(page, 'STEP 12 — Tap the Badges icon in the header to see your achievements', 2500);
  await moveThenClick(page, 'a[href="/student/badges"]');
  await page.waitForURL('**/student/badges', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'Streak badges: 7 days (Bronze) · 14 days (Silver) · 30 days (Gold)', 2800);
  await pause(page, 1800);
  await caption(page, 'Page badges: 100 pages · 300 pages · 604 pages — full Quran (Gold)', 2800);
  await pause(page, 1800);

  // ── 13. Announcements ─────────────────────────────────────────────────────
  await caption(page, 'STEP 13 — Announcements: program-wide messages from the admin', 2500);
  await moveThenClick(page, 'a[href*="/student/announcements"]');
  await page.waitForURL('**/student/announcements', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'Check here for program news, schedule changes, and motivational reminders.', 2800);
  await pause(page, 1800);

  await hideCaption(page);
  await caption(page, 'That covers the full student journey — from first login through daily program use.', 3200);
  await pause(page, 2000);
});
