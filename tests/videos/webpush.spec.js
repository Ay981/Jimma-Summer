import { test, expect, chromium } from '@playwright/test';

test('web push opt-in registers a web device token', async () => {
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-features=PermissionsPolicyUnload',
        ],
    });
    const context = await browser.newContext({
        baseURL: 'http://localhost:8000',
    });
    await context.grantPermissions(['notifications'], { origin: 'http://localhost:8000' });
    const page = await context.newPage();
    const logs = [];
    page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

    // ── Login as Aisha ──
    await page.goto('/login');
    await page.fill('#student_id', 'JUMU-2026-025');
    await page.fill('#password', 'Test@1446');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/**', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    console.log('URL after login:', page.url());

    // Permission is pre-granted in this context, so the hook auto-registers
    // the token silently on load. Watch for that /push/register call.
    const respPromise = page.waitForResponse(
        (r) => r.url().includes('/push/register'),
        { timeout: 25000 },
    ).catch(() => null);

    // Reload to trigger the on-load sync (fresh window, __webPushSynced reset).
    await page.reload();
    await page.waitForLoadState('networkidle');

    const state = await page.evaluate(async () => ({
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'no-Notification',
        hasSW: 'serviceWorker' in navigator,
        secureContext: window.isSecureContext,
        capacitor: !!window.Capacitor,
        webPushSynced: window.__webPushSynced,
    })).catch((e) => ({ evalError: e.message }));
    console.log('BROWSER STATE:', JSON.stringify(state));

    const resp = await respPromise;
    if (resp) {
        console.log('push/register status:', resp.status());
        console.log('push/register payload:', resp.request().postData());
    } else {
        console.log('push/register: NO REQUEST SEEN');
    }

    console.log('--- BROWSER LOGS ---');
    logs.forEach((l) => console.log(l));

    await browser.close();
});
