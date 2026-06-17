/**
 * capture-onboarding.mjs
 *
 * 1. Captures annotated screenshots for the student and leader onboarding guides.
 * 2. Generates student-guide.pdf and leader-guide.pdf via Playwright's PDF renderer.
 *
 * Usage:
 *   node scripts/capture-onboarding.mjs
 *   php artisan onboarding:capture   (preferred — ensures demo account exists first)
 *
 * Environment:
 *   APP_URL  — base URL of the running app (default: http://192.168.0.173:8000)
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// ── Paths ─────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.APP_URL ?? 'http://192.168.0.173:8000';
const OUT_DIR  = path.resolve(fileURLToPath(import.meta.url), '../../storage/app/private/onboarding');
const PUB_DIR  = path.resolve(fileURLToPath(import.meta.url), '../../public');

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Chromium discovery ────────────────────────────────────────────────────────

function findChromium() {
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
        return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    }
    const roots = [
        path.join(process.env.HOME || '/root', '.cache', 'ms-playwright'),
        path.join('/home/aymen', '.cache', 'ms-playwright'),
    ];
    const finders = [
        r => { const d = fs.readdirSync(r).find(n => n.startsWith('chromium_headless_shell-')); return d ? path.join(r, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell') : null; },
        r => { const d = fs.readdirSync(r).find(n => n.startsWith('chromium-'));              return d ? path.join(r, d, 'chrome-linux64', 'chrome')                              : null; },
    ];
    for (const root of roots) {
        if (!fs.existsSync(root)) continue;
        for (const fn of finders) {
            try { const p = fn(root); if (p && fs.existsSync(p)) return p; } catch { /* skip */ }
        }
    }
    return undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const written  = [];
const skipped  = [];

async function shot(page, name, fullPage = false) {
    const p = path.join(OUT_DIR, `${name}.jpg`);
    await page.screenshot({ path: p, type: 'jpeg', quality: 88, fullPage });
    written.push(name);
    console.log(`  ✓ ${name}.jpg`);
}

async function waitFor(page, sel, timeout = 8000) {
    await page.waitForSelector(sel, { timeout }).catch(() => {
        console.warn(`  [warn] "${sel}" not found within ${timeout}ms`);
    });
}

async function login(page, studentId, password) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#student_id', { timeout: 15000 });
    await page.fill('#student_id', studentId);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
    const cur = page.url();
    if (cur.includes('change-password') || cur.includes('profile/complete')) {
        console.log(`  [info] Post-login redirect → ${cur}`);
    }
}

// ── Arrow annotation overlay ──────────────────────────────────────────────────
//
// For each selector, draws:
//   • dashed red highlight rectangle around the element
//   • dark-green numbered badge at the element's top-right corner (outside)
//   • short red arrow from the badge pointing into the element
//
// Returns an async cleanup function that removes the overlay.

