/**
 * Shared Playwright helpers for Muraja'a Monitor walkthrough videos.
 * All visual overlays (cursor, caption, annotations) are injected into
 * the live page so they appear in the recorded video without post-processing.
 *
 * IMPORTANT: every overlay element must have pointer-events:none so it
 * never intercepts taps/clicks on real page elements.
 */

import { existsSync, readFileSync } from 'fs';

// ── Cursor ────────────────────────────────────────────────────────────────────

export async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('pw-cursor')) return;
    const dot = document.createElement('div');
    dot.id = 'pw-cursor';
    dot.style.cssText = `
      position: fixed; width: 22px; height: 22px;
      background: rgba(220,38,38,0.85); border: 2px solid white;
      border-radius: 50%; pointer-events: none; z-index: 2147483647;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(dot);
    document.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX - 11 + 'px';
      dot.style.top  = e.clientY - 11 + 'px';
    });
  });
}

// ── Caption banner ────────────────────────────────────────────────────────────
// pointer-events: none is CRITICAL — without it the caption blocks all taps.

export async function caption(page, text, durationMs = 2800) {
  await page.evaluate((msg) => {
    let el = document.getElementById('pw-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pw-caption';
      el.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%; transform: translateX(-50%);
        background: rgba(15,23,42,0.92); color: #f8fafc;
        padding: 11px 28px; border-radius: 10px;
        font-size: 15px; font-family: 'Segoe UI', system-ui, sans-serif;
        font-weight: 500; z-index: 2147483646;
        max-width: 85%; text-align: center; line-height: 1.45;
        box-shadow: 0 4px 24px rgba(0,0,0,0.55);
        border: 1px solid rgba(255,255,255,0.12);
        pointer-events: none;
      `;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
  }, text);
  await page.waitForTimeout(durationMs);
}

export async function hideCaption(page) {
  await page.evaluate(() => {
    const el = document.getElementById('pw-caption');
    if (el) el.style.opacity = '0';
  });
}

// ── Field annotation: pulsing amber circle + arrow + label ───────────────────

export async function annotateLocator(page, locator, label) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 8000 });
    const box = await locator.boundingBox();
    if (!box) return;
    await _drawAnnotation(page, box, label);
  } catch { /* skip silently */ }
}

export async function annotate(page, selector, label, opts = {}) {
  try {
    let el = page.locator(selector);
    el = opts.nth !== undefined ? el.nth(opts.nth) : el.first();
    await el.waitFor({ state: 'visible', timeout: 8000 });
    const box = await el.boundingBox();
    if (!box) return;
    await _drawAnnotation(page, box, label);
  } catch { /* skip silently */ }
}

async function _drawAnnotation(page, box, label) {
  await page.evaluate(({ b, lbl }) => {
    if (!document.getElementById('pw-ann-style')) {
      const s = document.createElement('style');
      s.id = 'pw-ann-style';
      s.textContent = `
        @keyframes pwPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(245,158,11,.2), 0 0 20px rgba(245,158,11,.5); }
          50%      { box-shadow: 0 0 0 8px rgba(245,158,11,.05), 0 0 32px rgba(245,158,11,.9); }
        }
      `;
      document.head.appendChild(s);
    }

    const pad = 10;
    const cx  = b.x + b.width / 2;

    const ring = document.createElement('div');
    ring.className = 'pw-ann';
    ring.style.cssText = `
      position: fixed;
      left: ${b.x - pad}px; top: ${b.y - pad}px;
      width: ${b.width + pad * 2}px; height: ${b.height + pad * 2}px;
      border: 3px solid #f59e0b; border-radius: 10px;
      animation: pwPulse 1.1s ease-in-out infinite;
      pointer-events: none; z-index: 2147483638;
    `;

    const spaceAbove = b.y - pad;
    const labelHeight = 44;
    const above  = spaceAbove >= labelHeight + 10;
    const labelY = above ? b.y - pad - labelHeight : b.y + b.height + pad + 4;
    const arrowY = above ? labelY + 30             : labelY - 14;

    const chip = document.createElement('div');
    chip.className = 'pw-ann';
    chip.style.cssText = `
      position: fixed; left: ${cx}px; top: ${labelY}px;
      transform: translateX(-50%);
      background: #f59e0b; color: #1c1917;
      padding: 5px 16px; border-radius: 6px;
      font: 700 13px 'Segoe UI', system-ui, sans-serif;
      white-space: nowrap; z-index: 2147483640;
      box-shadow: 0 3px 12px rgba(0,0,0,.35);
      pointer-events: none;
    `;
    chip.textContent = lbl;

    const arrowBorder = above
      ? 'border-bottom:0; border-top:13px solid #f59e0b;'
      : 'border-top:0; border-bottom:13px solid #f59e0b;';
    const arr = document.createElement('div');
    arr.className = 'pw-ann';
    arr.style.cssText = `
      position: fixed; left: ${cx}px; top: ${arrowY}px;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 9px solid transparent; border-right: 9px solid transparent;
      ${arrowBorder} z-index: 2147483639; pointer-events: none;
    `;

    document.body.append(ring, chip, arr);
  }, { b: box, lbl: label });
}

