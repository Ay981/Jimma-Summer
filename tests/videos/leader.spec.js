/**
 * VIDEO: Leader Walkthrough
 *
 * Leader: LDR-0001 (leader-01) — Halqa 1 (Halqa ID 27)
 * Halqa members: Pair 46 — Fatima Ahmed (JUMU-2026-001) + Mariam Hassan (JUMU-2026-002)
 *
 * Flows:
 *   Login → Dashboard (pairs view + students view) → Pair Detail →
 *   Flag Submission → Add Contact Note → Add Private Note →
 *   Log Meeting → Outreach → Weekly Report → Pair Change Request
 *
 * Run: npx playwright test tests/videos/leader.spec.js --headed
 */

import { test } from '@playwright/test';
import {
  injectCursor, caption, hideCaption,
  moveThenClick, liveType, pause,
} from './helpers.js';

const LEADER = { id: 'LDR-0001', pw: 'Muraja@1446', halqa: 'Halqa 1' };
const PAIR_ID = 46;
const STUDENT_A = { id: 'JUMU-2026-001', name: 'Fatima Ahmed' };
const STUDENT_B = { id: 'JUMU-2026-002', name: 'Mariam Hassan' };

async function leaderLogin(page) {
  await page.goto('/login');
  await injectCursor(page);
  await caption(page, 'Logging in as Leader LDR-0001 — responsible for Halqa 1', 3000);
  await liveType(page, 'input[name="student_id"], input[name="login_id"], #student_id, #login_id', LEADER.id);
  await pause(page, 400);
  await liveType(page, 'input[type="password"]', LEADER.pw);
  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);
}