async function annotate(page, sels) {
    const PAD = 5;   // padding around highlight rect
    const BR  = 14;  // badge circle radius

    const boxes = [];
    for (let i = 0; i < sels.length; i++) {
        const box = await page.locator(sels[i]).first().boundingBox().catch(() => null);
        if (box) boxes.push({ n: i + 1, box });
        else console.warn(`  [annotate] selector not found: ${sels[i]}`);
    }
    if (!boxes.length) return () => Promise.resolve();

    const vp  = page.viewportSize() ?? { width: 1280, height: 800 };
    const oid = `__oa${Date.now()}`;

    await page.evaluate(({ items, PAD, BR, oid, vw }) => {
        const NS  = 'http://www.w3.org/2000/svg';
        const mk  = (tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v)); return e; };
        const mid  = `m${oid}`;

        const svg  = mk('svg', { id: oid, style: `position:fixed;top:0;left:0;width:${vw}px;height:100vh;pointer-events:none;z-index:99999;overflow:visible` });
        const defs = mk('defs', {});
        const mkr  = mk('marker', { id: mid, markerWidth:'10', markerHeight:'7', refX:'9', refY:'3.5', orient:'auto' });
        mkr.appendChild(mk('polygon', { points:'0 0,10 3.5,0 7', fill:'#dc2626' }));
        defs.appendChild(mkr);
        svg.appendChild(defs);

        items.forEach(({ n, box }) => {
            const rx = box.x - PAD, ry = box.y - PAD;
            const rw = box.width + PAD * 2, rh = box.height + PAD * 2;

            // Highlight rect
            svg.appendChild(mk('rect', {
                x: rx, y: ry, width: rw, height: rh, rx: 6,
                fill: 'rgba(220,38,38,0.07)', stroke: '#dc2626',
                'stroke-width': '2.5', 'stroke-dasharray': '7 3',
            }));

            // Badge centre — top-right, slightly outside the rect
            const bx = Math.min(rx + rw, vw - BR - 2);
            const by = Math.max(ry,       BR + 2);

            // Arrow: from badge centre toward element centre, 28px long
            const ecx = box.x + box.width  / 2;
            const ecy = box.y + box.height / 2;
            const dx  = ecx - bx, dy = ecy - by;
            const len = Math.hypot(dx, dy) || 1;
            const ux  = dx / len, uy = dy / len;

            svg.appendChild(mk('line', {
                x1: bx + ux * BR,         y1: by + uy * BR,
                x2: bx + ux * (BR + 28),  y2: by + uy * (BR + 28),
                stroke: '#dc2626', 'stroke-width': '2',
                'marker-end': `url(#${mid})`,
            }));

            // Badge circle
            svg.appendChild(mk('circle', { cx: bx, cy: by, r: BR, fill: '#1a3a2a' }));

            // Badge number
            const t = mk('text', { x: bx, y: by + 4, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': '12', 'font-weight': '700', 'font-family': 'Arial, sans-serif', fill: 'white' });
            t.textContent = String(n);
            svg.appendChild(t);
        });

        document.body.appendChild(svg);
    }, { items: boxes, PAD, BR, oid, vw: vp.width });

    return () => page.evaluate(id => document.getElementById(id)?.remove(), oid);
}

// ── Student captures ──────────────────────────────────────────────────────────

