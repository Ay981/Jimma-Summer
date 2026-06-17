/**
 * VIDEO: Leader Walkthrough  [Mobile — iPhone 14]
 *
 * Leader: LDR-0001
 *
 * Flow:
 *   Login → Change Password →
 *   Dashboard Overview (stat cards · summary · broadcast) →
 *   Pairs Tab → Pair Detail (heatmap · history flag · test · contact · notes · info) →
 *   Students Tab →
 *   Meetings (new meeting · finalise) →
 *   More → Weekly Report (PDF) →
 *   Announcements (post)
 *
 * Reset before recording:
 *   php artisan tinker --execute="
 *     \$l = App\Models\User::where('student_id','LDR-0001')->firstOrFail();
 *     echo 'Leader: ' . \$l->name . PHP_EOL;
 *     App\Models\MeetingLog::where('leader_id',\$l->id)->delete();
 *     App\Models\ContactLog::where('contacted_by',\$l->id)->delete();
 *     App\Models\MurajaTest::where('leader_id',\$l->id)->delete();
 *     \$l->notifications()->delete();
 *     \$l->update(['name'=>'LDR-0001','password'=>Hash::make('Muraja@1446'),'must_change_password'=>true]);
 *     echo 'Done.' . PHP_EOL;
 *   "
 *
 * Run: npx playwright test tests/videos/leader.spec.js --headed
 */

import { test } from '@playwright/test';
import {
  injectCursor, caption, hideCaption,
  annotate, annotateLocator, clearAnnotations,
  moveThenClick, liveType, scrollTo, pause,
} from './helpers.js';

const LEADER = {
  id:        'LDR-0001',
  defaultPw: 'Muraja@1446',
  newPw:     'Leader@2026!',
  realName:  'Abdullahi Hassan',
};

