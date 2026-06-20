/**
 * SMOKE TESTS (assertion-based, not a walkthrough video).
 *
 * Verifies the app boots and the screens changed in the UI-polish + bug-fix
 * work render without runtime errors. Unlike the *.spec.js walkthroughs, this
 * makes real assertions and fails loudly.
 *
 * Requires the dev server running at http://localhost:8000 with seeded data.
 *
 *   Student check runs as-is (seeded creds below).
 *   Admin checks are gated — supply a working admin password:
 *     ADMIN_PW='yourpassword' npx playwright test tests/videos/smoke.spec.js
 *
 * Run: npx playwright test tests/videos/smoke.spec.js
 */

import { test, expect } from '@playwright/test';

const STUDENT = { id: 'JUMU-2026-025', pw: 'Test@1446' };
const ADMIN   = { id: process.env.ADMIN_ID || 'ADMIN001', pw: process.env.ADMIN_PW || '' };

async function login(page, id, pw) {
    await page.goto('/login');
    await page.fill('#student_id', id);
    await page.fill('#password', pw);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
}

// ── Student: dashboard + the polished notification dropdown ──────────────────
test('student dashboard boots with no uncaught errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await login(page, STUDENT.id, STUDENT.pw);
    await expect(page).toHaveURL(/\/student\//, { timeout: 20000 });

    // Notification bell + dropdown (now also hosts EnableNotifications /
    // EnableBiometricLock rows from this session's work).
    const bell = page.locator('[data-onboard="notif-bell"]');
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(page.getByText('Notifications').first()).toBeVisible();

    expect(errors, 'no uncaught JS exceptions on the student dashboard').toEqual([]);
});

// ── Admin: the two pages whose controllers changed this session ──────────────
test('admin integrity self-filed tab + program report render', async ({ page }) => {
    test.skip(!ADMIN.pw, 'Set ADMIN_PW to run the admin checks');

    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await login(page, ADMIN.id, ADMIN.pw);
    test.skip(/change-password/.test(page.url()), 'admin must change password first');
    await expect(page).toHaveURL(/\/admin\//, { timeout: 20000 });

    // Integrity fix: the anomaly tab is now "Self-Filed" (was "Proxy Filed").
    await page.goto('/admin/integrity');
    const selfTab = page.getByRole('button', { name: /Self-Filed/ });
    await expect(selfTab).toBeVisible();
    await selfTab.click();
    await expect(
        page.getByText(/cross-submission rule|All cross-filed/i),
    ).toBeVisible();

    // Program report fix: must render the PDF (200), not 500 on the missing
    // recovered/logins keys.
    const resp = await page.request.get('/admin/reports/program-report');
    expect(resp.status(), 'program report returns 200').toBe(200);
    expect(resp.headers()['content-type']).toContain('pdf');

    expect(errors, 'no uncaught JS exceptions on admin pages').toEqual([]);
});