async function captureStudent(browser) {
    console.log('\n── Student screenshots ──────────────────────────────────────');

    // ── 1. Login page (guest — show demo ID filled in) ────────────────────────
    {
        const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await ctx.newPage();
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#student_id', { timeout: 12000 });
        await page.fill('#student_id', 'JUMU-1446-010');
        await page.fill('#password', 'MyPassword@123');
        const rm = await annotate(page, ['#student_id', '#password', 'button[type="submit"]']);
        await shot(page, 'login');
        await rm();
        await ctx.close();
    }

    // ── 3. Profile completion (JUMU-1446-010 with profile_completed=false) ────
    {
        const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await login(page, 'JUMU-1446-010', 'Student@123');
        // Redirect should land on /student/profile/complete
        if (!page.url().includes('profile/complete')) {
            await page.goto(`${BASE_URL}/student/profile/complete`, { waitUntil: 'networkidle' });
        }
        await waitFor(page, '[data-onboard="memo-level"]', 10000);
        const rm = await annotate(page, [
            '[data-onboard="memo-level"]',
            '[data-onboard="available-days"]',
            '[data-onboard="telegram-input"]',
            '[data-onboard="complete-btn"]',
        ]);
        await shot(page, 'profile-complete', true);
        await rm();
        await ctx.close();
    }

    // ── 2 + 4–9 via STU001 ────────────────────────────────────────────────────
    {
        const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await ctx.newPage();
        await login(page, 'STU001', 'Student@123');

        // 2. Change password page
        await page.goto(`${BASE_URL}/change-password`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#password', { timeout: 8000 });
        const rmPwd = await annotate(page, ['#password', '#password_confirmation', 'button[type="submit"]']);
        await shot(page, 'change-password');
        await rmPwd();

        // 4. Dashboard overview
        await page.goto(`${BASE_URL}/student/dashboard`, { waitUntil: 'networkidle' });
        await waitFor(page, '[data-onboard="stat-cards"]');
        const rmDash = await annotate(page, ['[data-onboard="stat-cards"]', '[data-onboard="submission-form"]']);
        await shot(page, 'student-dashboard');
        await rmDash();

        // 5. Check-in close-up (scroll form into view)
        await page.goto(`${BASE_URL}/student/dashboard`, { waitUntil: 'networkidle' });
        await waitFor(page, '[data-onboard="submission-form"]');
        await page.locator('[data-onboard="submission-form"]').scrollIntoViewIfNeeded().catch(() => {});
        const rmCheckin = await annotate(page, ['[data-onboard="juz-field"]', '[data-onboard="submit-btn"]']);
        await shot(page, 'student-checkin');
        await rmCheckin();

        // 6. My Partner
        await page.goto(`${BASE_URL}/student/pair`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        const hasPartner = await page.locator('[data-onboard="partner-card"]').count();
        const hasPairInput = await page.locator('input[placeholder*="Student ID"]').count();
        let rmPair = () => Promise.resolve();
        if (hasPartner) {
            rmPair = await annotate(page, ['[data-onboard="partner-card"]', '[data-onboard="partner-history"]']);
        } else if (hasPairInput) {
            rmPair = await annotate(page, ['input[placeholder*="Student ID"]', 'button[type="submit"]']);
        } else {
            skipped.push('student-pair annotations (no partner card or request form visible)');
        }
        await shot(page, 'student-pair');
        await rmPair();

        // 7. Journal
        await page.goto(`${BASE_URL}/student/journal`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);
        const hasJournalForm = await page.locator('[data-onboard="journal-textarea"]').count();
        let rmJournal = () => Promise.resolve();
        if (hasJournalForm) {
            rmJournal = await annotate(page, ['[data-onboard="journal-textarea"]', '[data-onboard="journal-submit"]']);
        }
        await shot(page, 'student-journal');
        await rmJournal();

        // 8. History
        await page.goto(`${BASE_URL}/student/history`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);
        const hasHistTable = await page.locator('[data-onboard="history-table"]').count();
        let rmHist = () => Promise.resolve();
        if (hasHistTable) {
            const sels = ['[data-onboard="history-table"]'];
            const hasEdit = await page.locator('[data-onboard="edit-btn"]').count();
            if (hasEdit) sels.push('[data-onboard="edit-btn"]');
            rmHist = await annotate(page, sels);
        }
        await shot(page, 'student-history');
        await rmHist();

        // 9. Badges
        await page.goto(`${BASE_URL}/student/badges`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);
        const hasBadgeGrid = await page.locator('[data-onboard="badge-grid"]').count();
        let rmBadge = () => Promise.resolve();
        if (hasBadgeGrid) {
            rmBadge = await annotate(page, ['[data-onboard="badge-grid"]']);
        }
        await shot(page, 'student-badges');
        await rmBadge();

        await ctx.close();
    }
}

// ── Leader captures ───────────────────────────────────────────────────────────

async function captureLeader(browser) {
    console.log('\n── Leader screenshots ───────────────────────────────────────');

    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await login(page, 'LDR001', 'Leader@123');

    // 2. Change password (leader view shows Full Name field)
    await page.goto(`${BASE_URL}/change-password`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#password', { timeout: 8000 });
    const selsLeaderPwd = ['#password', '#password_confirmation', 'button[type="submit"]'];
    const hasNameField = await page.locator('#name').count();
    if (hasNameField) selsLeaderPwd.unshift('#name');
    const rmLPwd = await annotate(page, selsLeaderPwd);
    await shot(page, 'leader-change-password');
    await rmLPwd();

    // 3. Leader dashboard
    await page.goto(`${BASE_URL}/leader/dashboard`, { waitUntil: 'networkidle' });
    await waitFor(page, '[data-onboard="pulse-meter"]');
    const rmLDash = await annotate(page, [
        '[data-onboard="pulse-meter"]',
        '[data-onboard="summary-pills"]',
        '[data-onboard="pair-list"]',
    ]);
    await shot(page, 'leader-dashboard');
    await rmLDash();

    // 4. Pair detail — click first pair link
    await page.goto(`${BASE_URL}/leader/dashboard`, { waitUntil: 'networkidle' });
    await waitFor(page, '[data-onboard="pair-list"]');
    const firstLink = page.locator('[data-onboard="pair-list"] a').first();
    if (await firstLink.count() > 0) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        await waitFor(page, '[data-onboard="student-heatmap"]', 10000);
        // Switch to Contact Log tab so the contact-log section is visible
        const contactTab = page.locator('button', { hasText: 'Contact Log' }).first();
        if (await contactTab.count() > 0) {
            await contactTab.click();
            await page.waitForTimeout(400);
        }
        const rmDetail = await annotate(page, [
            '[data-onboard="student-heatmap"]',
            '[data-onboard="contact-log"]',
        ]);
        await shot(page, 'leader-pair-detail');
        await rmDetail();
    } else {
        skipped.push('leader-pair-detail (no pair links found)');
        console.warn('  [skip] leader-pair-detail — no pair links');
    }

    // 5. Absence queue (capture dashboard — queue shown if any absences)
    await page.goto(`${BASE_URL}/leader/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const hasAbsence = await page.locator('[data-onboard="absence-queue"]').count();
    let rmOut = () => Promise.resolve();
    if (hasAbsence) rmOut = await annotate(page, ['[data-onboard="absence-queue"]']);
    await shot(page, 'leader-outreach');
    await rmOut();

    // 6. Meetings
    await page.goto(`${BASE_URL}/leader/meetings`, { waitUntil: 'networkidle' });
    await waitFor(page, '[data-onboard="new-meeting-btn"]');
    const meetSels = ['[data-onboard="new-meeting-btn"]'];
    const hasActionItems = await page.locator('[data-onboard="action-items-list"]').count();
    if (hasActionItems) meetSels.push('[data-onboard="action-items-list"]');
    const rmMeet = await annotate(page, meetSels);
    await shot(page, 'leader-meetings');
    await rmMeet();

    await ctx.close();
}

// ── PDF generation ────────────────────────────────────────────────────────────

function loadShot(name) {
    const p = path.join(OUT_DIR, `${name}.jpg`);
    return fs.existsSync(p) ? `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}` : null;
}

function loadLogo() {
    const p = path.join(PUB_DIR, 'images', 'logo.jpg');
    return fs.existsSync(p) ? `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}` : null;
}

const PDF_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}

body{
    font-family:'Liberation Serif','Times New Roman',Georgia,serif;
    font-size:11pt;color:#1c1c1e;background:#fff;line-height:1.6;
}

/* ── Page shell ─────────────────────────────────────────────────────── */
.pg{
    width:210mm;min-height:297mm;
    page-break-after:always;break-after:page;
    position:relative;background:#fff;overflow:hidden;
}
.pg:last-child{page-break-after:avoid;break-after:avoid}

.stripe{
    height:14px;background:#1a3a2a;
    border-bottom:3px solid rgba(201,162,39,.5);
}

.body{padding:22px 28px 54px}

.ft{
    position:absolute;bottom:0;left:0;right:0;
    padding:8px 28px;border-top:1px solid #e5ede8;
    display:flex;justify-content:space-between;align-items:center;
    font-family:'Liberation Sans',Arial,Helvetica,sans-serif;
    font-size:7.5pt;color:#9ca3af;background:#fff;
}

/* ── Cover page ─────────────────────────────────────────────────────── */
.cover .body{
    padding:68px 40px 54px;
    text-align:center;
}
.c-logo img{height:70px;width:auto;margin-bottom:16px}
.c-org{
    font-family:'Liberation Sans',Arial,Helvetica,sans-serif;
    font-size:8.5pt;font-weight:700;color:#2d6a4f;
    letter-spacing:.13em;text-transform:uppercase;margin-bottom:4px;
}
.c-prog{
    font-family:'Liberation Sans',Arial,Helvetica,sans-serif;
    font-size:8pt;color:#6b7280;letter-spacing:.04em;margin-bottom:30px;
}
.c-title{
    font-family:'Liberation Serif','Times New Roman',Georgia,serif;
    font-size:27pt;font-weight:700;color:#1a3a2a;line-height:1.2;margin-bottom:8px;
}
.c-sub{
    font-family:'Liberation Serif','Times New Roman',Georgia,serif;
    font-size:11.5pt;font-style:italic;color:#6b7280;margin-bottom:36px;
}

/* TOC */
.toc{
    display:inline-block;width:100%;max-width:400px;
    background:#f5f9f7;border:1px solid #c6ddd4;
    border-radius:8px;padding:18px 22px;text-align:left;
}
.toc-h{
    font-family:'Liberation Sans',Arial,Helvetica,sans-serif;
    font-size:8pt;font-weight:700;color:#2d6a4f;
    text-transform:uppercase;letter-spacing:.11em;margin-bottom:12px;
}
.toc-row{
    display:flex;align-items:flex-start;gap:10px;
    padding:5px 0;border-bottom:1px dotted #c6ddd4;
    font-size:10pt;line-height:1.4;
}
.toc-row:last-child{border-bottom:none}
.toc-n{
    flex-shrink:0;width:20px;height:20px;line-height:20px;
    text-align:center;background:#1a3a2a;color:#fff;
    border-radius:50%;
    font-family:'Liberation Sans',Arial,sans-serif;
    font-size:8.5pt;font-weight:700;margin-top:1px;
    display:inline-block;
}

/* ── Step pages ─────────────────────────────────────────────────────── */
.step-of{
    position:absolute;top:22px;right:28px;
    font-family:'Liberation Sans',Arial,sans-serif;
    font-size:8pt;color:#9ca3af;
}
.step-hdr{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
.step-badge{
    flex-shrink:0;width:34px;height:34px;line-height:34px;
    text-align:center;background:#1a3a2a;color:#fff;
    border-radius:50%;
    font-family:'Liberation Sans',Arial,sans-serif;
    font-size:14pt;font-weight:700;margin-top:2px;
    display:inline-block;
}
.step-title{
    font-family:'Liberation Sans',Arial,Helvetica,sans-serif;
    font-size:17pt;font-weight:700;color:#1a3a2a;line-height:1.2;margin-bottom:4px;
}
.step-desc{
    font-family:'Liberation Serif','Times New Roman',Georgia,serif;
    font-size:10.5pt;color:#374151;line-height:1.65;
}

/* Screenshot */
.shot{
    display:block;width:100%;
    max-height:148mm;object-fit:contain;object-position:top left;
    border:1px solid #d8e8df;border-radius:5px;margin:12px 0 10px;
}
.no-shot{
    width:100%;padding:28px;background:#f5f9f7;border:2px dashed #c6ddd4;
    border-radius:5px;text-align:center;margin:12px 0 10px;
    font-family:'Liberation Sans',Arial,sans-serif;font-size:9.5pt;color:#6b7280;
}

/* Callouts */
.callouts{display:flex;flex-wrap:wrap;gap:5px 18px;margin-top:2px}
.callout{
    display:flex;align-items:flex-start;gap:5px;
    font-family:'Liberation Serif','Times New Roman',Georgia,serif;
    font-size:9pt;color:#374151;line-height:1.4;
}
.cn{
    flex-shrink:0;display:inline-block;
    width:16px;height:16px;line-height:16px;text-align:center;
    background:#dc2626;color:#fff;border-radius:50%;
    font-family:'Liberation Sans',Arial,sans-serif;
    font-size:7.5pt;font-weight:700;margin-top:1px;
}

@media print{
    .pg{page-break-after:always}
    .pg:last-child{page-break-after:avoid}
}
`.trim();

function buildPdfHtml(type, screens, logoData) {
    const title = type === 'student' ? 'Student Onboarding Guide' : 'Leader Onboarding Guide';
    const sub   = type === 'student'
        ? 'A step-by-step visual guide to using Muraja Monitor'
        : 'A step-by-step visual guide for halqa leaders';

    const tocRows = screens.map(s =>
        `<div class="toc-row"><span class="toc-n">${s.num}</span><span>${s.title}</span></div>`
    ).join('\n');

    const coverLogoHtml = logoData
        ? `<div class="c-logo"><img src="${logoData}" alt="Muraja'ah Summer"></div>`
        : '';

    const cover = `
<div class="pg cover">
    <div class="stripe"></div>
    <div class="body">
        ${coverLogoHtml}
        <div class="c-org">Muraja&rsquo;ah Summer Program</div>
        <div class="c-prog">Jimma University Muslim Students Union &mdash; Summer 1446</div>
        <h1 class="c-title">${title}</h1>
        <p class="c-sub">${sub}</p>
        <div class="toc">
            <div class="toc-h">Contents</div>
            ${tocRows}
        </div>
    </div>
    <div class="ft">
        <span>Muraja Monitor &mdash; ${title}</span>
        <span>Confidential &mdash; internal use only</span>
    </div>
</div>`;

    const stepPages = screens.map(s => {
        const imgSrc = loadShot(s.file);
        const imgHtml = imgSrc
            ? `<img class="shot" src="${imgSrc}" alt="${s.title}">`
            : `<div class="no-shot">Screenshot not yet available — run <strong>php artisan onboarding:capture</strong></div>`;

        const calloutHtml = s.callouts.map((text, i) =>
            `<div class="callout"><span class="cn">${i + 1}</span><span>${text}</span></div>`
        ).join('\n');

        return `
<div class="pg step">
    <div class="stripe"></div>
    <span class="step-of">Step ${s.num} / ${screens.length}</span>
    <div class="body">
        <div class="step-hdr">
            <span class="step-badge">${s.num}</span>
            <div>
                <div class="step-title">${s.title}</div>
                <div class="step-desc">${s.desc}</div>
            </div>
        </div>
        ${imgHtml}
        <div class="callouts">${calloutHtml}</div>
    </div>
    <div class="ft">
        <span>Muraja Monitor &mdash; ${title}</span>
        <span>Step ${s.num} of ${screens.length}</span>
    </div>
</div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} &mdash; Muraja Monitor</title>
<style>${PDF_CSS}</style>
</head>
<body>
${cover}
${stepPages}
</body>
</html>`;
}

// ── Guide content definitions ─────────────────────────────────────────────────

const STUDENT_SCREENS = [
    {
        num: 1, file: 'login', title: 'Signing In',
        desc: 'Open the Muraja Monitor link your halqa leader shared with you. Enter your Student ID (e.g. JUMU-1446-010) and the default password. Click Sign In — on your very first login you will be taken to the password setup page.',
        callouts: [
            'Student ID &mdash; provided by your halqa leader',
            'Password &mdash; use the default on first login, then you will set your own',
            'Sign In &mdash; click to access your account',
        ],
    },
    {
        num: 2, file: 'change-password', title: 'Setting Your Password',
        desc: 'On your first login, you must create a personal password before you can use the app. Choose something strong and easy to remember &mdash; at least 8 characters. You will not be asked to do this again.',
        callouts: [
            'New password &mdash; choose something strong, at least 8 characters long',
            'Confirm password &mdash; retype your new password exactly to confirm',
            'Save &amp; Continue &mdash; tap here to set your password and move forward',
        ],
    },
    {
        num: 3, file: 'profile-complete', title: 'Completing Your Profile',
        desc: 'Before you can use the app, fill in your profile. This helps your halqa leader match you with a compatible muraja&rsquo;a partner. All fields marked with an asterisk (*) are required.',
        callouts: [
            'Memorization level &mdash; select how many juz you have memorized',
            'Available days &mdash; the days you can do muraja&rsquo;a (this determines your streak schedule)',
            'Telegram username &mdash; enter without the @; your partner will use this to contact you',
            'Complete Profile &mdash; submit when all fields are filled to enter the app',
        ],
    },
    {
        num: 4, file: 'student-dashboard', title: 'Your Dashboard',
        desc: 'The dashboard is your home base. It shows your personal stats at a glance, the daily check-in form for submitting your revision, and a 30-day activity heatmap. You will land here every time you log in.',
        callouts: [
            'Stat cards &mdash; your consistency score, current streak, and total pages submitted',
            'Today&rsquo;s Revision &mdash; use this card to log your daily muraja&rsquo;a',
        ],
    },
    {
        num: 5, file: 'student-checkin', title: 'Daily Check-in',
        desc: 'Each day you complete a muraja&rsquo;a session, log it using the check-in form. Select the juz you revised, the page range, and how many minutes you spent. Press Submit &mdash; it records immediately and updates your streak.',
        callouts: [
            'Juz selector &mdash; choose the juz you revised in today&rsquo;s session',
            'Submit &mdash; tap to record today&rsquo;s revision and update your activity',
        ],
    },
    {
        num: 6, file: 'student-pair', title: 'My Partner',
        desc: 'Once your halqa leader assigns you a partner, their contact details appear here. You can see their name, phone number, and Telegram handle, and browse their recent submission history. If the pairing window is open, you can request a specific partner by entering their Student ID.',
        callouts: [
            'Partner card &mdash; your partner&rsquo;s name, phone, and Telegram contact link',
            'Partner history &mdash; their recent revision submissions',
        ],
    },
    {
        num: 7, file: 'student-journal', title: 'Journal',
        desc: 'After submitting your revision, write a short reflection in the journal. Record what you revised, how the session went, and what you want to focus on next. Consistent reflection helps build stronger, more intentional habits over time.',
        callouts: [
            'Reflection field &mdash; write about what you revised, how it went, and any focus areas',
            'Save Reflection &mdash; tap to save your entry for today',
        ],
    },
    {
        num: 8, file: 'student-history', title: 'Submission History',
        desc: 'Browse all your past revisions filtered by month. If you filed a submission yourself, you can edit it within the allowed editing window. Submissions entered by your halqa leader cannot be edited by students.',
        callouts: [
            'Monthly history table &mdash; all submissions for the selected month',
            'Edit button &mdash; appears on rows you submitted yourself, within the edit window',
        ],
    },
    {
        num: 9, file: 'student-badges', title: 'Badges',
        desc: 'Earn badges by hitting milestones &mdash; maintaining streaks, covering juz, reaching page targets, and more. The next badge hint at the top of the page shows exactly what to work toward to unlock your next achievement.',
        callouts: [
            'Earned badges &mdash; every badge you have unlocked so far; tap any to see details',
        ],
    },
];

const LEADER_SCREENS = [
    {
        num: 1, file: 'login', title: 'Signing In',
        desc: 'Open the Muraja Monitor link and enter your Leader ID and the default password. On your very first login you will be asked to enter your full name and create a personal password before accessing the dashboard.',
        callouts: [
            'Leader ID &mdash; provided by the program administrator',
            'Password &mdash; use the default on first login, then set your own',
            'Sign In &mdash; click to enter the system',
        ],
    },
    {
        num: 2, file: 'leader-change-password', title: 'Account Setup',
        desc: 'On your first login, enter your real full name and create a personal password. Your name will appear on reports, student-facing pages, and program communications. Choose a strong password you will remember.',
        callouts: [
            'Full name &mdash; enter exactly as it should appear in the system and on reports',
            'New password &mdash; minimum 8 characters; make it strong',
            'Save &amp; Continue &mdash; completes your account setup and opens the dashboard',
        ],
    },
    {
        num: 3, file: 'leader-dashboard', title: 'Halqa Dashboard',
        desc: 'Your dashboard shows a live pulse score (today&rsquo;s submission rate for your halqa), a breakdown of pair statuses, and the full pair list with consistency sparklines. This is your primary monitoring view and the first thing you see after logging in.',
        callouts: [
            'Pulse meter &mdash; live today&rsquo;s submission rate as a percentage of your halqa',
            'Status pills &mdash; quick counts of on-track, slipping, at-risk, and inactive pairs',
            'Pair list &mdash; click any row to open the detailed view for that pair',
        ],
    },
    {
        num: 4, file: 'leader-pair-detail', title: 'Pair Detail',
        desc: 'Click any pair row to open their detail panel. Review their 30-day activity heatmap, log a note for every contact you make, and flag suspicious submissions for the admin to review. Each panel shows both students side by side.',
        callouts: [
            '30-day heatmap &mdash; each cell is one day; colour indicates whether they submitted',
            'Contact log &mdash; record every call, message, or in-person check-in here; use this diligently',
        ],
    },
    {
        num: 5, file: 'leader-outreach', title: 'Absence Follow-up',
        desc: 'When pairs miss a session, the absence queue appears at the top of your dashboard. It lists pairs who missed yesterday, ordered by priority. Reach out to each one, mark them as done, or use the Notify all button to send a group reminder in one tap.',
        callouts: [
            'Absence queue &mdash; pairs who missed their session yesterday, sorted by priority',
        ],
    },
    {
        num: 6, file: 'leader-meetings', title: 'Meeting Log',
        desc: 'Keep a structured record of every halqa meeting. Log meeting notes, assign follow-up action items to specific students, and track which items are still open. Unresolved action items from past meetings surface at the top of this page so nothing slips through.',
        callouts: [
            'Log Meeting &mdash; opens the form to record a new halqa meeting and its notes',
            'Action items list &mdash; open tasks from previous meetings still awaiting follow-up',
        ],
    },
];

async function generatePdf(browser, type, screens) {
    console.log(`\n── Generating ${type} PDF ────────────────────────────────────`);
    const logoData = loadLogo();
    const html     = buildPdfHtml(type, screens, logoData);

    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfPath = path.join(OUT_DIR, `${type}-guide.pdf`);
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    await ctx.close();
    console.log(`  ✓ ${type}-guide.pdf`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
    console.log(`Output directory : ${OUT_DIR}`);
    const chromiumPath = findChromium();
    if (chromiumPath) console.log(`Chromium         : ${chromiumPath}`);

    const browser = await chromium.launch({
        headless: true,
        ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    });

    try {
        await captureStudent(browser);
        await captureLeader(browser);
        await generatePdf(browser, 'student', STUDENT_SCREENS);
        await generatePdf(browser, 'leader',  LEADER_SCREENS);
    } finally {
        await browser.close();
    }

    console.log('\n── Summary ──────────────────────────────────────────────────');
    console.log(`Screenshots  (${written.length}): ${written.join(', ')}`);
    if (skipped.length) console.log(`Skipped      (${skipped.length}): ${skipped.join(', ')}`);
    console.log('Done.');
})();