export async function clearAnnotations(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.pw-ann').forEach(el => el.remove());
  });
}

// ── Interaction helpers ───────────────────────────────────────────────────────
// scrollIntoView with block:'center' keeps elements away from the fixed
// bottom nav (which would intercept taps at the very bottom of the viewport).

export async function moveThenClick(page, selector) {
  const all = page.locator(selector);
  // Wait for at least one DOM match to exist
  await all.first().waitFor({ state: 'attached', timeout: 8000 });
  // Find the first VISIBLE match — skips hidden sidebar nav links on mobile
  const count = await all.count();
  let el = all.first();
  for (let i = 0; i < count; i++) {
    if (await all.nth(i).isVisible()) { el = all.nth(i); break; }
  }
  await el.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await page.waitForTimeout(500);
  await el.tap();
}

export async function liveType(page, selector, text, delay = 75) {
  const all = page.locator(selector);
  await all.first().waitFor({ state: 'attached', timeout: 8000 });
  const count = await all.count();
  let el = all.first();
  for (let i = 0; i < count; i++) {
    if (await all.nth(i).isVisible()) { el = all.nth(i); break; }
  }
  await el.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await page.waitForTimeout(300);
  await el.tap();
  await el.pressSequentially(text, { delay });
}

export async function pause(page, ms = 1800) {
  await page.waitForTimeout(ms);
}

/** Scroll a locator to the centre of the viewport (avoids fixed header/footer). */
export async function scrollTo(page, locator) {
  await locator.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await page.waitForTimeout(350);
}

// ── Screenshot overlay ────────────────────────────────────────────────────────

export async function showImageOverlay(page, imagePath, captionText = '') {
  if (!existsSync(imagePath)) return;
  const base64  = readFileSync(imagePath).toString('base64');
  const ext     = imagePath.split('.').pop().toLowerCase();
  const mime    = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = `data:${mime};base64,${base64}`;

  await page.evaluate(({ src, cap }) => {
    document.getElementById('pw-img-overlay')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'pw-img-overlay';
    wrap.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483644;
      background: rgba(0,0,0,0.88); pointer-events: none;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 24px;
    `;
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `
      max-width: 100%; max-height: 72vh;
      border-radius: 14px;
      box-shadow: 0 8px 48px rgba(0,0,0,.6);
      border: 2px solid rgba(255,255,255,0.12);
    `;
    wrap.appendChild(img);
    if (cap) {
      const p = document.createElement('p');
      p.style.cssText = `
        color:#f8fafc; margin:14px 0 0;
        font: 500 14px 'Segoe UI',system-ui;
        text-align:center; max-width:320px; line-height:1.4;
      `;
      p.textContent = cap;
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
  }, { src: dataUrl, cap: captionText });
}

export async function hideImageOverlay(page) {
  await page.evaluate(() => document.getElementById('pw-img-overlay')?.remove());
}
