import { Head, router } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const RESPONSIVE_CSS = `
.pd-hero { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:20px; }
.pd-hero-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.pd-metric { display:grid; gap:8px; align-items:center; padding:10px 0; }
.pd-metric.has-b { grid-template-columns: 1fr 80px 1fr; }
.pd-metric.solo   { grid-template-columns: 1fr 80px; }
.pd-bar-track { height:8px; border-radius:4px; overflow:hidden; background:var(--muted); flex:1 1 80px; max-width:120px; }
.pd-history-row { display:grid; grid-template-columns:96px 1fr 56px 64px 64px; gap:8px; padding:8px 16px; align-items:center; }
.pd-history-head { display:grid; grid-template-columns:96px 1fr 56px 64px 64px; gap:8px; padding:7px 16px; }
.pd-totals { display:flex; gap:16px; margin-top:14px; flex-wrap:wrap; }
.pd-activity-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.pd-activity-squares { display:flex; gap:3px; flex-wrap:nowrap; overflow-x:auto; }

@media (max-width:600px) {
  .pd-hero { gap:16px; }
  .pd-hero-right { align-items:flex-start; }
  .pd-metric.has-b { grid-template-columns: 1fr 60px 1fr; gap:4px; }
  .pd-bar-track { max-width:70px; }
  .pd-history-row { grid-template-columns:76px 1fr 44px 50px; gap:6px; padding:7px 12px; }
  .pd-history-head { grid-template-columns:76px 1fr 44px 50px; gap:6px; padding:6px 12px; }
  .pd-history-min { display:none; }
  .pd-totals { gap:12px; }
  .pd-activity-row { gap:6px; }
}
`;

const A = {
    color : 'var(--green-600)',
    bg    : 'var(--green-50)',
    dark  : 'var(--green-800)',
    pill  : 'var(--green-100)',
};
const B = {
    color : 'var(--gold-600)',
    bg    : 'var(--gold-50)',
    dark  : 'var(--gold-700)',
    pill  : 'var(--gold-100)',
};

// ── helpers ───────────────────────────────────────────────────────────────────

function pct(val, max) {
    if (!max) return 0;
    return Math.min(100, Math.round((val / max) * 100));
}

function fmtVal(val, type) {
    if (type === 'pct')   return `${Math.round(val)}%`;
    if (type === 'days')  return `${val}d`;
    if (type === 'pages') return val.toLocaleString();
    return String(val);
}

// ── Animated head-to-head metric row ─────────────────────────────────────────

function MetricRow({ label, aVal, bVal, type, mounted, isSolo, last }) {
    const max  = Math.max(isSolo ? aVal : Math.max(aVal, bVal ?? 0), 1);
    const pA   = pct(aVal, max);
    const pB   = isSolo ? 0 : pct(bVal ?? 0, max);
    const aWin = !isSolo && aVal > (bVal ?? 0);
    const bWin = !isSolo && (bVal ?? 0) > aVal;

    return (
        <div className={`pd-metric ${isSolo ? 'solo' : 'has-b'}`} style={{
            borderBottom: last ? 'none' : '1px solid var(--border)',
        }}>
            {/* ── A side (value right-aligned, bar fills from right→left) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                <span style={{
                    fontSize: '0.9375rem',
                    fontWeight: aWin ? 700 : 400,
                    color: aWin ? A.dark : 'var(--foreground)',
                    minWidth: '40px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    {fmtVal(aVal, type)}
                </span>
                <div className="pd-bar-track" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                        height: '8px',
                        background: A.color,
                        width: mounted ? `${pA}%` : '0%',
                        transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1)',
                        borderRadius: '4px',
                    }} />
                </div>
            </div>

            {/* ── center label ── */}
            <div style={{ textAlign: 'center', padding: '0 4px' }}>
                <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: 'var(--muted-foreground)',
                    whiteSpace: 'nowrap',
                }}>
                    {label}
                </span>
            </div>

            {/* ── B side (bar fills left→right, value left-aligned) ── */}
            {!isSolo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="pd-bar-track">
                        <div style={{
                            height: '8px',
                            background: B.color,
                            width: mounted ? `${pB}%` : '0%',
                            transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1)',
                            borderRadius: '4px',
                        }} />
                    </div>
                    <span style={{
                        fontSize: '0.9375rem',
                        fontWeight: bWin ? 700 : 400,
                        color: bWin ? B.dark : 'var(--foreground)',
                        minWidth: '40px',
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {fmtVal(bVal ?? 0, type)}
                    </span>
                </div>
            )}
        </div>
    );
}

// ── 30-day activity strip ─────────────────────────────────────────────────────