// ════════════════════════════════════════════════════════════════════════════
test('Leader full walkthrough (mobile)', async ({ page }) => {

  // ── 1. Login ──────────────────────────────────────────────────────────────
  await page.goto('/login');
  await injectCursor(page);
  await caption(page, 'STEP 1 — Leaders use the same login page as students', 2500);

  await annotate(page, '#student_id', 'Leader ID');
  await caption(page, `Enter the leader code: ${LEADER.id}`, 1800);
  await liveType(page, '#student_id', LEADER.id);
  await clearAnnotations(page);
  await pause(page, 400);

  await annotate(page, 'input[type="password"]', 'Password');
  await caption(page, 'Admin-provided default password on first login', 1800);
  await liveType(page, 'input[type="password"]', LEADER.defaultPw);
  await clearAnnotations(page);
  await pause(page, 500);

  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);

  // ── 2. Change password ────────────────────────────────────────────────────
  await page.waitForURL('**/change-password', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 2 — First login: set your real name and a personal password', 3000);

  // Name field (leaders have a name field on the change-password page)
  const nameInput = page.locator('#name, input[name="name"]').first();
  if (await nameInput.count() > 0) {
    await annotateLocator(page, nameInput, 'Full Name');
    await caption(page, 'Enter your real name — it appears on reports and the weekly summary', 2500);
    await scrollTo(page, nameInput);
    await nameInput.fill('');
    await nameInput.pressSequentially(LEADER.realName, { delay: 70 });
    await clearAnnotations(page);
    await pause(page, 400);
  }

  const currentPwInput = page.locator('#current_password, input[name="current_password"]').first();
  await annotateLocator(page, currentPwInput, 'Current Password');
  await caption(page, 'Enter the default password provided by the admin', 2000);
  await scrollTo(page, currentPwInput);
  await currentPwInput.pressSequentially(LEADER.defaultPw, { delay: 70 });
  await clearAnnotations(page);
  await pause(page, 400);

  // New password — find by id/name, skipping current and confirmation
  const allPwInputs = await page.locator('input[type="password"]').all();
  for (const inp of allPwInputs) {
    const id = (await inp.getAttribute('id') ?? '') + (await inp.getAttribute('name') ?? '');
    if (id.includes('password') && !id.includes('current') && !id.includes('confirm')) {
      await annotateLocator(page, inp, 'New Password');
      await caption(page, 'Choose a strong personal password', 2000);
      await scrollTo(page, inp);
      await inp.fill(LEADER.newPw);
      await clearAnnotations(page);
      await pause(page, 400);
      break;
    }
  }

  const confirmInput = page.locator('#password_confirmation, input[name="password_confirmation"]').first();
  if (await confirmInput.count() > 0) {
    await annotateLocator(page, confirmInput, 'Confirm Password');
    await caption(page, 'Confirm your new password', 1800);
    await scrollTo(page, confirmInput);
    await confirmInput.fill(LEADER.newPw);
    await clearAnnotations(page);
    await pause(page, 400);
  }

  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2500);

  // ── 3. Dashboard — overview ───────────────────────────────────────────────
  await page.waitForURL('**/leader/dashboard', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 3 — Leader Dashboard: your halqa at a glance', 2800);
  await pause(page, 1200);

  // Stat cards
  const statCards = page.locator('.stat-cards');
  if (await statCards.count() > 0) {
    await annotateLocator(page, statCards, 'Halqa Health');
    await caption(page, 'Four cards show how many pairs are on track, slipping, at risk, or inactive', 3200);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // Summary info card
  const summaryCard = page.locator('div').filter({ hasText: 'pairs submitted today' }).first();
  if (await summaryCard.count() > 0) {
    await annotateLocator(page, summaryCard, 'Live Summary');
    await caption(page, 'Live count of today\'s submissions, pairs needing attention, and follow-ups overdue', 3200);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // ── 4. Broadcast to Halqa ─────────────────────────────────────────────────
  await caption(page, 'STEP 4 — Broadcast: post an urgent message to all students at once', 2800);
  const broadcastBtn = page.locator('button:has-text("Broadcast to Halqa")').first();
  if (await broadcastBtn.count() > 0) {
    await scrollTo(page, broadcastBtn);
    await annotateLocator(page, broadcastBtn, 'Broadcast to Halqa');
    await caption(page, 'One tap opens the broadcast sheet — no need to navigate away', 2000);
    await clearAnnotations(page);
    await broadcastBtn.tap();
    await page.waitForTimeout(800);
    await injectCursor(page);

    const titleField = page.locator('input[placeholder="Title…"]').first();
    if (await titleField.count() > 0) {
      await annotateLocator(page, titleField, 'Title');
      await caption(page, 'Give the announcement a clear, specific title', 2000);
      await titleField.pressSequentially('Reminder — Submit by Thursday Evening', { delay: 50 });
      await clearAnnotations(page);
      await pause(page, 400);

      const bodyField = page.locator('textarea[placeholder="Write your announcement…"]').first();
      await annotateLocator(page, bodyField, 'Message');
      await caption(page, 'Write your message — every student in the halqa gets an in-app notification', 2500);
      await bodyField.pressSequentially(
        "Assalamu alaykum. Please complete your murajaʼa by Thursday evening. Contact me if you need help or have an excuse.",
        { delay: 35 }
      );
      await clearAnnotations(page);
      await pause(page, 500);

      await annotate(page, 'button:has-text("Post & Notify Students")', 'Post & Notify');
      await caption(page, 'Post & Notify — students get an instant in-app notification', 2500);
      await clearAnnotations(page);
      await moveThenClick(page, 'button:has-text("Post & Notify Students")');
      await page.waitForTimeout(2000);
      await injectCursor(page);
      await caption(page, 'Announcement posted — all students are notified right away', 2500);
      await pause(page, 1200);
    }
  }

  // ── 5. Pairs tab ─────────────────────────────────────────────────────────
  await caption(page, 'STEP 5 — Pairs View: full list of every pair with 7-day activity strips', 3000);
  await moveThenClick(page, 'a[href*="view=pairs"]');
  await page.waitForTimeout(1500);
  await injectCursor(page);
  await pause(page, 800);

  const firstPairRow = page.locator('a[href*="/leader/members/"]').first();
  if (await firstPairRow.count() > 0) {
    await annotateLocator(page, firstPairRow, 'Pair Row');
    await caption(page, 'Each row shows both names, a 7-day activity strip, consistency %, and today\'s dot', 3500);
    await clearAnnotations(page);
    await pause(page, 1200);
  }

  // ── 6. Pair Detail ────────────────────────────────────────────────────────
  await caption(page, 'STEP 6 — Tap any pair to open the full detail view for both students', 2800);
  const pairHref = await firstPairRow.getAttribute('href').catch(() => null);
  if (pairHref) {
    await moveThenClick(page, `a[href="${pairHref}"]`);
  } else {
    await firstPairRow.tap();
  }
  await page.waitForURL('**/leader/members/**', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1500);

  // 6a. Heatmap
  const heatmap = page.locator('[data-onboard="student-heatmap"]').first();
  if (await heatmap.count() > 0) {
    await scrollTo(page, heatmap);
    await annotateLocator(page, heatmap, '30-Day Heatmap');
    await caption(page, '30-day submission heatmap — each green square is a day the student submitted', 3000);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // 6b. History tab — flag a submission
  await caption(page, 'History tab — every submission with dates, pages, and minutes spent', 2800);
  const historyTab = page.locator('button:has-text("History")').first();
  if (await historyTab.count() > 0) {
    await scrollTo(page, historyTab);
    await annotateLocator(page, historyTab, 'History');
    await clearAnnotations(page);
    await historyTab.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
    await pause(page, 800);
  }

  const flagBtn = page.locator('[data-onboard="flag-btn"]').first();
  if (await flagBtn.count() > 0) {
    await scrollTo(page, flagBtn);
    await annotateLocator(page, flagBtn, 'Flag for Review');
    await caption(page, 'Flag a suspicious submission — admin sees it instantly on the Integrity page', 3000);
    await clearAnnotations(page);
    await flagBtn.tap();
    await page.waitForTimeout(1200);
    await injectCursor(page);
    await caption(page, 'Flagged — verify or reject it right here without leaving the page', 2500);
    await pause(page, 1000);
  }

  // 6c. Tests tab — record a test
  await caption(page, 'Tests tab — record a murajaʼa test and it feeds directly into the leaderboard', 2800);
  const testsTab = page.locator('button:has-text("Tests")').first();
  if (await testsTab.count() > 0) {
    await scrollTo(page, testsTab);
    await annotateLocator(page, testsTab, 'Tests');
    await clearAnnotations(page);
    await testsTab.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
    await pause(page, 500);
  }

  // Open test modal via the "+ Submit Test" button in the Tests tab
  const submitTestBtn = page.locator('button:has-text("+ Submit Test")').first();
  const headerTestBtn = page.locator('button:has-text("+ Test")').first();
  const testTrigger   = (await submitTestBtn.isVisible().catch(() => false))
    ? submitTestBtn
    : headerTestBtn;

  if (await testTrigger.count() > 0) {
    await scrollTo(page, testTrigger);
    await annotateLocator(page, testTrigger, '+ Submit Test');
    await caption(page, 'Tap to record the test — juz range, pages, and a score out of 10', 2500);
    await clearAnnotations(page);
    await testTrigger.tap();
    await page.waitForTimeout(800);
    await injectCursor(page);

    // The test modal is position: fixed so it's at the top of the DOM
    const fromJuz  = page.locator('input[placeholder="From juz"]').first();
    const toJuz    = page.locator('input[placeholder="To juz"]').first();
    const fromPage = page.locator('input[placeholder="From page"]').first();
    const toPage   = page.locator('input[placeholder="To page"]').first();
    const score    = page.locator('input[placeholder="e.g. 8"]').first();

    if (await fromJuz.count() > 0) {
      await annotateLocator(page, fromJuz, 'Juz Range');
      await caption(page, 'Enter the juz range that was tested — Juz 14 to 15', 2200);
      await fromJuz.fill('14');
      await toJuz.fill('15');
      await clearAnnotations(page);
      await pause(page, 400);
    }
    if (await fromPage.count() > 0) {
      await annotateLocator(page, fromPage, 'Page Range');
      await caption(page, 'Optionally narrow to exact pages — pp. 260–300', 2000);
      await fromPage.fill('260');
      await toPage.fill('300');
      await clearAnnotations(page);
      await pause(page, 400);
    }
    if (await score.count() > 0) {
      await annotateLocator(page, score, 'Score / 10');
      await caption(page, 'Score out of 10 — used to calculate the leaderboard ranking', 2200);
      await score.fill('9');
      await clearAnnotations(page);
      await pause(page, 400);
    }

    await moveThenClick(page, 'button:has-text("Record test")');
    await page.waitForTimeout(1800);
    await injectCursor(page);
    await caption(page, 'Test recorded — student receives a notification with their score', 2800);
    await pause(page, 1200);
  }

  // 6d. Contact tab — log a contact note
  await caption(page, 'Contact tab — log every interaction and build a timestamped audit trail', 2800);
  const contactTab = page.locator('button:has-text("Contact")').first();
  if (await contactTab.count() > 0) {
    await scrollTo(page, contactTab);
    await annotateLocator(page, contactTab, 'Contact Log');
    await clearAnnotations(page);
    await contactTab.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
    await pause(page, 600);
  }

  // Method select — choose "Message"
  const methodSelect = page.locator('select').filter({ has: page.locator('option[value="call"]') }).first();
  if (await methodSelect.count() > 0) {
    await annotateLocator(page, methodSelect, 'Method');
    await caption(page, 'Choose how you made contact — Call, Message, or In Person', 2000);
    await methodSelect.selectOption('message');
    await clearAnnotations(page);
    await pause(page, 400);
  }

  const noteField = page.locator('textarea[placeholder="Contact note..."]').first();
  if (await noteField.count() > 0) {
    await scrollTo(page, noteField);
    await annotateLocator(page, noteField, 'Contact Note');
    await caption(page, 'Write exactly what happened — these notes are visible to admin in outreach', 2800);
    await noteField.tap();
    await noteField.pressSequentially(
      "Messaged student after missed submission. Was unwell — back on track now. Will catch up by Friday.",
      { delay: 38 }
    );
    await clearAnnotations(page);
    await pause(page, 500);
  }

  // Outcome select — choose "Responded"
  const outcomeSelect = page.locator('select').filter({ has: page.locator('option[value="responded"]') }).first();
  if (await outcomeSelect.count() > 0) {
    await annotateLocator(page, outcomeSelect, 'Outcome');
    await caption(page, 'Set the outcome — Responded, No Response, Resolved, or Escalated', 2000);
    await outcomeSelect.selectOption('responded');
    await clearAnnotations(page);
    await pause(page, 400);
  }

  await moveThenClick(page, 'button:has-text("Add note")');
  await page.waitForTimeout(1800);
  await injectCursor(page);
  await caption(page, 'Contact note saved — admin can see this in the outreach dashboard', 2800);
  await pause(page, 1000);

  // 6e. Notes tab — private note
  await caption(page, 'Notes tab — private notes only you can read, never shown to students or admin', 2800);
  const notesTab = page.locator('button:has-text("Notes")').first();
  if (await notesTab.count() > 0) {
    await scrollTo(page, notesTab);
    await annotateLocator(page, notesTab, 'Private Notes');
    await clearAnnotations(page);
    await notesTab.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
    await pause(page, 600);
  }

  const privateNote = page.locator('textarea[placeholder*="Write a"]').first();
  if (await privateNote.count() > 0) {
    await scrollTo(page, privateNote);
    await annotateLocator(page, privateNote, 'Private Note');
    await caption(page, 'Jot down context, concerns, or reminders — only stored for your reference', 2800);
    await privateNote.tap();
    await privateNote.fill('Strong potential but consistency dips mid-week. Tends to underreport pages. Follow up again next Thursday.');
    await clearAnnotations(page);
    await pause(page, 600);

    const saveNote = page.locator('button:has-text("Save Note"), button:has-text("Replace Note")').first();
    if (await saveNote.count() > 0) {
      await scrollTo(page, saveNote);
      await annotateLocator(page, saveNote, 'Save Note');
      await clearAnnotations(page);
      await saveNote.tap();
      await page.waitForTimeout(1500);
      await injectCursor(page);
      await caption(page, 'Note saved — persists across sessions and is never visible to students', 2500);
      await pause(page, 1000);
    }
  }

  // 6f. Info tab — notification log
  await caption(page, 'Info tab — see this student\'s last login and full notification delivery log', 2800);
  const infoTab = page.locator('button:has-text("Info")').first();
  if (await infoTab.count() > 0) {
    await scrollTo(page, infoTab);
    await annotateLocator(page, infoTab, 'Info');
    await clearAnnotations(page);
    await infoTab.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
    await pause(page, 1800);
    await caption(page, 'Every notification sent to this student is listed here — seen or unseen', 2800);
    await pause(page, 1500);
  }

  // ── 7. Students tab ───────────────────────────────────────────────────────
  await caption(page, 'STEP 7 — Students View: every student listed individually with stats', 2800);
  // Navigate back to dashboard via breadcrumb link
  const backLink = page.locator('a[href="/leader/dashboard"]').first();
  if (await backLink.count() > 0) {
    await moveThenClick(page, 'a[href="/leader/dashboard"]');
    await page.waitForURL('**/leader/dashboard', { timeout: 8000 });
    await injectCursor(page);
    await pause(page, 600);
  }
  // Students tab is behind the "More" sheet on mobile
  const moreBtnStudents = page.locator('button:has-text("More")').first();
  if (await moreBtnStudents.count() > 0) {
    await annotateLocator(page, moreBtnStudents, 'More');
    await caption(page, 'Tap More to access the Students view', 1800);
    await clearAnnotations(page);
    await moreBtnStudents.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
  }
  await moveThenClick(page, 'a[href*="view=students"]');
  await page.waitForTimeout(1500);
  await injectCursor(page);
  await pause(page, 1200);
  await caption(page, 'Each row shows the student\'s avatar, ID, last submission, consistency %, and today\'s dot', 3200);
  await pause(page, 1800);

  // ── 8. Meetings ───────────────────────────────────────────────────────────
  await caption(page, 'STEP 8 — Meetings: log your halqa group sessions and action items', 2800);
  await moveThenClick(page, 'a[href*="/leader/meetings"]');
  await page.waitForURL('**/leader/meetings', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 1200);

  const newMeetingBtn = page.locator('[data-onboard="new-meeting-btn"]').first();
  if (await newMeetingBtn.count() > 0) {
    await scrollTo(page, newMeetingBtn);
    await annotateLocator(page, newMeetingBtn, 'New Meeting');
    await caption(page, 'Log a new group session — date, attendance, agenda, and action items', 2800);
    await clearAnnotations(page);
    await newMeetingBtn.tap();
    await page.waitForTimeout(1000);
    await injectCursor(page);
  }

  // Meeting date (set via evaluate to bypass mobile date picker)
  const meetingDate = page.locator('input[type="date"]').first();
  if (await meetingDate.count() > 0) {
    await scrollTo(page, meetingDate);
    await annotateLocator(page, meetingDate, 'Meeting Date');
    await caption(page, 'Set the date of the session', 1800);
    await meetingDate.evaluate((el) => {
      el.value = new Date().toISOString().slice(0, 10);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await clearAnnotations(page);
    await pause(page, 500);
  }

  // Notes textarea — first one in the form
  const textareas = page.locator('textarea');
  const notesTA   = textareas.first();
  if (await notesTA.count() > 0) {
    await scrollTo(page, notesTA);
    await annotateLocator(page, notesTA, 'Meeting Notes');
    await caption(page, 'Summarise what happened — these notes feed directly into the weekly report', 2800);
    await notesTA.tap();
    await notesTA.fill("Weekly halqa check-in. Good attendance. Three pairs on track. One pair needs closer monitoring next week.");
    await clearAnnotations(page);
    await pause(page, 400);
  }

  // Highlights textarea — second one
  const highlightsTA = textareas.nth(1);
  if (await highlightsTA.count() > 0) {
    await scrollTo(page, highlightsTA);
    await annotateLocator(page, highlightsTA, 'Highlights');
    await caption(page, 'Capture wins — admin reads these highlights in the weekly programme overview', 2200);
    await highlightsTA.tap();
    await highlightsTA.fill("Four students completed their weekly targets ahead of schedule. Group morale is strong.");
    await clearAnnotations(page);
    await pause(page, 400);
  }

  // Finalise (or Save Draft as fallback)
  const finaliseBtn = page.locator('button:has-text("Finalise")').first();
  await finaliseBtn.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
  if (await finaliseBtn.isVisible().catch(() => false)) {
    await finaliseBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    await annotateLocator(page, finaliseBtn, 'Finalise');
    await caption(page, 'Finalise the meeting — locks the record and makes it visible to admin', 2500);
    await clearAnnotations(page);
    await finaliseBtn.tap();
    await page.waitForTimeout(2000);
    await injectCursor(page);
    await caption(page, 'Meeting finalised — it feeds into the weekly report and admin can see it immediately', 3000);
    await pause(page, 1200);
  } else {
    await moveThenClick(page, 'button:has-text("Save Draft")');
    await page.waitForTimeout(1800);
    await caption(page, 'Meeting saved — finalise it later when you\'re ready to share with admin', 2800);
    await pause(page, 1200);
  }

  // ── 9. Weekly Report ──────────────────────────────────────────────────────
  await caption(page, 'STEP 9 — Weekly Report: full performance summary for your halqa this week', 2800);
  const moreBtn = page.locator('button:has-text("More")').first();
  if (await moreBtn.count() > 0) {
    await annotateLocator(page, moreBtn, 'More');
    await caption(page, 'Tap More to access Weekly Report and other pages', 2000);
    await clearAnnotations(page);
    await moreBtn.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
  }
  await moveThenClick(page, 'a[href*="weekly-report"]');
  await page.waitForURL('**/leader/weekly-report', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 1800);
  await caption(page, 'Every pair\'s submission count, consistency %, and test scores compiled automatically', 3000);
  await pause(page, 1800);

  const pdfLink = page.locator('a:has-text("↓ Download PDF")').first();
  if (await pdfLink.count() > 0) {
    await scrollTo(page, pdfLink);
    await annotateLocator(page, pdfLink, 'Download PDF');
    await caption(page, 'Download as PDF — formatted for submission to programme admin or personal records', 2800);
    await clearAnnotations(page);
    await pause(page, 1200);
  }

  // ── 10. Announcements ─────────────────────────────────────────────────────
  await caption(page, 'STEP 10 — Announcements: dedicated page for posting and managing halqa messages', 2800);
  await moveThenClick(page, 'a[href*="/leader/announcements"]');
  await page.waitForURL('**/leader/announcements', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 1500);

  // Expand the post form if it is collapsed
  const expandBtn = page.locator('[aria-label="Expand post form"]').first();
  if (await expandBtn.count() > 0) {
    await annotateLocator(page, expandBtn, 'Post Announcement');
    await caption(page, 'Open the form to write a new announcement for the halqa', 2000);
    await clearAnnotations(page);
    await expandBtn.tap();
    await page.waitForTimeout(600);
    await injectCursor(page);
  }

  const announceTitleField = page.locator('input[placeholder="Title…"]').first();
  if (await announceTitleField.isVisible().catch(() => false)) {
    await scrollTo(page, announceTitleField);
    await annotateLocator(page, announceTitleField, 'Title');
    await caption(page, 'A clear title helps students scan their notification list quickly', 2000);
    await announceTitleField.pressSequentially('Juz 15 Test — This Friday After Asr', { delay: 50 });
    await clearAnnotations(page);
    await pause(page, 400);

    const announceBody = page.locator('textarea[placeholder="Write your announcement…"]').first();
    await announceBody.pressSequentially(
      "All pairs must be ready to be tested on Juz 15 this Friday. Ensure your murajaʼa is complete beforehand.",
      { delay: 35 }
    );
    await pause(page, 500);

    await moveThenClick(page, 'button:has-text("Post & Notify Students")');
    await page.waitForTimeout(2000);
    await injectCursor(page);
    await caption(page, 'Posted — students will see this in their notifications immediately', 2800);
    await pause(page, 1500);
  }

  await caption(page, 'Existing announcements are listed below — delete or dismiss any from here', 2800);
  await pause(page, 1800);

  // ── End ───────────────────────────────────────────────────────────────────
  await hideCaption(page);
  await caption(page, 'That is the complete leader experience in Murajaʼa Monitor — from login to weekly report.', 3500);
  await pause(page, 2500);
});
