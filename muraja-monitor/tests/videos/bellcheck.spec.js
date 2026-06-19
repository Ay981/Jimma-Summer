import { test, chromium } from '@playwright/test';

test('bell click diagnostics', async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
    const context = await browser.newContext({ baseURL: 'http://localhost:8000' });
    const page = await context.newPage();
    const logs = [];
    page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}\n${e.stack || ''}`));

    await page.goto('/login');
    await page.fill('#student_id', 'JUMU-2026-025');
    await page.fill('#password', 'Test@1446');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/**', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    const bell = page.locator('[data-onboard="notif-bell"]');
    console.log('bell count:', await bell.count());
    await bell.click().catch((e) => console.log('click err:', e.message));
    await page.waitForTimeout(500);

    const dropdownText = await page.locator('text=Notifications').count();
    console.log('dropdown "Notifications" header count after click:', dropdownText);
    const enableBtn = await page.getByRole('button', { name: /enable browser notifications/i }).count();
    console.log('enable button count:', enableBtn);

    console.log('--- LOGS ---');
    logs.forEach((l) => console.log(l));
    await browser.close();
});
