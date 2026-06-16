/**
 * VIDEO: Leader Walkthrough
 *
 * Leader: LDR-0001 — Halqa 1
 *
 * Flow:
 *   Login → Change Password → Dashboard → Pairs View →
 *   Pair Detail (heatmap · tests · contact · notes) →
 *   Announcements (broadcast modal) → Meetings → Weekly Report
 *
 * Reset before recording:
 *   php artisan tinker --execute="
 *     \$l = App\Models\User::where('student_id','LDR-0001')->first();
 *     \$l->update(['name'=>'leader-01','password'=>Hash::make('Muraja@1446'),'must_change_password'=>true]);
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
  realName:  'Demo Leader',
};

// ════════════════════════════════════════════════════════════════════════════
test('Leader full walkthrough', async ({ page }) => {

  // ── 1. Login ──────────────────────────────────────────────────────────────
  await page.goto('/login');
  await injectCursor(page);
  await caption(page, 'STEP 1 — Leaders log in at the same page as students', 2500);

  await annotate(page, '#student_id', 'Leader ID');
  await caption(page, 'Enter the leader code provided by the admin', 1800);
  await liveType(page, '#student_id', LEADER.id);
  await clearAnnotations(page);
  await pause(page, 400);

  await annotate(page, 'input[type="password"]', 'Password');
  await caption(page, 'Default password set by admin on registration', 1800);
  await liveType(page, 'input[type="password"]', LEADER.defaultPw);
  await clearAnnotations(page);
  await pause(page, 400);

  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);

  // ── 2. Change password ────────────────────────────────────────────────────
  await page.waitForURL('**/change-password', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 2 — First login: set your real name and a personal password', 3000);

  const nameInput = page.locator('#name, input[name="name"]').first();
  if (await nameInput.count() > 0) {
    await annotateLocator(page, nameInput, 'Full Name');
    await caption(page, 'Enter your full name — appears on reports and certificates', 2500);
    await scrollTo(page, nameInput);
    await nameInput.fill('');
    await nameInput.pressSequentially(LEADER.realName, { delay: 70 });
    await clearAnnotations(page);
    await pause(page, 400);
  }

  const currentPwInput = page.locator('#current_password, input[name="current_password"]').first();
  await annotateLocator(page, currentPwInput, 'Current Password');
  await caption(page, 'Enter the admin-provided default password', 2000);
  await scrollTo(page, currentPwInput);
  await currentPwInput.pressSequentially(LEADER.defaultPw, { delay: 70 });
  await clearAnnotations(page);
  await pause(page, 400);

  // Fill new password field (not current, not confirmation)
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

  // ── 3. Dashboard ──────────────────────────────────────────────────────────
  await page.waitForURL('**/leader/dashboard', { timeout: 10000 });
  await injectCursor(page);
  await caption(page, 'STEP 3 — Leader Dashboard: your halqa at a glance', 2800);
  await pause(page, 1200);

  // Stat cards
  await annotate(page, '.stat-cards', 'Halqa Health');
  await caption(page, 'Four cards show how many pairs are on track, slipping, at risk, or inactive', 3000);
  await clearAnnotations(page);
  await pause(page, 800);

  // Summary info card (first row)
  const infoCard = page.locator('div').filter({ hasText: 'pairs submitted today' }).first();
  if (await infoCard.count() > 0) {
    await annotateLocator(page, infoCard, 'Live Summary');
    await caption(page, 'A live summary shows submissions today, attention pairs, and any follow-ups overdue', 3200);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // Broadcast button
  const broadcastBtn = page.locator('button:has-text("Broadcast to Halqa")').first();
  if (await broadcastBtn.count() > 0) {
    await scrollTo(page, broadcastBtn);
    await annotateLocator(page, broadcastBtn, 'Broadcast');
    await caption(page, 'One tap to post an announcement directly to all students in your halqa', 2800);
    await clearAnnotations(page);
    await pause(page, 600);

    // Open broadcast modal
    await broadcastBtn.tap();
    await page.waitForTimeout(800);
    await injectCursor(page);
    const titleField = page.locator('input[placeholder="Title…"]').first();
    if (await titleField.count() > 0) {
      await annotateLocator(page, titleField, 'Announcement Title');
      await caption(page, 'Give the announcement a clear title', 2000);
      await titleField.pressSequentially('Weekly Reminder — Submit by Thursday', { delay: 50 });
      await clearAnnotations(page);
      await pause(page, 400);
      const bodyField = page.locator('textarea[placeholder="Write your announcement…"]').first();
      await bodyField.pressSequentially(
        "Assalamu alaykum. Please complete your muraja'a by Thursday. Contact me if you need help.",
        { delay: 38 }
      );
      await pause(page, 500);
      await annotate(page, 'button:has-text("Post & Notify Students")', 'Notify All');
      await caption(page, 'Post & Notify — all students get an instant in-app notification', 2800);
      await clearAnnotations(page);
      await moveThenClick(page, 'button:has-text("Post & Notify Students")');
      await page.waitForTimeout(1800);
      await injectCursor(page);
      await caption(page, 'Announcement posted — students are notified right away', 2500);
      await pause(page, 1200);
    }
  }

  // ── 4. Pairs view ─────────────────────────────────────────────────────────
  await caption(page, 'STEP 4 — Pairs View: full list of every pair with activity detail', 3000);
  await moveThenClick(page, 'a[href*="view=pairs"]');
  await page.waitForTimeout(1500);
  await injectCursor(page);
  await pause(page, 800);

  const firstPairRow = page.locator('a[href*="/leader/members/"]').first();
  if (await firstPairRow.count() > 0) {
    await annotateLocator(page, firstPairRow, 'Pair Row');
    await caption(page, 'Each row shows both student names, 7-day activity strip, consistency %, and today\'s dot', 3500);
    await clearAnnotations(page);
    await pause(page, 1000);
  }

  // ── 5. Pair Detail ────────────────────────────────────────────────────────
  await caption(page, 'STEP 5 — Tap any pair to open the full detail view', 2500);
  const pairHref = await firstPairRow.getAttribute('href').catch(() => null);
  if (pairHref) {
    await moveThenClick(page, `a[href="${pairHref}"]`);
  } else {
    await firstPairRow.tap();
  }
  await page.waitForURL('**/leader/members/**', { timeout: 10000 });
  await injectCursor(page);
  await pause(page, 1500);

  // Heatmap
  const heatmap = page.locator('[data-onboard="student-heatmap"]').first();
  if (await heatmap.count() > 0) {
    await annotateLocator(page, heatmap, '30-Day Heatmap');
    await caption(page, '30-day submission heatmap — green squares are days the student submitted', 3000);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // History tab
  await caption(page, 'History tab — every submission with flag option for admin review', 2800);
  const historyTab = page.locator('button:has-text("History")').first();
  if (await historyTab.count() > 0) {
    await annotateLocator(page, historyTab, 'History');
    await clearAnnotations(page);
    await moveThenClick(page, 'button:has-text("History")');
    await page.waitForTimeout(800);
  }

  const flagBtn = page.locator('[data-onboard="flag-btn"]').first();
  if (await flagBtn.count() > 0) {
    await scrollTo(page, flagBtn);
    await annotateLocator(page, flagBtn, 'Flag for Review');
    await caption(page, 'Flag any suspicious submission — admin sees it on the Integrity page', 3000);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  // Tests tab
  await caption(page, 'Tests tab — record a muraja\'a test result for this student', 2800);
  const testsTab = page.locator('button:has-text("Tests")').first();
  if (await testsTab.count() > 0) {
    await annotateLocator(page, testsTab, 'Tests');
    await clearAnnotations(page);
    await moveThenClick(page, 'button:has-text("Tests")');
    await page.waitForTimeout(800);
  }

  const testBtn = page.locator('button:has-text("+ Test")').first();
  if (await testBtn.count() > 0) {
    await scrollTo(page, testBtn);
    await annotateLocator(page, testBtn, '+ Test');
    await caption(page, 'Tap + Test to open the test form', 2000);
    await clearAnnotations(page);
    await testBtn.tap();
    await page.waitForTimeout(800);
    await injectCursor(page);

    const fromJuz = page.locator('input[placeholder="From juz"]').first();
    const toJuz   = page.locator('input[placeholder="To juz"]').first();
    const score   = page.locator('input[placeholder="e.g. 8"]').first();

    if (await fromJuz.count() > 0) {
      await annotateLocator(page, fromJuz, 'Juz Range');
      await caption(page, 'Enter the juz range that was tested', 2000);
      await fromJuz.fill('1');
      await toJuz.fill('3');
      await clearAnnotations(page);
      await pause(page, 400);
    }
    if (await score.count() > 0) {
      await annotateLocator(page, score, 'Score / 10');
      await caption(page, 'Give a score out of 10 — feeds into the leaderboard ranking', 2200);
      await score.fill('8');
      await clearAnnotations(page);
      await pause(page, 400);
    }
    await moveThenClick(page, 'button:has-text("Record test")');
    await page.waitForTimeout(1500);
    await injectCursor(page);
    await caption(page, 'Test recorded — student gets a notification with their score', 2800);
    await pause(page, 1200);
  }

  // Contact tab
  await caption(page, 'Contact tab — log every interaction you have with a student', 2800);
  const contactTab = page.locator('button:has-text("Contact")').first();
  if (await contactTab.count() > 0) {
    await annotateLocator(page, contactTab, 'Contact Log');
    await clearAnnotations(page);
    await moveThenClick(page, 'button:has-text("Contact")');
    await page.waitForTimeout(800);
  }

  const contactLog = page.locator('[data-onboard="contact-log"]').first();
  if (await contactLog.count() > 0) {
    await annotateLocator(page, contactLog, 'Contact History');
    await caption(page, 'Full timestamped contact history — method, note, and follow-up status', 3000);
    await clearAnnotations(page);
    await pause(page, 800);
  }

  const noteField = page.locator('textarea[placeholder="Contact note..."]').first();
  if (await noteField.count() > 0) {
    await scrollTo(page, noteField);
    await annotateLocator(page, noteField, 'New Contact Note');
    await caption(page, 'Log a contact note — call, message, or in-person', 2200);
    await noteField.tap();
    await noteField.pressSequentially(
      'Called student after missed submission. Was unwell — back on track now.',
      { delay: 42 }
    );
    await clearAnnotations(page);
    await pause(page, 500);
    const contactedAt = page.locator('input[name="contacted_at"]').first();
    if (await contactedAt.count() > 0) {
      await contactedAt.fill(new Date().toISOString().slice(0, 10));
    }
    await moveThenClick(page, 'button[type="submit"]');
    await page.waitForTimeout(1500);
    await caption(page, 'Contact note saved — creates a full audit trail per student', 2800);
    await pause(page, 1000);
  }

  // Notes tab
  await caption(page, 'Notes tab — private notes visible only to you, never shown to students', 2800);
  const notesTab = page.locator('button:has-text("Notes")').first();
  if (await notesTab.count() > 0) {
    await annotateLocator(page, notesTab, 'Private Notes');
    await clearAnnotations(page);
    await moveThenClick(page, 'button:has-text("Notes")');
    await page.waitForTimeout(800);
  }

  // Private note textarea (placeholder changed — match broadly)
  const privateNote = page.locator('textarea[placeholder*="Write a"]').first();
  if (await privateNote.count() > 0) {
    await scrollTo(page, privateNote);
    await annotateLocator(page, privateNote, 'Private Note');
    await caption(page, 'Write anything — context, concerns, reminders — stays between you and the system', 2800);
    await privateNote.tap();
    await privateNote.fill('Watch page counts — tends to underreport. Follow up next week.');
    await clearAnnotations(page);
    await pause(page, 600);

    const saveNote = page.locator('button:has-text("Save Note"), button:has-text("Replace Note")').first();
    if (await saveNote.count() > 0) {
      await scrollTo(page, saveNote);
      await annotateLocator(page, saveNote, 'Save Note');
      await clearAnnotations(page);
      await saveNote.tap();
      await page.waitForTimeout(1500);
    }
    await caption(page, 'Note saved — field clears and note appears above for reference', 2500);
    await pause(page, 1200);
  }

  // ── 6. Meetings ───────────────────────────────────────────────────────────
  await caption(page, 'STEP 6 — Meetings: log your halqa group sessions', 2800);
  await moveThenClick(page, 'a[href*="/leader/meetings"]');
  await page.waitForURL('**/leader/meetings', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 1200);

  const newMeetingBtn = page.locator('[data-onboard="new-meeting-btn"]').first();
  if (await newMeetingBtn.count() > 0) {
    await scrollTo(page, newMeetingBtn);
    await annotateLocator(page, newMeetingBtn, 'New Meeting');
    await caption(page, 'Log a new group session — date, attendance, notes, and action items', 2800);
    await clearAnnotations(page);
    await newMeetingBtn.tap();
    await page.waitForTimeout(1000);
    await injectCursor(page);
  }

  // Date
  const meetingDate = page.locator('input[type="date"]').first();
  if (await meetingDate.count() > 0) {
    await annotateLocator(page, meetingDate, 'Meeting Date');
    await caption(page, 'Set the date of the session', 1800);
    await scrollTo(page, meetingDate);
    await meetingDate.evaluate((el) => {
      el.value = new Date().toISOString().slice(0, 10);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await clearAnnotations(page);
    await pause(page, 500);
  }

  // Notes textarea (first of the three text areas — notes / highlights / concerns)
  const textareas = page.locator('textarea');
  const notesTA   = textareas.first();
  if (await notesTA.count() > 0) {
    await scrollTo(page, notesTA);
    await annotateLocator(page, notesTA, 'General Notes');
    await caption(page, 'Summarise what happened — feeds directly into the weekly report', 2800);
    await notesTA.tap();
    await notesTA.fill('Weekly halqa check-in. Two students need follow-up next week. Group is on target overall.');
    await clearAnnotations(page);
    await pause(page, 400);
  }

  // Highlights textarea (second)
  const highlightsTA = textareas.nth(1);
  if (await highlightsTA.count() > 0) {
    await scrollTo(page, highlightsTA);
    await annotateLocator(page, highlightsTA, 'Highlights');
    await caption(page, 'Note any wins — the admin sees this in the weekly overview', 2200);
    await highlightsTA.tap();
    await highlightsTA.fill('Three students completed Juz 5 this week. Great progress overall.');
    await clearAnnotations(page);
    await pause(page, 400);
  }

  // Finalise — scroll into view within the modal then tap
  const finaliseBtn = page.locator('button:has-text("Finalise")').first();
  await finaliseBtn.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
  if (await finaliseBtn.isVisible().catch(() => false)) {
    await finaliseBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    await annotateLocator(page, finaliseBtn, 'Finalise');
    await caption(page, 'Finalise the meeting — locks the record and notifies admin', 2500);
    await clearAnnotations(page);
    await finaliseBtn.tap();
    await page.waitForTimeout(2000);
    await injectCursor(page);
    await caption(page, 'Meeting finalised — visible in the weekly report and admin dashboard', 3000);
    await pause(page, 1200);
  } else {
    await moveThenClick(page, 'button:has-text("Save Draft")');
    await page.waitForTimeout(1800);
    await caption(page, 'Meeting saved — visible in the weekly report and admin dashboard', 2800);
    await pause(page, 1200);
  }

  // ── 7. Weekly Report ──────────────────────────────────────────────────────
  await caption(page, 'STEP 7 — Weekly Report: full performance summary for your halqa', 2800);
  // Weekly Report is behind the "More" sheet on mobile
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
  await pause(page, 1500);

  const pdfLink = page.locator('a:has-text("Download PDF"), a:has-text("↓ Download PDF")').first();
  if (await pdfLink.count() > 0) {
    await scrollTo(page, pdfLink);
    await annotateLocator(page, pdfLink, 'Download PDF');
    await caption(page, 'Download as PDF to submit to admin or keep for records', 2800);
    await clearAnnotations(page);
    await pause(page, 1000);
  }

  // ── End ───────────────────────────────────────────────────────────────────
  await hideCaption(page);
  await caption(page, 'That is the complete leader experience in Muraja\'a Monitor.', 3200);
  await pause(page, 2500);
});
