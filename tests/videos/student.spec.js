/**
 * VIDEO: Submit Muraja'a + Edit Submission  [Mobile — iPhone 14]
 *
 * Only covers:
 *   Login → Submit today's muraja'a → Edit the submitted values
 *
 * Run: npx playwright test tests/videos/student.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import {
  injectCursor, caption, hideCaption,
  liveType, pause,
} from './helpers.js';

const STUDENT = {
  id: 'JUMU-2026-064',
  password: 'Admin123',
};

const SUBMISSION = {
  juz: '15',
  pageFrom: '89',
  pageTo: '110',
  minutes: '45',
};

const EDITED = {
  pageFrom: '85',
  pageTo: '112',
  minutes: '50',
};

function prepareDemoStudent() {
  const php = `
    $student = App\\Models\\User::where('student_id', '${STUDENT.id}')->firstOrFail();
    $pair = App\\Models\\Pair::where('student_a_id', $student->id)
      ->orWhere('student_b_id', $student->id)
      ->with(['studentA', 'studentB'])
      ->firstOrFail();
    $partner = $pair->student_a_id === $student->id ? $pair->studentB : $pair->studentA;
    $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    foreach ([$student, $partner] as $user) {
      $user->forceFill([
        'password' => Hash::make('${STUDENT.password}'),
        'must_change_password' => false,
        'profile_completed' => true,
        'memo_level' => '11_20',
        'current_juz' => 15,
        'available_days' => $days,
        'available_times' => ['after_subhi', 'after_zuhr', 'after_asr', 'after_maghrib', 'after_isha'],
      ])->save();
    }
    App\\Models\\ProgramSetting::set('program_start_date', now()->toDateString());
    App\\Models\\ProgramSetting::set('program_end_date', '');
    App\\Models\\PairSubmission::where('subject_student_id', $partner->id)
      ->where('submission_date', now()->toDateString())
      ->delete();
    App\\Models\\PairSubmission::where('submitted_by', $student->id)
      ->where('submission_date', now()->toDateString())
      ->delete();
  `;

  execFileSync('php', ['artisan', 'tinker', '--execute', php], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
}

async function slowScrollTo(page, locator, settleMs = 1300) {
  await locator.waitFor({ state: 'visible', timeout: 12000 });
  await locator.evaluate((node) => {
    node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  });
  await page.waitForTimeout(settleMs);
}

async function clearCallouts(page) {
  await page.evaluate(() => document.querySelectorAll('.pw-clean-callout').forEach((el) => el.remove()));
}

async function crossSubmitIntro(page) {
  await page.evaluate(() => {
    document.getElementById('pw-cross-submit-intro')?.remove();

    const wrap = document.createElement('div');
    wrap.id = 'pw-cross-submit-intro';
    wrap.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483645;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px;
      box-sizing: border-box;
      background: linear-gradient(180deg, rgba(248,250,252,.97), rgba(241,245,249,.96));
      pointer-events: none;
      font-family: "Segoe UI", system-ui, sans-serif;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      width: min(100%, 336px);
      border-radius: 16px;
      padding: 26px 22px;
      box-sizing: border-box;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid rgba(15,23,42,.16);
      box-shadow: 0 24px 56px rgba(15,23,42,.28);
      text-align: left;
    `;

    panel.innerHTML = `
      <div style="font-size:12px;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#7dd3fc;margin-bottom:12px;">
        Important: Cross-Submitting
      </div>
      <div style="font-size:34px;font-weight:850;line-height:1.05;color:#ffffff;margin-bottom:16px;">
        You submit your partner's muraja'a.
      </div>
      <div style="font-size:16px;font-weight:560;line-height:1.45;color:#dbeafe;margin-bottom:14px;">
        In a pair, each student records the other student's revision session.
      </div>
      <div style="font-size:14px;font-weight:520;line-height:1.48;color:#cbd5e1;">
        This cross-submission flow was designed for trustworthiness: progress is confirmed by a partner, not self-reported alone.
      </div>
    `;

    wrap.appendChild(panel);
    document.body.appendChild(wrap);
  });

  await page.waitForTimeout(5600);
  await page.evaluate(() => document.getElementById('pw-cross-submit-intro')?.remove());
  await page.waitForTimeout(700);
}

async function callout(page, locator, title, body, durationMs = 3200) {
  await locator.waitFor({ state: 'visible', timeout: 12000 });
  const box = await locator.boundingBox();
  if (!box) return;

  await page.evaluate(({ b, titleText, bodyText }) => {
    document.querySelectorAll('.pw-clean-callout').forEach((el) => el.remove());

    if (!document.getElementById('pw-clean-callout-style')) {
      const style = document.createElement('style');
      style.id = 'pw-clean-callout-style';
      style.textContent = `
        @keyframes pwCleanPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(14,165,233,.22), 0 12px 34px rgba(14,165,233,.18); }
          50% { box-shadow: 0 0 0 7px rgba(14,165,233,.08), 0 18px 44px rgba(14,165,233,.26); }
        }
      `;
      document.head.appendChild(style);
    }

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const pad = 8;
    const targetCx = b.x + b.width / 2;
    const targetCy = b.y + b.height / 2;
    const ring = document.createElement('div');
    ring.className = 'pw-clean-callout';
    ring.style.cssText = `
      position: fixed;
      left: ${Math.max(6, b.x - pad)}px;
      top: ${Math.max(6, b.y - pad)}px;
      width: ${Math.min(viewportW - 12, b.width + pad * 2)}px;
      height: ${b.height + pad * 2}px;
      border: 2px solid #0ea5e9;
      border-radius: 10px;
      animation: pwCleanPulse 1.25s ease-in-out infinite;
      pointer-events: none;
      z-index: 2147483639;
    `;

    const cardW = Math.min(318, viewportW - 28);
    const cardH = 108;
    const above = b.y > cardH + 24;
    const cardLeft = Math.min(Math.max(14, targetCx - cardW / 2), viewportW - cardW - 14);
    const cardTop = above
      ? Math.max(12, b.y - cardH - 20)
      : Math.min(viewportH - cardH - 86, b.y + b.height + 20);
    const cardCx = cardLeft + cardW / 2;
    const cardAnchorY = above ? cardTop + cardH : cardTop;

    const card = document.createElement('div');
    card.className = 'pw-clean-callout';
    card.style.cssText = `
      position: fixed;
      left: ${cardLeft}px;
      top: ${cardTop}px;
      width: ${cardW}px;
      min-height: ${cardH}px;
      box-sizing: border-box;
      padding: 12px 14px;
      border-radius: 10px;
      background: rgba(15,23,42,.96);
      color: #f8fafc;
      border: 1px solid rgba(226,232,240,.22);
      box-shadow: 0 16px 42px rgba(15,23,42,.42);
      font-family: "Segoe UI", system-ui, sans-serif;
      pointer-events: none;
      z-index: 2147483641;
    `;
    card.innerHTML = `
      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7dd3fc;margin-bottom:5px;">
        ${titleText}
      </div>
      <div style="font-size:14px;font-weight:550;line-height:1.42;color:#f8fafc;">
        ${bodyText}
      </div>
    `;

    const line = document.createElement('div');
    line.className = 'pw-clean-callout';
    const dx = targetCx - cardCx;
    const dy = targetCy - cardAnchorY;
    const length = Math.max(28, Math.sqrt(dx * dx + dy * dy) - 12);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    line.style.cssText = `
      position: fixed;
      left: ${cardCx}px;
      top: ${cardAnchorY}px;
      width: ${length}px;
      height: 2px;
      background: #38bdf8;
      transform-origin: left center;
      transform: rotate(${angle}deg);
      pointer-events: none;
      z-index: 2147483640;
    `;

    const arrow = document.createElement('div');
    arrow.className = 'pw-clean-callout';
    arrow.style.cssText = `
      position: fixed;
      left: ${targetCx - 6}px;
      top: ${targetCy - 6}px;
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-left: 10px solid #38bdf8;
      transform: rotate(${angle}deg);
      pointer-events: none;
      z-index: 2147483642;
    `;

    document.body.append(ring, line, arrow, card);
  }, { b: box, titleText: title, bodyText: body });

  await page.waitForTimeout(durationMs);
}

async function showJuzDropdownPreview(page, locator, durationMs = 2600) {
  await locator.waitFor({ state: 'visible', timeout: 12000 });
  const box = await locator.boundingBox();
  if (!box) return;

  await page.evaluate(({ b, selected }) => {
    document.querySelectorAll('.pw-juz-preview').forEach((el) => el.remove());

    const viewportW = window.innerWidth;
    const left = Math.min(Math.max(14, b.x), viewportW - 284);
    const top = Math.min(window.innerHeight - 276, b.y + b.height + 8);
    const options = [
      ['13', 'Juz 13 — Yusuf 53'],
      ['14', 'Juz 14 — Al-Hijr 1'],
      ['15', 'Juz 15 — Al-Isra 1'],
      ['16', 'Juz 16 — Al-Kahf 75'],
      ['17', 'Juz 17 — Al-Anbiya 1'],
    ];

    const menu = document.createElement('div');
    menu.className = 'pw-juz-preview';
    menu.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      width: 270px;
      max-width: calc(100vw - 28px);
      padding: 6px;
      box-sizing: border-box;
      background: #ffffff;
      border: 1px solid rgba(15,23,42,.18);
      border-radius: 10px;
      box-shadow: 0 18px 44px rgba(15,23,42,.24);
      z-index: 2147483643;
      pointer-events: none;
      font-family: "Segoe UI", system-ui, sans-serif;
    `;

    menu.innerHTML = options.map(([value, label]) => {
      const active = value === selected;
      return `
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          padding:9px 10px;
          border-radius:8px;
          color:${active ? '#075985' : '#0f172a'};
          background:${active ? '#e0f2fe' : 'transparent'};
          font-size:13px;
          font-weight:${active ? 800 : 540};
          line-height:1.25;
        ">
          <span>${label}</span>
          ${active ? '<span style="font-size:12px;font-weight:900;">Selected</span>' : ''}
        </div>
      `;
    }).join('');

    document.body.appendChild(menu);
  }, { b: box, selected: SUBMISSION.juz });

  await page.waitForTimeout(durationMs);
  await page.evaluate(() => document.querySelectorAll('.pw-juz-preview').forEach((el) => el.remove()));
}

async function explain(page, locator, title, body, durationMs = 3200) {
  await slowScrollTo(page, locator);
  await callout(page, locator, title, body, durationMs);
  await clearCallouts(page);
}

async function fillNumberField(page, locator, title, body, value) {
  await explain(page, locator, title, body, 3300);
  await locator.tap();
  await locator.fill(value);
  await pause(page, 850);
}

// ════════════════════════════════════════════════════════════════════════════
test('submit muraja and edit submission only (mobile)', async ({ page }) => {
  test.setTimeout(600_000);
  prepareDemoStudent();

  await page.goto('/login');
  await injectCursor(page);
  await crossSubmitIntro(page);

  // ── Login ────────────────────────────────────────────────────────────────
  const studentId = page.locator('#student_id').first();
  await explain(
    page,
    studentId,
    'Student Login',
    `Use one student for the whole demo: ${STUDENT.id}.`,
    3300
  );
  await liveType(page, '#student_id', STUDENT.id, 105);
  await pause(page, 850);

  const password = page.locator('input[type="password"]').first();
  await explain(
    page,
    password,
    'Password',
    'Enter the assigned password, then sign in to reach the student dashboard.',
    3300
  );
  await liveType(page, 'input[type="password"]', STUDENT.password, 105);
  await pause(page, 850);

  const signIn = page.locator('button[type="submit"]').first();
  await explain(
    page,
    signIn,
    'Sign In',
    'After sign in, the dashboard opens directly because onboarding is already complete.',
    3200
  );
  await signIn.tap();
  await page.waitForURL('**/student/dashboard', { timeout: 15000 });
  await injectCursor(page);
  await pause(page, 1300);

  // ── Submit Muraja'a ──────────────────────────────────────────────────────
  const form = page.locator('[data-onboard="submission-form"]').first();
  await expect(form).toBeVisible({ timeout: 15000 });
  await explain(
    page,
    form,
    'Submit Muraja\'a',
    'This card is the daily submission area. Fill the juz, page range, and time spent, then submit once.',
    4000
  );

  const juzField = form.locator('[data-onboard="juz-field"]').first();
  await explain(
    page,
    juzField,
    'Juz Revised',
    'Open the Juz dropdown and choose the Juz that was revised in the session.',
    3400
  );
  await showJuzDropdownPreview(page, juzField, 3000);
  await juzField.selectOption(SUBMISSION.juz);
  await pause(page, 900);

  const numberInputs = form.locator('input[type="number"]');
  await fillNumberField(
    page,
    numberInputs.nth(0),
    'Start Page',
    'Enter the first page revised in the session.',
    SUBMISSION.pageFrom
  );
  await fillNumberField(
    page,
    numberInputs.nth(1),
    'End Page',
    'Enter the last page revised. The app calculates pages covered from the start and end page.',
    SUBMISSION.pageTo
  );
  await fillNumberField(
    page,
    numberInputs.nth(2),
    'Minutes Spent',
    'Enter how many minutes the revision session took.',
    SUBMISSION.minutes
  );

  const submitBtn = form.locator('[data-onboard="submit-btn"]').first();
  await explain(
    page,
    submitBtn,
    'Submit Revision',
    'Tap once to save today\'s muraja\'a. The app then replaces the form with a saved confirmation card.',
    3900
  );
  await submitBtn.tap();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1800);
  await injectCursor(page);

  await explain(
    page,
    form,
    'Submitted State',
    'The saved card now shows the exact juz, page range, minutes, and pages covered for today.',
    3900
  );

  // ── Edit Submission ──────────────────────────────────────────────────────
  const editBtn = form.getByRole('button', { name: 'Edit', exact: true });
  await expect(editBtn).toBeVisible({ timeout: 12000 });
  await explain(
    page,
    editBtn,
    'Edit Submission',
    'Tap Edit when the submitted values need correction. This keeps the same record instead of creating a duplicate.',
    4200
  );
  await editBtn.tap();
  await page.waitForTimeout(1500);
  await injectCursor(page);

  const editInputs = form.locator('input[type="number"]');
  await fillNumberField(
    page,
    editInputs.nth(0),
    'Correct Start Page',
    'If the first page was entered incorrectly, replace it with the correct starting page.',
    EDITED.pageFrom
  );
  await fillNumberField(
    page,
    editInputs.nth(1),
    'Correct End Page',
    'If the ending page was entered incorrectly, replace it with the correct last page.',
    EDITED.pageTo
  );
  await fillNumberField(
    page,
    editInputs.nth(2),
    'Correct Minutes',
    'If the time was entered incorrectly, replace it with the correct number of minutes.',
    EDITED.minutes
  );

  const saveBtn = form.getByRole('button', { name: 'Save Changes', exact: true });
  await explain(
    page,
    saveBtn,
    'Save Changes',
    'Save the correction. The app marks this submission as edited so the change is transparent later.',
    4100
  );
  await saveBtn.tap();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1800);
  await injectCursor(page);

  await explain(
    page,
    form,
    'Edited Submission',
    'The same submission card now displays the corrected page range and corrected minutes.',
    3800
  );

  const editedSummary = form.getByText(`${EDITED.pageFrom}–${EDITED.pageTo}`, { exact: false }).first();
  await expect(editedSummary).toBeVisible({ timeout: 12000 });
  await explain(
    page,
    editedSummary,
    'Corrected Values Saved',
    'The corrected page range and corrected minutes are now visible in the saved submission card.',
    4300
  );

  await hideCaption(page);
  await caption(page, 'Done — submitted today\'s muraja\'a and edited the saved submission on the same mobile dashboard.', 4000);
  await pause(page, 2400);
});
