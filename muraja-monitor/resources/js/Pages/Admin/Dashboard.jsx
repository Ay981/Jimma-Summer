import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import BarChart from '@/Components/UI/BarChart';
import LineChart from '@/Components/UI/LineChart';

// ── Design tokens ─────────────────────────────────────────────────────────────
const WARNING_AMBER = 'oklch(70% 0.15 84)';
const WARNING_AMBER_DIM = 'oklch(55% 0.12 84)';
const WARNING_RED_BG = 'oklch(97% 0.03 20)';
const WARNING_RED_BORDER = 'oklch(88% 0.07 20)';
const WARNING_RED_TEXT = 'oklch(45% 0.1 20)';

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children }) {
    return (
        <p style={{
            margin: 0, fontSize: '0.6875rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--muted-foreground)',
        }}>
            {children}
        </p>
    );
}

function Card({ title, href, children }) {
    return (
        <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
            }}>
                <SectionLabel>{title}</SectionLabel>
                {href && (
                    <Link href={href} style={{
                        fontSize: '0.75rem', color: 'var(--accent)',
                        textDecoration: 'none', fontWeight: 500,
                        opacity: 0.8,
                    }}>
                        View all →
                    </Link>
                )}
            </div>
            <div style={{ padding: '14px', flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, sub, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{
                fontSize: '1.5rem', fontWeight: 700, lineHeight: 1,
                color: color ?? 'var(--foreground)',
                fontVariantNumeric: 'tabular-nums',
            }}>
                {value}
                {sub && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: '4px' }}>{sub}</span>}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>{label}</span>
        </div>
    );
}

// ── New program year modal ────────────────────────────────────────────────────

function NewProgramModal({ onClose }) {
    const { data, setData, post, processing } = useForm({ confirm: '' });

    function submit(e) {
        e.preventDefault();
        post('/admin/program/new', { onSuccess: onClose });
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600 }}
            onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', width: '420px', maxWidth: '95vw' }}
                onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--destructive)' }}>Start New Program Year</h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
                    This will <strong>permanently wipe</strong> all submissions, pairs, badges, meetings, contact logs, watchlist entries, and student profiles from this cycle. Final standings will be archived first.
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    Type <strong>NEW_PROGRAM</strong> to confirm:
                </p>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        value={data.confirm}
                        onChange={e => setData('confirm', e.target.value)}
                        placeholder="NEW_PROGRAM"
                        style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing || data.confirm !== 'NEW_PROGRAM'} style={{
                            padding: '7px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                            background: data.confirm === 'NEW_PROGRAM' ? 'var(--destructive)' : 'var(--muted)',
                            color: data.confirm === 'NEW_PROGRAM' ? 'var(--destructive-foreground)' : 'var(--muted-foreground)',
                            fontWeight: 700, fontSize: '0.875rem',
                            cursor: data.confirm === 'NEW_PROGRAM' ? 'pointer' : 'not-allowed',
                        }}>
                            {processing ? 'Resetting…' : 'Reset & Start New Year'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Pulse meter ───────────────────────────────────────────────────────────────

function PulseMeter({ score }) {
    const color = score >= 70 ? 'var(--success)' : score >= 40 ? WARNING_AMBER : 'var(--destructive)';
    const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Fair' : 'Low';
    const cx = 60, cy = 60, r = 50;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * (circ * 0.75);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <svg width={120} height={76} viewBox="0 0 120 80" style={{ overflow: 'visible' }}>
                <path d={`M ${cx - r},${cy} A ${r},${r} 0 1 1 ${cx + r},${cy}`}
                    fill="none" stroke="var(--border)" strokeWidth={8} strokeLinecap="round" />
                <path d={`M ${cx - r},${cy} A ${r},${r} 0 1 1 ${cx + r},${cy}`}
                    fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize={24} fontWeight={800} fill={color}>{score}</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--muted-foreground)">{label}</text>
            </svg>
            <SectionLabel>Daily Pulse</SectionLabel>
        </div>
    );
}

// ── Program calendar ──────────────────────────────────────────────────────────

