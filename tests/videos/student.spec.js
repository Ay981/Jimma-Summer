/**
 * VIDEO: Student Walkthrough  [Mobile — iPhone 14]
 *
 * Flow:
 *   Login → Change Password → Complete Profile →
 *   Dashboard (streak · consistency · weekly target · edit target) →
 *   Daily Check-In → Edit Submission →
 *   Submission History (heatmap · rows) →
 *   Pair Request (screenshot overlay) →
 *   My Partner →
 *   My Halqa →
 *   Notifications →
 *   Journal →
 *   Badges →
 *   Announcements →
 *   My Profile
 *
 * Reset before recording:
 *   php artisan tinker --execute="
 *     \$u = App\Models\User::where('student_id','JUMU-2026-001')->firstOrFail();
 *     App\Models\PairSubmission::where('submitted_by',\$u->id)->orWhere('subject_student_id',\$u->id)->delete();
 *     App\Models\JournalEntry::where('user_id',\$u->id)->delete();
 *     App\Models\Badge::where('user_id',\$u->id)->delete();
 *     App\Models\PairingRequest::where('student_id',\$u->id)->delete();
 *     \$u->notifications()->delete();
 *     \$u->update(['password'=>Hash::make('Muraja@1446'),'must_change_password'=>true,'profile_completed'=>false,'profile_completed_at'=>null,'memo_level'=>null,'available_days'=>null,'available_times'=>null,'telegram_username'=>null]);
 *   "
 *
 * Run: npx playwright test tests/videos/student.spec.js --headed
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
  id:        'JUMU-2026-001',
  name:      'Fatima Ahmed',
  defaultPw: 'Muraja@1446',
  newPw:     'Fatima@2026!',
};

const PARTNER_ID       = 'JUMU-2026-020';
const PAIR_REQUEST_IMG = resolve('tests/videos/pair-request.png');

// ════════════════════════════════════════════════════════════════════════════
test('Student full walkthrough (mobile)', async ({ page }) => {

  // ── 1. Login ──────────────────────────────────────────────────────────────
  await page.goto('/login');
  await injectCursor(page);
  await caption(page, 'STEP 1 — Students open this login page to access the system', 2500);

  await annotate(page, '#student_id', 'Student ID');
  await caption(page, `Enter your Student ID: ${STUDENT.id}`, 1800);
  await liveType(page, '#student_id', STUDENT.id);
  await clearAnnotations(page);
  await pause(page, 400);

  await annotate(page, 'input[type="password"]', 'Password');
  await caption(page, 'Default password provided by the admin at registration', 2000);
  await liveType(page, 'input[type="password"]', STUDENT.defaultPw);
  await clearAnnotations(page);
  await pause(page, 500);

  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);

  // ── 2. Change password ────────────────────────────────────────────────────
  await page.waitForURL('**/change-password', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 2 — First login: set your own private password', 2800);

  const currentPwInput = page.locator('#current_password, input[name="current_password"]').first();
  await annotateLocator(page, currentPwInput, 'Current Password');
  await caption(page, 'Enter the default password provided by the admin', 1800);
  await scrollTo(page, currentPwInput);
  await currentPwInput.pressSequentially(STUDENT.defaultPw, { delay: 70 });
  await clearAnnotations(page);
  await pause(page, 400);

  const allPwInputs = await page.locator('input[type="password"]').all();
  for (const inp of allPwInputs) {
    const id = (await inp.getAttribute('id') ?? '') + (await inp.getAttribute('name') ?? '');
    if (id.includes('password') && !id.includes('current') && !id.includes('confirm')) {
      await annotateLocator(page, inp, 'New Password');
      await caption(page, 'Choose a strong personal password', 1800);
      await scrollTo(page, inp);
      await inp.fill(STUDENT.newPw);
      await clearAnnotations(page);
      await pause(page, 400);
      break;
    }
  }

  const confirmInput = page.locator('#password_confirmation, input[name="password_confirmation"]').first();
  if (await confirmInput.count() > 0) {
    await annotateLocator(page, confirmInput, 'Confirm Password');
    await caption(page, 'Re-enter to confirm', 1800);
    await scrollTo(page, confirmInput);
    await confirmInput.fill(STUDENT.newPw);
    await clearAnnotations(page);
    await pause(page, 500);
  }

  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);

  // ── 3. Complete profile ───────────────────────────────────────────────────
  await page.waitForURL('**/profile/complete', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 3 — Complete your profile so the system can match you with the right partner', 2800);

  const memoSel = page.locator('[data-onboard="memo-level"]');
  await annotateLocator(page, memoSel, 'Memorisation Level');
  await caption(page, 'How much of the Quran have you memorised? — 11 to 20 juz', 2500);
  await scrollTo(page, memoSel);
  await memoSel.selectOption('11_20');
  await clearAnnotations(page);
  await pause(page, 600);

  const juzSel = page.locator('select').nth(1);
  await annotateLocator(page, juzSel, 'Current Juz');
  await caption(page, 'Which Juz are you currently revising? — Juz 15', 2200);
  await scrollTo(page, juzSel);
  await juzSel.selectOption('15');
  await clearAnnotations(page);
  await pause(page, 600);

  await caption(page, 'Select every day you are available — the algorithm uses this to find a compatible partner', 2500);
  for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
    const btn = page.locator(`button:has-text("${day}")`).first();
    await scrollTo(page, btn);
    await btn.tap();
    await pause(page, 250);
  }
  await pause(page, 400);

  await caption(page, 'Select every prayer time you are free — pairs are matched on overlapping schedules', 2500);
  for (const time of ['After Subhi', 'After Zuhr', 'After Asr', 'After Maghrib', 'After Isha']) {
    const btn = page.locator(`button:has-text("${time}")`).first();
    await scrollTo(page, btn);
    await btn.tap();
    await pause(page, 250);
  }
  await pause(page, 400);

  const telegramEl = page.locator('[data-onboard="telegram-input"]');
  await annotateLocator(page, telegramEl, 'Telegram Username');
  await caption(page, 'Add your Telegram handle — your partner uses this to contact you directly', 2200);
  await scrollTo(page, telegramEl);
  await telegramEl.tap();
  await telegramEl.clear();
  await telegramEl.pressSequentially('fatima_ahmed_001', { delay: 80 });
  await clearAnnotations(page);
  await pause(page, 600);

  await moveThenClick(page, '[data-onboard="complete-btn"]');
  await page.waitForTimeout(2500);

  // ── 4. Dashboard ──────────────────────────────────────────────────────────
  await page.waitForURL('**/student/dashboard', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 4 — Your Dashboard: everything at a glance, updated after every session', 2800);
  await pause(page, 1200);

  // Streak card
  const streakCard = page.locator('[data-onboard="streak-card"]').first();
  if (await streakCard.count() > 0) {
    await annotateLocator(page, streakCard, 'Current Streak');
    await caption(page, 'Your current streak in days — submit every day to keep it alive', 3000);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // Consistency %
  const consistencyCard = page.locator('[data-onboard="consistency-card"]').first();
  if (await consistencyCard.count() > 0) {
    await annotateLocator(page, consistencyCard, 'Consistency %');
    await caption(page, 'Your overall submission rate — this feeds directly into your leaderboard ranking', 3200);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // Weekly target
  const targetCard = page.locator('[data-onboard="target-card"], [data-onboard="weekly-target"]').first();
  if (await targetCard.count() > 0) {
    await annotateLocator(page, targetCard, 'Weekly Target');
    await caption(page, 'Your personal pages goal for the week — track progress against it every day', 2800);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // Edit weekly target
  const editTargetBtn = page.locator('button:has-text("Edit target"), button:has-text("Set target"), [data-onboard="edit-target"]').first();
  if (await editTargetBtn.count() > 0) {
    await scrollTo(page, editTargetBtn);
    await annotateLocator(page, editTargetBtn, 'Edit Target');
    await caption(page, 'Tap to set or update your weekly target — keeps you accountable throughout the week', 2500);
    await clearAnnotations(page);
    await editTargetBtn.tap();
    await page.waitForTimeout(800);
    await injectCursor(page);

    const targetInput = page.locator('input[type="number"]').first();
    if (await targetInput.count() > 0) {
      await scrollTo(page, targetInput);
      await annotateLocator(page, targetInput, 'Pages Target');
      await caption(page, 'Setting the target to 150 pages this week', 2000);
      await targetInput.fill('150');
      await clearAnnotations(page);
      await pause(page, 400);
      await moveThenClick(page, 'button:has-text("Save")');
      await page.waitForTimeout(1500);
      await injectCursor(page);
      await caption(page, 'Target saved — a progress bar tracks how close you are as you submit each day', 2500);
      await pause(page, 1000);
    }
  }

  // ── 5. Daily check-in ─────────────────────────────────────────────────────
  await caption(page, 'STEP 5 — Daily Check-In: record today\'s Muraja\'a session right from the dashboard', 2800);

  const juzField = page.locator('[data-onboard="juz-field"]');
  await annotateLocator(page, juzField, 'Juz Revised');
  await caption(page, 'Select the Juz you revised today — Juz 15', 2000);
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
  await caption(page, 'Total time spent revising — 45 minutes — used in your statistics', 2000);
  await scrollTo(page, numInputs.nth(2));
  await numInputs.nth(2).tap();
  await numInputs.nth(2).fill('45');
  await clearAnnotations(page);
  await pause(page, 500);

  await moveThenClick(page, '[data-onboard="submit-btn"]');
  await page.waitForTimeout(2000);
  await injectCursor(page);
  await caption(page, 'Submitted — streak, consistency %, and weekly target progress update immediately', 2800);
  await pause(page, 1500);

  // ── 5b. Missed day — excuse window ───────────────────────────────────────
  const excuseCard = page.locator('div').filter({ hasText: 'Excuse Window Open' }).first();
  if (await excuseCard.count() > 0) {
    await scrollTo(page, excuseCard);
    await annotateLocator(page, excuseCard, 'Missed Day');
    await caption(page, 'Missed a scheduled day? You have 48 hours to file an excuse and propose a makeup session', 3200);
    await clearAnnotations(page);
    await pause(page, 1200);

    const fileExcuseBtn = excuseCard.locator('button:has-text("File Excuse")').first();
    if (await fileExcuseBtn.count() > 0) {
      await scrollTo(page, fileExcuseBtn);
      await annotateLocator(page, fileExcuseBtn, 'File Excuse');
      await caption(page, 'Tap File Excuse to open the form for that missed day', 2000);
      await clearAnnotations(page);
      await fileExcuseBtn.tap();
      await page.waitForTimeout(700);
      await injectCursor(page);

      const reasonField = page.locator('textarea[placeholder*="reason"]').first();
      if (await reasonField.count() > 0) {
        await scrollTo(page, reasonField);
        await annotateLocator(page, reasonField, 'Reason');
        await caption(page, 'Briefly explain why you missed — your leader can see this', 2500);
        await reasonField.tap();
        await reasonField.pressSequentially('Was unwell — had a fever and could not sit for revision.', { delay: 40 });
        await clearAnnotations(page);
        await pause(page, 500);
      }

      const makeupInput = page.locator('input[type="date"]').first();
      if (await makeupInput.count() > 0) {
        await scrollTo(page, makeupInput);
        await annotateLocator(page, makeupInput, 'Makeup Date');
        await caption(page, 'Pick a day outside your regular schedule this week to make up the session', 2800);
        await makeupInput.evaluate((el) => {
          const inSchedule = ['sunday','monday','tuesday','friday','saturday'];
          const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
          const d = new Date();
          d.setDate(d.getDate() + 1);
          for (let i = 0; i < 7; i++) {
            if (!inSchedule.includes(days[d.getDay()])) {
              el.value = d.toISOString().slice(0, 10);
              el.dispatchEvent(new Event('input',  { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
            d.setDate(d.getDate() + 1);
          }
        });
        await clearAnnotations(page);
        await pause(page, 500);
      }

      await moveThenClick(page, 'button:has-text("File Excuse")');
      await page.waitForTimeout(2000);
      await injectCursor(page);
      await caption(page, 'Excuse filed — a makeup is now pending. Complete it by the end of the week to protect your streak.', 3200);
      await pause(page, 1500);
    }
  }

  // ── 6. Edit submission ────────────────────────────────────────────────────
  await caption(page, 'STEP 6 — Made a mistake? Edit your submission right from the dashboard', 2800);

  const submissionCard = page.locator('[data-onboard="submission-form"]');
  const editBtn = submissionCard.getByRole('button', { name: 'Edit', exact: true });

  if (await editBtn.count() > 0) {
    await scrollTo(page, editBtn);
    await annotateLocator(page, editBtn, 'Edit Submission');
    await caption(page, 'Tap Edit to correct any field — the leader sees a note that it was edited', 2800);
    await clearAnnotations(page);
    await editBtn.tap();
    await page.waitForTimeout(1500);
    await injectCursor(page);

    const editNumInputs = submissionCard.locator('input[type="number"]');
    if (await editNumInputs.count() > 0) {
      await annotateLocator(page, editNumInputs.nth(0), 'Corrected Page From');
      await caption(page, 'Correcting the start page from 89 to 85', 2000);
      await scrollTo(page, editNumInputs.nth(0));
      await editNumInputs.nth(0).tap();
      await editNumInputs.nth(0).fill('85');
      await clearAnnotations(page);
      await pause(page, 400);

      const saveBtn = submissionCard.getByRole('button', { name: 'Save Changes', exact: true });
      await scrollTo(page, saveBtn);
      await annotateLocator(page, saveBtn, 'Save Changes');
      await caption(page, 'Saving the correction…', 1600);
      await clearAnnotations(page);
      await saveBtn.tap();
      await page.waitForTimeout(2000);
      await injectCursor(page);
      await caption(page, 'Updated — the system marks it as edited so your leader is aware', 2800);
    }
  } else {
    await caption(page, 'The Edit button appears in the confirmation banner immediately after submitting', 2800);
  }
  await pause(page, 1500);

  // ── 7. Submission history ─────────────────────────────────────────────────
  await caption(page, 'STEP 7 — Submission History: every session you have logged, month by month', 2500);
  await moveThenClick(page, 'a[href*="/student/history"]');
  await page.waitForURL('**/student/history', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1500);

  // 30-day heatmap at the top of history
  const heatmap = page.locator('[data-onboard="student-heatmap"]').first();
  if (await heatmap.count() > 0) {
    await scrollTo(page, heatmap);
    await annotateLocator(page, heatmap, '30-Day Heatmap');
    await caption(page, '30-day submission heatmap — each green square is a day you submitted', 3000);
    await clearAnnotations(page);
    await pause(page, 1200);
  }

  await caption(page, 'Each row shows the date, Juz, pages covered, time spent, and any edits', 2800);
  await pause(page, 1800);

  // Tests tab
  const testsTab = page.locator('button').filter({ hasText: /Tests/ }).first();
  if (await testsTab.count() > 0) {
    await annotateLocator(page, testsTab, 'Tests Tab');
    await caption(page, 'The Tests tab shows every muraja\'a test your leader has recorded for you', 2800);
    await clearAnnotations(page);
    await testsTab.tap();
    await page.waitForTimeout(800);
    await injectCursor(page);
    await pause(page, 1000);

    const testRow = page.locator('table tbody tr').first();
    if (await testRow.count() > 0) {
      await annotateLocator(page, testRow, 'Test Record');
      await caption(page, 'Each record shows the date, juz range, your score out of 10, and which leader tested you', 3200);
      await clearAnnotations(page);
      await pause(page, 1800);
    } else {
      await caption(page, 'Test records appear here once your leader records a test — date, juz range, and score out of 10', 3200);
      await pause(page, 1800);
    }
  }

  // ── 8. Pair request demo (screenshot overlay) ─────────────────────────────
  await caption(page, 'STEP 8 — Pair Request: request a preferred partner before the admin runs the algorithm', 2800);
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
  await caption(page, 'STEP 9 — My Partner: your assigned partner\'s contact details and submission activity', 2800);
  await moveThenClick(page, 'a[href*="/student/pair"]');
  await page.waitForURL('**/student/pair', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1500);

  const partnerCard = page.locator('[data-onboard="partner-card"]').first();
  if (await partnerCard.count() > 0) {
    await annotateLocator(page, partnerCard, 'Partner Info');
    await caption(page, 'Your partner\'s name, Student ID, and Telegram handle — tap to open a chat directly', 3200);
    await clearAnnotations(page);
    await pause(page, 1200);
  } else {
    await caption(page, `Paired with ${PARTNER_ID} — Telegram handle, consistency %, and shared pair stats shown here`, 3200);
    await pause(page, 1800);
  }

  const pairStats = page.locator('[data-onboard="pair-stats"]').first();
  if (await pairStats.count() > 0) {
    await annotateLocator(page, pairStats, 'Pair Stats');
    await caption(page, 'Combined pair consistency and streak — both students must submit for the pair to stay active', 3200);
    await clearAnnotations(page);
    await pause(page, 1200);
  } else {
    await pause(page, 1800);
  }

  // ── 10. My Halqa ──────────────────────────────────────────────────────────
  await caption(page, 'STEP 10 — My Halqa: your whole group, your leader, and everyone\'s submission activity', 2500);
  const moreBtn = page.locator('button:has-text("More")').first();
  if (await moreBtn.count() > 0) {
    await annotateLocator(page, moreBtn, 'More');
    await caption(page, 'Tap More to access Halqa, Badges, Journal, and Profile', 2000);
    await clearAnnotations(page);
    await moreBtn.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
  }
  await moveThenClick(page, 'a[href*="/student/halqa"]');
  await page.waitForURL('**/student/halqa', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'All pairs in your halqa listed with consistency % and latest submission activity', 2800);
  await pause(page, 1800);
  await caption(page, 'Your leader\'s name and contact are at the top — they monitor the group and reach out when needed', 2800);
  await pause(page, 1800);

  // ── 11. Notifications ─────────────────────────────────────────────────────
  await caption(page, 'STEP 11 — Notifications: test scores, halqa broadcasts, and program alerts all land here', 2500);
  const notifBell = page.locator('[data-onboard="notif-bell"]').first();
  if (await notifBell.count() > 0) {
    await annotateLocator(page, notifBell, 'Notifications');
    await caption(page, 'Tap the bell to see all unread notifications — the badge count shows how many are waiting', 2800);
    await clearAnnotations(page);
    await notifBell.tap();
    await page.waitForTimeout(1200);
    await injectCursor(page);
    await caption(page, 'Every test score, leader broadcast, and program update is delivered here instantly', 3000);
    await pause(page, 2000);

    // Mark all as read if visible
    const readAllBtn = page.locator('button:has-text("Mark all read"), button:has-text("Read all")').first();
    if (await readAllBtn.count() > 0) {
      await annotateLocator(page, readAllBtn, 'Mark All Read');
      await caption(page, 'Mark all notifications as read in one tap', 2000);
      await clearAnnotations(page);
      await readAllBtn.tap();
      await page.waitForTimeout(1000);
      await injectCursor(page);
      await caption(page, 'Inbox cleared — badge count resets to zero', 2000);
      await pause(page, 800);
    }
  }

  // ── 12. Journal ───────────────────────────────────────────────────────────
  await caption(page, 'STEP 12 — Journal: private daily reflections — only you can ever read these', 2500);
  const moreBtn2 = page.locator('button:has-text("More")').first();
  if (await moreBtn2.count() > 0) {
    await moreBtn2.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
  }
  await moveThenClick(page, 'a[href*="/student/journal"]');
  await page.waitForURL('**/student/journal', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1500);

  const journalInput = page.locator('textarea').first();
  if (await journalInput.count() > 0) {
    await annotateLocator(page, journalInput, 'Journal Entry');
    await caption(page, 'Write your reflection — no leader or admin can ever read your journal', 2500);
    await scrollTo(page, journalInput);
    await journalInput.tap();
    await journalInput.pressSequentially(
      "Good session after Asr. Completed the Al-Kahf target. Grateful for the consistency this week.",
      { delay: 50 }
    );
    await clearAnnotations(page);
    await pause(page, 700);

    const submitJournal = page.locator('button[type="submit"]').first();
    await annotateLocator(page, submitJournal, 'Save Entry');
    await caption(page, 'Save the entry — it stays alongside all previous entries, newest at the top', 2000);
    await clearAnnotations(page);
    await moveThenClick(page, 'button[type="submit"]');
    await page.waitForTimeout(1800);
    await injectCursor(page);
    await caption(page, 'Entry saved — completely private, never visible to anyone else', 2500);
  }
  await pause(page, 1500);

  // ── 13. Badges ────────────────────────────────────────────────────────────
  await caption(page, 'STEP 13 — Badges: milestones earned automatically as you progress through the program', 2500);
  const moreBtn3 = page.locator('button:has-text("More")').first();
  if (await moreBtn3.count() > 0) {
    await moreBtn3.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
  }
  await moveThenClick(page, 'a[href="/student/badges"]');
  await page.waitForURL('**/student/badges', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);

  const streakBadges = page.locator('[data-onboard="streak-badges"]').first();
  if (await streakBadges.count() > 0) {
    await annotateLocator(page, streakBadges, 'Streak Badges');
    await caption(page, 'Streak badges unlock at 7 days (Bronze) · 14 days (Silver) · 30 days (Gold)', 3200);
    await clearAnnotations(page);
    await pause(page, 1200);
  } else {
    await caption(page, 'Streak badges: 7 days (Bronze) · 14 days (Silver) · 30 days (Gold)', 2800);
    await pause(page, 1800);
  }

  const pageBadges = page.locator('[data-onboard="page-badges"]').first();
  if (await pageBadges.count() > 0) {
    await annotateLocator(page, pageBadges, 'Page Badges');
    await caption(page, 'Page badges unlock at 100 pages · 300 pages · 604 pages — the full Quran', 3200);
    await clearAnnotations(page);
    await pause(page, 1200);
  } else {
    await caption(page, 'Page badges: 100 pages · 300 pages · 604 pages (full Quran — Gold)', 2800);
    await pause(page, 1800);
  }

  await caption(page, 'Consistency badges: 70% · 85% · 95% submission rate sustained over the program', 2800);
  await pause(page, 1800);

  // ── 14. Announcements ─────────────────────────────────────────────────────
  await caption(page, 'STEP 14 — Announcements: program-wide messages from admin and your halqa leader', 2500);
  await moveThenClick(page, 'a[href*="/student/announcements"]');
  await page.waitForURL('**/student/announcements', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'Check here for program news, schedule changes, test dates, and motivational reminders', 2800);
  await pause(page, 1800);

  // ── 15. My Profile ────────────────────────────────────────────────────────
  await caption(page, 'STEP 15 — My Profile: view and update your details any time during the program', 2500);
  const moreBtn4 = page.locator('button:has-text("More")').first();
  if (await moreBtn4.count() > 0) {
    await annotateLocator(page, moreBtn4, 'More');
    await caption(page, 'My Profile is in the More menu on mobile', 2000);
    await clearAnnotations(page);
    await moreBtn4.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
  }
  await moveThenClick(page, 'a[href*="/student/profile"]');
  await page.waitForURL('**/student/profile', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'Your name, Student ID, Telegram handle, memorisation level, and program stats are all here', 2800);
  await pause(page, 1800);

  const editProfileBtn = page.locator('button:has-text("Edit"), a:has-text("Edit Profile"), [data-onboard="edit-profile"]').first();
  if (await editProfileBtn.count() > 0) {
    await scrollTo(page, editProfileBtn);
    await annotateLocator(page, editProfileBtn, 'Edit Profile');
    await caption(page, 'Update your availability, Telegram handle, or current Juz here any time', 2500);
    await clearAnnotations(page);
    await pause(page, 1200);
  }

  // ── End ───────────────────────────────────────────────────────────────────
  await hideCaption(page);
  await caption(page, 'That is the complete student experience in Murajaʼa Monitor — from first login through every feature.', 3500);
  await pause(page, 2500);
});