// ════════════════════════════════════════════════════════════════════════════
test('Leader full walkthrough', async ({ page }) => {

  // ── 1. Login ──────────────────────────────────────────────────────────────
  await leaderLogin(page);
  await page.waitForURL('**/leader/dashboard', { timeout: 10000 });
  await injectCursor(page);

  // ── 2. Dashboard — default view ───────────────────────────────────────────
  await caption(page, 'STEP 1 — Leader Dashboard: overview of your halqa\'s current status', 3000);
  await pause(page, 2000);
  await caption(page, 'You can see all pairs, their last submission date, streak, and consistency %', 3000);
  await pause(page, 2000);

  // ── 3. Switch to Pairs view ───────────────────────────────────────────────
  await caption(page, 'STEP 2 — Pairs View: detailed submission trends per pair', 3000);
  const pairsViewLink = page.locator('a[href*="view=pairs"], button:has-text("Pairs")').first();
  if (await pairsViewLink.count() > 0) {
    await moveThenClick(page, 'a[href*="view=pairs"], button:has-text("Pairs")');
    await page.waitForTimeout(1500);
    await injectCursor(page);
  }
  await pause(page, 2000);
  await caption(page, 'Each pair card shows both members, days active, and submission consistency', 3000);
  await pause(page, 2000);

  // ── 4. Switch to Students view ────────────────────────────────────────────
  await caption(page, 'STEP 3 — Students View: see each student individually across the halqa', 3000);
  const studentsViewLink = page.locator('a[href*="view=students"], button:has-text("Students")').first();
  if (await studentsViewLink.count() > 0) {
    await moveThenClick(page, 'a[href*="view=students"], button:has-text("Students")');
    await page.waitForTimeout(1500);
    await injectCursor(page);
  }
  await pause(page, 2000);

  // ── 5. Open Pair Detail ───────────────────────────────────────────────────
  await caption(page, `STEP 4 — Open Pair Detail for Pair ${PAIR_ID}: ${STUDENT_A.name} & ${STUDENT_B.name}`, 3200);
  const pairDetailLink = page.locator(
    `a[href*="/leader/members/${PAIR_ID}"], a:has-text("${STUDENT_A.name}"), a:has-text("Pair ${PAIR_ID}")`
  ).first();
  if (await pairDetailLink.count() > 0) {
    await moveThenClick(page, `a[href*="/leader/members/${PAIR_ID}"], a:has-text("${STUDENT_A.name}")`);
  } else {
    await page.goto(`/leader/members/${PAIR_ID}`);
  }
  await page.waitForTimeout(2000);
  await injectCursor(page);

  await caption(page, `Pair Detail for ${STUDENT_A.name} and ${STUDENT_B.name} — full submission history below`, 3200);
  await pause(page, 2000);
  await caption(page, 'You can see juz, pages read, time spent, and flag status for each submission', 3000);
  await pause(page, 2000);

  // ── 6. Flag a submission ──────────────────────────────────────────────────
  await caption(page, 'STEP 5 — Flag a submission that looks suspicious or has a data error', 3200);
  const flagBtn = page.locator('button:has-text("Flag"), button[data-action="flag"]').first();
  if (await flagBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("Flag"), button[data-action="flag"]');
    await page.waitForTimeout(1200);
    await injectCursor(page);

    await caption(page, 'Enter the reason for flagging — this goes to the admin for review', 2800);
    const flagReason = page.locator('textarea[name="flag_reason"], input[name="flag_reason"], textarea').first();
    if (await flagReason.count() > 0) {
      await flagReason.click();
      await flagReason.pressSequentially(
        'Pages reported (89–200) seem unusually high for the time spent (12 minutes). Needs admin review.',
        { delay: 50 }
      );
      await pause(page, 600);
      await moveThenClick(page, 'button[type="submit"]');
      await page.waitForTimeout(1500);
      await caption(page, 'Submission flagged. Admin will review it on the Integrity page.', 3000);
    }
  } else {
    await caption(page, 'Flag button appears next to each submission row — sends it to admin for review', 3000);
  }
  await pause(page, 1500);

  // ── 7. Add contact note ───────────────────────────────────────────────────
  await caption(page, `STEP 6 — Add a contact note for ${STUDENT_A.name}`, 3000);
  const contactNoteBtn = page.locator('button:has-text("Contact"), button:has-text("Add Note"), a:has-text("Contact")').first();
  if (await contactNoteBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("Contact"), button:has-text("Add Note")');
    await page.waitForTimeout(1200);
    await injectCursor(page);
  }

  const contactType = page.locator('select[name="contact_type"]').first();
  if (await contactType.count() > 0) {
    await caption(page, 'Select contact method — phone call, message, or in-person', 2500);
    await contactType.selectOption('call');
    await pause(page, 500);
  }

  const noteText = page.locator('textarea[name="notes"], textarea[name="note"]').first();
  if (await noteText.count() > 0) {
    await caption(page, 'Log what was discussed during this contact', 2500);
    await noteText.click();
    await noteText.pressSequentially(
      `Called ${STUDENT_A.name} to check on missed submission. She confirmed she was unwell but is back on track now.`,
      { delay: 50 }
    );
    await pause(page, 600);
    const contactSubmit = page.locator('button[type="submit"]').last();
    await moveThenClick(page, 'button[type="submit"]');
    await page.waitForTimeout(1500);
    await caption(page, 'Contact note saved with timestamp — visible in the audit trail.', 3000);
  }
  await pause(page, 1500);

  // ── 8. Add private note ───────────────────────────────────────────────────
  await caption(page, 'STEP 7 — Private notes are only visible to you as the leader, not the student', 3200);
  const privateNoteInput = page.locator('textarea[name="private_note"], input[name="private_note"]').first();
  if (await privateNoteInput.count() > 0) {
    await privateNoteInput.click();
    await privateNoteInput.pressSequentially(
      'Fatima tends to underreport time. Watch for inflated page counts in future submissions.',
      { delay: 55 }
    );
    await pause(page, 600);
    const savePrivateBtn = page.locator('button:has-text("Save"), button:has-text("Note")').last();
    if (await savePrivateBtn.count() > 0) {
      await moveThenClick(page, 'button:has-text("Save"), button:has-text("Note")');
      await page.waitForTimeout(1500);
    }
    await caption(page, 'Private note saved — students cannot see this.', 3000);
  }
  await pause(page, 1500);

  // ── 9. Log a meeting ─────────────────────────────────────────────────────
  await caption(page, 'STEP 8 — Meetings: log your halqa group sessions with notes and action items', 3200);
  await moveThenClick(page, 'a[href*="/leader/meetings"]');
  await page.waitForURL('**/leader/meetings', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 1500);

  await caption(page, 'Create a new meeting log', 2500);
  const newMeetingBtn = page.locator('button:has-text("New Meeting"), button:has-text("Log Meeting"), a:has-text("New Meeting")').first();
  if (await newMeetingBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("New Meeting"), button:has-text("Log Meeting"), a:has-text("New Meeting")');
    await page.waitForTimeout(1200);
    await injectCursor(page);
  }

  const meetingDate = page.locator('input[name="meeting_date"], input[type="date"]').first();
  if (await meetingDate.count() > 0) {
    await caption(page, 'Set the meeting date', 2000);
    await meetingDate.fill('2026-06-14');
    await pause(page, 500);
  }

  const meetingTime = page.locator('input[name="meeting_time"], input[type="time"]').first();
  if (await meetingTime.count() > 0) {
    await meetingTime.fill('16:30');
    await pause(page, 400);
  }

  const attendanceCount = page.locator('input[name="attendance_count"]').first();
  if (await attendanceCount.count() > 0) {
    await attendanceCount.fill('8');
    await pause(page, 400);
  }

  const meetingNotes = page.locator('textarea[name="notes"]').first();
  if (await meetingNotes.count() > 0) {
    await caption(page, 'Write the meeting summary and any concerns discussed', 2800);
    await meetingNotes.click();
    await meetingNotes.pressSequentially(
      'Weekly halqa check-in. Discussed submission consistency. Two students flagged for follow-up next week. Reminded group about pairing window deadline.',
      { delay: 45 }
    );
    await pause(page, 700);
  }

  const highlights = page.locator('textarea[name="highlights"]').first();
  if (await highlights.count() > 0) {
    await caption(page, 'Note any highlights from the session', 2500);
    await highlights.click();
    await highlights.pressSequentially('Mariam Hassan achieved 7-day streak badge. Celebrated with group.', { delay: 55 });
    await pause(page, 500);
  }

  await caption(page, 'Saving meeting log…', 2000);
  await moveThenClick(page, 'button[type="submit"]');
  await page.waitForTimeout(2000);
  await caption(page, 'Meeting logged with attendance, notes, and highlights. Visible in weekly report.', 3200);
  await pause(page, 2000);

  // ── 10. Outreach ──────────────────────────────────────────────────────────
  await caption(page, 'STEP 9 — Outreach: the system automatically flags pairs with no recent submissions', 3200);
  const outreachLink = page.locator('a[href*="outreach"]').first();
  if (await outreachLink.count() > 0) {
    await moveThenClick(page, 'a[href*="outreach"]');
    await page.waitForTimeout(1500);
    await injectCursor(page);
    await pause(page, 2000);
    await caption(page, 'Absent pairs are sorted by days since last check-in — most urgent at the top', 3000);
    await pause(page, 2000);

    const followupBtn = page.locator('button:has-text("Follow"), button:has-text("Mark")').first();
    if (await followupBtn.count() > 0) {
      await caption(page, 'After contacting a student, mark them as followed-up to clear them from the queue', 3000);
      await moveThenClick(page, 'button:has-text("Follow"), button:has-text("Mark")');
      await page.waitForTimeout(1500);
    }
  }

  // ── 11. Weekly Report ─────────────────────────────────────────────────────
  await caption(page, 'STEP 10 — Weekly Report: a full summary of your halqa\'s performance this week', 3200);
  await moveThenClick(page, 'a[href*="weekly-report"]');
  await page.waitForURL('**/leader/weekly-report', { timeout: 8000 });
  await injectCursor(page);
  await pause(page, 2000);
  await caption(page, 'Report includes pair breakdown, attendance, consistency, meetings, and action items', 3200);
  await pause(page, 2000);

  const pdfBtn = page.locator('a[href*="pdf"], button:has-text("PDF"), button:has-text("Download")').first();
  if (await pdfBtn.count() > 0) {
    await caption(page, 'Click Download PDF to export the full report as a printable document', 3000);
    await moveThenClick(page, 'a[href*="pdf"], button:has-text("PDF"), button:has-text("Download")');
    await page.waitForTimeout(2000);
    await caption(page, 'PDF generated and downloading — ready to share with the admin.', 3000);
  }
  await pause(page, 1500);

  // ── 12. Pair Change Request ───────────────────────────────────────────────
  await caption(page, 'STEP 11 — Pair Change Requests: request a reassignment if a pair is not working out', 3200);
  await page.goto(`/leader/members/${PAIR_ID}`);
  await page.waitForTimeout(1500);
  await injectCursor(page);

  const pairChangeBtn = page.locator('button:has-text("Pair Change"), button:has-text("Change Pair"), a:has-text("Pair Change")').first();
  if (await pairChangeBtn.count() > 0) {
    await moveThenClick(page, 'button:has-text("Pair Change"), button:has-text("Change Pair")');
    await page.waitForTimeout(1200);
    await injectCursor(page);

    const changeReason = page.locator('textarea[name="reason"]').first();
    if (await changeReason.count() > 0) {
      await caption(page, 'Explain why a pair change is needed — admin reviews all requests', 2800);
      await changeReason.click();
      await changeReason.pressSequentially(
        'The two students have conflicting schedules and have not been able to revise together. Requesting reassignment to compatible partners.',
        { delay: 50 }
      );
      await pause(page, 700);
      await caption(page, 'Submitting change request to admin…', 2000);
      await moveThenClick(page, 'button[type="submit"]');
      await page.waitForTimeout(1500);
      await caption(page, 'Request submitted. Admin will approve or reject from the Pair Changes page.', 3200);
    }
  }
  await pause(page, 2000);

  await hideCaption(page);
  await caption(page, 'That covers the complete leader experience in Muraja\'a Monitor.', 3500);
  await pause(page, 2000);
});