function ProgramCalendar({ calendar }) {
    if (!calendar.length) return (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No calendar data yet.</p>
    );
    const max = Math.max(...calendar.map((c) => c.pct), 1);
    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '10px' }}>
                {calendar.map((c) => {
                    const intensity = c.pct / max;
                    const bg = c.pct === 0
                        ? 'var(--muted)'
                        : `oklch(${52 + intensity * 18}% 0.13 ${158 - intensity * 22})`;
                    return (
                        <div key={c.date}
                            title={`${c.date}: ${c.pct}% (${c.count} submitted)`}
                            style={{
                                width: '12px', height: '12px', borderRadius: '2px',
                                background: bg,
                                border: c.pct === 0 ? '1px solid var(--border)' : 'none',
                                flexShrink: 0, cursor: 'default',
                            }}
                        />
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                {[
                    { bg: 'oklch(60% 0.12 150)', label: 'High' },
                    { bg: 'var(--muted)', border: '1px solid var(--border)', label: 'No submissions' },
                ].map(({ bg, border, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: bg, border, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Sankey ────────────────────────────────────────────────────────────────────

function SankeyDiagram({ data }) {
    const { nodes = [], links = [] } = data ?? {};
    const halqas   = nodes.filter((n) => n.type === 'halqa');
    const students = nodes.filter((n) => n.type === 'student');
    if (!halqas.length) return (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No data yet.</p>
    );

    const ROW = 22;
    const H = Math.max(180, Math.max(halqas.length, students.length) * ROW);
    const W = 320;
    const halqaX = 8, studentX = 228;

    const halqaY   = (i) => (i + 0.5) * (H / halqas.length);
    const studentY = (i) => (i + 0.5) * (H / students.length);
    const halqaIdx   = Object.fromEntries(halqas.map((h, i) => [h.id, i]));
    const studentIdx = Object.fromEntries(students.map((s, i) => [s.id, i]));

    return (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
                {links.map((l, i) => {
                    const hi = halqaIdx[l.source];
                    const si = studentIdx[l.target];
                    if (hi === undefined || si === undefined) return null;
                    const y1 = halqaY(hi), y2 = studentY(si);
                    const strokeW = Math.max(0.5, Math.min(4, l.value / 20));
                    const alpha   = Math.max(0.1, Math.min(0.6, l.value / 100));
                    return (
                        <path key={i}
                            d={`M ${halqaX + 66},${y1} C ${halqaX + 128},${y1} ${studentX - 58},${y2} ${studentX},${y2}`}
                            fill="none" stroke="var(--success)" strokeWidth={strokeW} opacity={alpha} />
                    );
                })}
                {halqas.map((h, i) => (
                    <g key={h.id} transform={`translate(${halqaX},${halqaY(i) - 9})`}>
                        <rect width={64} height={16} rx={3} fill="var(--secondary)" />
                        <text x={5} y={11} fontSize={8} fontWeight={600} fill="var(--foreground)">{h.label.slice(0, 10)}</text>
                    </g>
                ))}
                {students.map((s, i) => (
                    <text key={s.id} x={studentX + 4} y={studentY(i) + 3}
                        fontSize={7} fill="var(--muted-foreground)">
                        {s.label.split(' ')[0]}
                    </text>
                ))}
            </svg>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard({
    pulse, todaySubs, activeStudents, totalStudents, statusCounts,
    dropOff, weeklyTrend, hourBars, neverList, retentionCurve,
    earlyWarning, halqaEngagement, sankeyData, calendar, actions, recentSubs,
    program_start, program_end, program_status,
}) {
    const sc             = statusCounts ?? {};
    const [showNewProgram, setShowNewProgram] = React.useState(false);
    const actions_       = actions ?? [];
    const neverList_     = neverList ?? [];
    const recentSubs_    = recentSubs ?? [];
    const earlyWarning_  = earlyWarning ?? [];
    const halqaEng_      = halqaEngagement ?? [];

    const statusStats = [
        { label: 'Submitted today', value: todaySubs, sub: `of ${activeStudents}` },
        { label: 'On Track',  value: sc.on_track ?? 0,  color: 'var(--success)' },
        { label: 'Slipping',  value: sc.slipping ?? 0,  color: WARNING_AMBER },
        { label: 'At Risk',   value: sc.at_risk ?? 0,   color: 'var(--destructive)' },
        { label: 'Inactive',  value: sc.inactive ?? 0,  color: 'var(--muted-foreground)' },
        { label: 'Total',     value: totalStudents },
    ];

    return (
        <AdminLayout title="Dashboard">
            <Head title="Admin Dashboard" />
            {showNewProgram && <NewProgramModal onClose={() => setShowNewProgram(false)} />}
            <div style={{ maxWidth: '1400px' }}>

            {/* Page header */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)' }}>Overview</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {program_status === 'not_started' ? (
                            'Program has not started yet.'
                        ) : program_status === 'ended' ? (
                            <>
                                Program ran{' '}
                                <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                                    {new Date(program_start + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                {' '}–{' '}
                                <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                                    {new Date(program_end + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </>
                        ) : (
                            <>
                                Program started{' '}
                                <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                                    {new Date(program_start + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </>
                        )}
                    </p>
                </div>

                {program_status === 'not_started' && (
                    <button
                        onClick={() => { if (confirm('Start the program today? This sets today as the official start date.')) router.post('/admin/program/start'); }}
                        style={{
                            padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-md)',
                            background: 'var(--success)', color: 'var(--success-foreground)',
                            fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        }}
                    >
                        ▶ Start Program
                    </button>
                )}

                {program_status === 'running' && (
                    <button
                        onClick={() => { if (confirm('End the program today? This sets today as the official end date. This cannot be undone.')) router.post('/admin/program/end'); }}
                        style={{
                            padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-md)',
                            background: 'var(--destructive)', color: 'var(--destructive-foreground)',
                            fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        }}
                    >
                        ⏹ End Program
                    </button>
                )}

                {program_status === 'ended' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => { if (confirm('Continue with the same data? This sets today as a new start date without clearing anything.')) router.post('/admin/program/start'); }}
                            style={{
                                padding: '8px 18px', border: 'none', borderRadius: 'var(--radius-md)',
                                background: 'var(--success)', color: 'var(--success-foreground)',
                                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                            }}
                        >
                            ▶ Continue Program
                        </button>
                        <button
                            onClick={() => setShowNewProgram(true)}
                            style={{
                                padding: '8px 18px', border: '1px solid var(--destructive)', borderRadius: 'var(--radius-md)',
                                background: 'transparent', color: 'var(--destructive)',
                                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                            }}
                        >
                            ↺ New Program Year
                        </button>
                    </div>
                )}
            </div>

            {/* ── Row 1: Pulse + Actions + Early Warning ──────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'start' }} className="top-grid">

                {/* Pulse card */}
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 20px 16px',
                    display: 'flex', gap: '28px', alignItems: 'center',
                    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
                    borderLeft: '3px solid var(--primary)',
                }}>
                    <PulseMeter score={pulse ?? 0} />
                    <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--border)', flexShrink: 0 }} />
                    <div className="pulse-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                        {statusStats.map(({ label, value, sub, color }) => (
                            <StatPill key={label} label={label} value={value} sub={sub} color={color} />
                        ))}
                    </div>
                </div>

                {/* Suggested actions */}
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                        <SectionLabel>Suggested Actions</SectionLabel>
                    </div>
                    <div style={{ padding: '8px' }}>
                        {actions_.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 6px' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--success)' }}>✓</span>
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 500 }}>
                                    All clear — no actions needed.
                                </p>
                            </div>
                        ) : actions_.map((a, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                                marginBottom: i < actions_.length - 1 ? '4px' : 0,
                                background: 'var(--muted)',
                            }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{a.icon}</span>
                                <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--foreground)', lineHeight: 1.4 }}>{a.text}</span>
                                {a.href && (
                                    <Link href={a.href} style={{
                                        fontSize: '0.75rem', padding: '4px 10px',
                                        background: 'var(--primary)', color: 'var(--primary-foreground)',
                                        borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                                        fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                                    }}>
                                        {a.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                        <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                            <button
                                onClick={() => router.post('/admin/onboarding/recapture')}
                                style={{
                                    width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
                                    background: 'var(--muted)', color: 'var(--foreground)',
                                    borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem',
                                    cursor: 'pointer', textAlign: 'left',
                                }}
                            >
                                📸 Regenerate onboarding screenshots
                            </button>
                        </div>
                    </div>
                </div>

                {/* Early warning */}
                {earlyWarning_.length > 0 && (
                    <div style={{
                        background: WARNING_RED_BG, border: `1px solid ${WARNING_RED_BORDER}`,
                        borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '220px',
                        boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
                    }}>
                        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${WARNING_RED_BORDER}` }}>
                            <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: WARNING_RED_TEXT }}>
                                ⚠ Early Warning
                            </p>
                        </div>
                        <div style={{ padding: '6px 8px' }}>
                            {earlyWarning_.map((w) => (
                                <div key={w.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '6px 6px', borderRadius: 'var(--radius-sm)',
                                    gap: '8px',
                                }}>
                                    <Link href={`/admin/students/${w.id}`} style={{
                                        fontSize: '0.8125rem', fontWeight: 600,
                                        color: 'var(--foreground)', textDecoration: 'none',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {w.name}
                                    </Link>
                                    <span style={{
                                        fontSize: '0.6875rem', color: WARNING_RED_TEXT,
                                        fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                                        background: WARNING_RED_BORDER, padding: '2px 6px',
                                        borderRadius: '99px',
                                    }}>
                                        {w.missed_of_5}/5 missed
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Row 2: Charts ───────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="chart-grid">
                <Card title="Daily Submissions — 30 days">
                    <BarChart data={dropOff ?? []} height={150} barColor="var(--primary)" />
                </Card>
                <Card title="Weekly Consistency Trend">
                    <LineChart
                        series={[{ label: 'Consistency %', color: 'var(--success)', data: (weeklyTrend ?? []).map((w) => w.value) }]}
                        labels={(weeklyTrend ?? []).map((w) => w.label)}
                        height={150} yMax={100} unit="%" />
                </Card>
            </div>

            {/* ── Row 3: Charts ───────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="chart-grid">
                <Card title="Peak Submission Hours">
                    <BarChart data={hourBars ?? []} height={130} barColor="var(--accent)" />
                </Card>
                <Card title="Retention Curve — Weekly">
                    <LineChart
                        series={[{ label: '% Still Active', color: 'oklch(60% 0.15 260)', data: (retentionCurve ?? []).map((r) => r.value), fill: true }]}
                        labels={(retentionCurve ?? []).map((r) => r.label)}
                        height={130} yMax={100} unit="%" />
                </Card>
            </div>

            {/* ── Row 4: Calendar + Halqa Engagement ──────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }} className="chart-grid">
                <Card title="Program Calendar — Submission Rate per Day">
                    <ProgramCalendar calendar={calendar ?? []} />
                </Card>
                <Card title="Halqa Engagement This Week" href="/admin/halqas">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {halqaEng_.length === 0
                            ? <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No halqas yet.</p>
                            : halqaEng_.map((h) => {
                                const color = h.score >= 70 ? 'var(--success)' : h.score >= 40 ? WARNING_AMBER : 'var(--destructive)';
                                const textColor = h.score >= 70 ? 'var(--success)' : h.score >= 40 ? WARNING_AMBER_DIM : 'var(--destructive)';
                                return (
                                    <div key={h.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--foreground)' }}>{h.name}</span>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: textColor }}>{h.score}%</span>
                                        </div>
                                        <div style={{ height: '5px', background: 'var(--muted)', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${h.score}%`, background: color, borderRadius: '99px', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </Card>
            </div>

            {/* ── Row 5: Sankey + Never Submitted + Recent Subs ───────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }} className="triple-grid">
                <Card title="Halqa → Student Flow">
                    <SankeyDiagram data={sankeyData} />
                </Card>

                <Card title={`Never Submitted (${neverList_.length})`} href="/admin/students">
                    {neverList_.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                            <span style={{ fontSize: '1rem' }}>✓</span>
                            <p style={{ color: 'var(--success)', fontSize: '0.8125rem', margin: 0, fontWeight: 500 }}>
                                All students have submitted at least once.
                            </p>
                        </div>
                    ) : (
                        <>
                            {neverList_.slice(0, 10).map((s) => (
                                <div key={s.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 0', borderBottom: '1px solid var(--border)',
                                }}>
                                    <Link href={`/admin/students/${s.id}`} style={{
                                        fontSize: '0.8125rem', fontWeight: 500,
                                        color: 'var(--foreground)', textDecoration: 'none',
                                    }}>
                                        {s.name}
                                    </Link>
                                    <span style={{
                                        fontSize: '0.6875rem', color: 'var(--muted-foreground)',
                                        fontFamily: 'monospace',
                                    }}>
                                        {s.student_id}
                                    </span>
                                </div>
                            ))}
                            {neverList_.length > 10 && (
                                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                    +{neverList_.length - 10} more — view all
                                </p>
                            )}
                        </>
                    )}
                </Card>

                <Card title="Recent Submissions">
                    {recentSubs_.length === 0 ? (
                        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No submissions yet.</p>
                    ) : recentSubs_.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 0', borderBottom: '1px solid var(--border)',
                            gap: '8px',
                        }}>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Juz {s.juz} · {s.pages} pp</p>
                            </div>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.time}</span>
                        </div>
                    ))}
                </Card>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .top-grid    { grid-template-columns: 1fr !important; }
                    .chart-grid  { grid-template-columns: 1fr !important; }
                    .triple-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .pulse-stats { grid-template-columns: repeat(3, 1fr) !important; gap: 6px 10px !important; }
                }
                @media (min-width: 1280px) {
                    .top-grid:has(> div:nth-child(3)) {
                        grid-template-columns: 360px 1fr 240px !important;
                    }
                }
            `}</style>
            </div>
        </AdminLayout>
    );
}