function ActivityStrip({ name, heatmap, color }) {
    const scrollRef = useRef(null);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }, []);

    const submitted = heatmap.filter(d => d.submitted).length;

    return (
        <div className="pd-activity-row">
            <span style={{
                fontSize: '0.75rem', color: 'var(--muted-foreground)',
                width: '80px', textAlign: 'right', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
            }}>
                {name}
            </span>
            <div
                ref={scrollRef}
                style={{ display: 'flex', gap: '3px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}
            >
                {heatmap.map(({ date, submitted }) => (
                    <div
                        key={date}
                        title={date}
                        style={{
                            width: '12px', height: '12px', borderRadius: '2px', flexShrink: 0,
                            background: submitted ? color : 'var(--muted)',
                            border: submitted ? 'none' : '1px solid var(--border)',
                        }}
                    />
                ))}
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', flexShrink: 0, minWidth: '32px', textAlign: 'right' }}>
                {submitted}/30
            </span>
        </div>
    );
}

// ── Excuse accordion ──────────────────────────────────────────────────────────

function ExcuseBlock({ name, excuses, color, bg, dark }) {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                }}
            >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                    {name}
                    {excuses.length > 0 && (
                        <span style={{ fontSize: '0.6875rem', padding: '1px 7px', borderRadius: '99px', background: bg, color: dark, fontWeight: 700 }}>
                            {excuses.length}
                        </span>
                    )}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div style={{ padding: '0 16px 12px' }}>
                    {excuses.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)', padding: '8px 0' }}>No excuses filed.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {excuses.map((e, i) => (
                                <div key={i} style={{
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: e.fulfilled ? 'var(--muted)' : 'var(--status-slipping-bg)',
                                    border: `1px solid ${e.fulfilled ? 'var(--border)' : 'var(--status-slipping-border)'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                            Missed {new Date(e.missed_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: '6px' }}>
                                                → makeup {new Date(e.makeup_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                        </span>
                                        <span style={{
                                            fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
                                            background: e.fulfilled ? 'var(--success)' : 'var(--status-slipping-bg)',
                                            color: e.fulfilled ? 'var(--success-foreground)' : 'var(--status-slipping)',
                                        }}>
                                            {e.fulfilled ? '✓ Made up' : 'Pending'}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{e.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PairDetail({ pair, students, history }) {
    const [mounted, setMounted] = useState(false);

    const a    = students[0];
    const b    = students[1] ?? null;
    const solo = !b;

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    const score    = pair.compatibility_score ?? null;
    const scoreBg  = score === null ? 'oklch(90% 0.01 0)' : score >= 10 ? 'oklch(86% 0.1 145)' : score >= 5 ? 'oklch(89% 0.1 75)' : 'oklch(90% 0.12 20)';
    const scoreClr = score === null ? 'var(--muted-foreground)' : score >= 10 ? A.dark : score >= 5 ? B.dark : 'var(--status-at-risk)';

    // Build subject_id → { name, slot } map for history rows
    const nameMap = Object.fromEntries(students.map((s, i) => [s.id, { name: s.name, slot: i }]));

    // Totals for summary chips
    const totalPages = students.reduce((s, u) => s + u.pages, 0);
    const totalMins  = students.reduce((s, u) => s + u.minutes, 0);

    return (
        <AdminLayout>
            <Head title={`${a.name}${b ? ` ↔ ${b.name}` : ''} — Pair`} />
            <style>{RESPONSIVE_CSS}</style>

            <div style={{ maxWidth: '920px', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* ── Back ────────────────────────────────────────────────── */}
                <button
                    onClick={() => router.get('/admin/pairs')}
                    style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--muted-foreground)', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    ← All Pairs
                </button>

                {/* ── Needs-review banner ──────────────────────────────────── */}
                {pair.needs_review && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                        padding: '10px 16px', borderRadius: 'var(--radius-md)',
                        background: 'var(--status-slipping-bg)', border: '1px solid var(--status-slipping-border)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1rem' }}>⚠</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--status-slipping)' }}>
                                Flagged for review — low compatibility score ({score}/18)
                            </span>
                        </div>
                        <button
                            onClick={() => router.post(`/admin/pairs/${pair.id}/clear-review`, {}, { preserveScroll: true })}
                            style={{ padding: '5px 14px', border: '1px solid oklch(70% 0.14 75)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--status-slipping)', fontWeight: 600 }}
                        >
                            Clear flag
                        </button>
                    </div>
                )}

                {/* ── Hero header ─────────────────────────────────────────── */}
                <div className="pd-hero" style={{
                    background: 'var(--green-900)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                }}>
                    {/* Left: names + badges */}
                <div>
                        <h1 style={{ margin: '0 0 10px', fontSize: '1.375rem', fontWeight: 700, color: 'white', lineHeight: 1.15 }}>
                            {solo ? (
                                <>{a.name} <span style={{ fontSize: '1rem', opacity: 0.45, fontWeight: 400 }}>· solo</span></>
                            ) : (
                                <>
                                    <span style={{ color: 'oklch(75% 0.12 145)' }}>{a.name}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 10px', fontWeight: 300 }}>↔</span>
                                    <span style={{ color: 'var(--status-slipping-border)' }}>{b.name}</span>
                                </>
                            )}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>{pair.halqa}</span>
                            <span style={{ opacity: 0.35, color: 'white' }}>·</span>
                            <span style={{
                                fontSize: '0.6875rem', padding: '2px 9px', borderRadius: '99px', fontWeight: 600,
                                background: pair.status === 'active' ? 'var(--green-600)' : 'rgba(255,255,255,0.15)',
                                color: pair.status === 'active' ? 'var(--warm-50)' : 'rgba(255,255,255,0.7)',
                            }}>
                                {pair.status}
                            </span>
                            {score !== null && (
                                <span style={{ fontSize: '0.6875rem', padding: '2px 9px', borderRadius: '99px', fontWeight: 700, background: scoreBg, color: scoreClr }}>
                                    compat {score}/18
                                </span>
                            )}
                        </div>
                        {/* Quick totals */}
                        <div className="pd-totals">
                            {[
                                { label: 'Total Pages', val: totalPages.toLocaleString() },
                                { label: 'Total Minutes', val: totalMins.toLocaleString() },
                                { label: 'Paired since', val: pair.created_at },
                            ].map(({ label, val }) => (
                                <div key={label}>
                                    <p style={{ margin: 0, fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'white' }}>{val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Paired-since badge */}
                    <div style={{ alignSelf: 'flex-start' }}>
                        <p style={{ margin: 0, fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paired since</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{pair.created_at}</p>
                    </div>
                </div>

                {/* ── Head-to-head ─────────────────────────────────────────── */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
                    {/* Legend — names at ends, label centred */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: A.dark, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: A.color, display: 'inline-block', flexShrink: 0 }} />
                            {a.name}
                        </span>
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                            Head-to-Head
                        </span>
                        {!solo ? (
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: B.dark, display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                                {b.name}
                                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: B.color, display: 'inline-block', flexShrink: 0 }} />
                            </span>
                        ) : <span />}
                    </div>

                    <MetricRow label="Consistency" aVal={a.consistency}  bVal={b?.consistency}  type="pct"   mounted={mounted} isSolo={solo} />
                    <MetricRow label="Pages"       aVal={a.pages}        bVal={b?.pages}        type="pages" mounted={mounted} isSolo={solo} />
                    <MetricRow label="Streak"      aVal={a.streak}       bVal={b?.streak}       type="days"  mounted={mounted} isSolo={solo} />
                    <MetricRow label="Sessions"    aVal={a.sessions}     bVal={b?.sessions}     type="num"   mounted={mounted} isSolo={solo} />
                    <MetricRow label="Minutes"     aVal={a.minutes}      bVal={b?.minutes}      type="num"   mounted={mounted} isSolo={solo} last />
                </div>

                {/* ── 30-day activity ──────────────────────────────────────── */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
                    <p style={{ margin: '0 0 14px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>
                        30-Day Activity
                    </p>
                    <ActivityStrip name={a.name} heatmap={a.heatmap} color={A.color} bg={A.bg} />
                    {b && <ActivityStrip name={b.name} heatmap={b.heatmap} color={B.color} bg={B.bg} />}
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        {!solo && [{ label: a.name.split(' ')[0], color: A.color }, { label: b.name.split(' ')[0], color: B.color }].map(({ label, color }) => (
                            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, display: 'inline-block' }} />
                                {label}
                            </span>
                        ))}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--muted)', border: '1px solid var(--border)', display: 'inline-block' }} />
                            Missed
                        </span>
                    </div>
                </div>

                {/* ── Submission history ────────────────────────────────────── */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>
                            Submission History
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{history.length} entries</span>
                    </div>

                    {history.length === 0 ? (
                        <p style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
                            No submissions yet.
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            {/* Table header */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '96px 1fr 56px 64px 64px',
                                gap: '8px', padding: '7px 16px', minWidth: '380px',
                                background: 'var(--muted)', borderBottom: '1px solid var(--border)',
                            }}>
                                {['Date', 'Student', 'Juz', 'Pages', 'Min'].map(h => (
                                    <span key={h} style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>{h}</span>
                                ))}
                            </div>

                            {history.map((row, i) => {
                                const info = nameMap[row.subject_id];
                                const isA  = info?.slot === 0;
                                const T    = isA ? A : B;
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'grid', gridTemplateColumns: '96px 1fr 56px 64px 64px',
                                            gap: '8px', padding: '8px 16px', alignItems: 'center', minWidth: '380px',
                                            background: i % 2 !== 0 ? 'var(--muted)' : 'transparent',
                                            borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                                            {new Date(row.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span style={{
                                            display: 'inline-block',
                                            fontSize: '0.6875rem',
                                            fontWeight: 600,
                                            padding: '2px 9px',
                                            borderRadius: '99px',
                                            background: T.pill,
                                            color: T.dark,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%',
                                        }}>
                                            {info?.name ?? `#${row.subject_id}`}
                                        </span>
                                        <span style={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>{row.juz}</span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)' }}>{row.pages}</span>
                                        <span className="pd-history-min" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>{row.minutes}m</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Excuses ──────────────────────────────────────────────── */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Excuses</p>
                    </div>
                    <ExcuseBlock name={a.name} excuses={a.excuses} color={A.color} bg={A.pill} dark={A.dark} />
                    {b && (
                        <>
                            <div style={{ height: '1px', background: 'var(--border)' }} />
                            <ExcuseBlock name={b.name} excuses={b.excuses} color={B.color} bg={B.pill} dark={B.dark} />
                        </>
                    )}
                </div>

            </div>
        </AdminLayout>
    );
}
