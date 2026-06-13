import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SegmentedBar from '@/Components/UI/SegmentedBar';

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
                    This will <strong>permanently wipe</strong> all submissions, pairs, badges, meetings, contact logs, and student profiles. Final standings are archived first.
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    Type <strong>NEW_PROGRAM</strong> to confirm:
                </p>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        value={data.confirm}
                        onChange={e => setData('confirm', e.target.value)}
                        placeholder="NEW_PROGRAM"
                        style={{ padding: '8px 10px', border: '1px solid var(--input)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--foreground)' }}>
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

// ── Shared section label ──────────────────────────────────────────────────────

function SectionLabel({ children }) {
    return (
        <p style={{
            margin: 0, fontSize: '0.6875rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.10em',
            color: 'var(--warm-800)',
        }}>
            {children}
        </p>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, accent }) {
    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderTop: `3px solid ${accent ?? 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)', padding: '14px 16px',
            boxShadow: 'var(--shadow-sm)',
        }}>
            <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
                {label}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, color: color ?? 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {value}
            </p>
            {sub && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{sub}</p>}
        </div>
    );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ title, href, children }) {
    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionLabel>{title}</SectionLabel>
                {href && (
                    <Link href={href} style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        View all →
                    </Link>
                )}
            </div>
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard({
    pulse, todaySubs, activeStudents, totalStudents, statusCounts,
    neverList, earlyWarning, halqaEngagement, actions, recentSubs,
    program_start, program_end, program_status,
}) {
    const sc            = statusCounts ?? {};
    const [showNewProgram, setShowNewProgram] = React.useState(false);
    const actions_      = actions ?? [];
    const neverList_    = neverList ?? [];
    const recentSubs_   = recentSubs ?? [];
    const earlyWarning_ = earlyWarning ?? [];
    const halqaEng_     = halqaEngagement ?? [];

    const submissionPct = activeStudents > 0 ? Math.round((todaySubs / activeStudents) * 100) : 0;

    return (
        <AdminLayout title="Dashboard">
            <Head title="Admin Dashboard" />
            {showNewProgram && <NewProgramModal onClose={() => setShowNewProgram(false)} />}

            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* ── Program header — title + controls on one line ─────────── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)' }}>Overview</h1>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                            {program_status === 'not_started' ? 'Program has not started yet.'
                                : program_status === 'ended' ? <>Program ended <strong>{new Date(program_end + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>
                                : <>Running since <strong>{new Date(program_start + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>
                            }
                        </p>
                    </div>

                    {/* Program control buttons — flush right, same row as title */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        {program_status === 'not_started' && (
                            <button onClick={() => { if (confirm('Start the program today?')) router.post('/admin/program/start'); }}
                                style={{ padding: '7px 16px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'opacity 150ms' }}>
                                ▶ Start Program
                            </button>
                        )}
                        {program_status === 'running' && (
                            <button onClick={() => { if (confirm('End the program today? This cannot be undone.')) router.post('/admin/program/end'); }}
                                style={{ padding: '7px 16px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'opacity 150ms' }}>
                                ⏹ End Program
                            </button>
                        )}
                        {program_status === 'ended' && (
                            <>
                                <button onClick={() => { if (confirm('Continue with the same data?')) router.post('/admin/program/start'); }}
                                    style={{ padding: '7px 16px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                                    ▶ Continue
                                </button>
                                <button onClick={() => setShowNewProgram(true)}
                                    style={{ padding: '7px 14px', border: '1px solid var(--destructive)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--destructive)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                                    ↺ New Year
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Stat cards — wider gap for breathing room ─────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                    <StatCard label="Submitted today" value={todaySubs} sub={`${submissionPct}% of ${activeStudents}`} accent="var(--primary)" />
                    <StatCard label="On Track"  value={sc.on_track  ?? 0} color="var(--status-on-track)"  accent="var(--status-on-track)" />
                    <StatCard label="Slipping"  value={sc.slipping  ?? 0} color="var(--status-slipping)"  accent="var(--status-slipping)" />
                    <StatCard label="At Risk"   value={sc.at_risk   ?? 0} color="var(--status-at-risk)"   accent="var(--status-at-risk)" />
                    <StatCard label="Inactive"  value={sc.inactive  ?? 0} color="var(--muted-foreground)" accent="var(--border)" />
                    <StatCard label="Total"     value={totalStudents}                                      accent="var(--border)" />
                </div>

                {/* ── Middle row: Actions | Halqa | Needs Attention ─────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'start' }} className="triple-grid">

                    {/* Suggested actions */}
                    <Card title="Suggested Actions">
                        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {actions_.length === 0 ? (
                                <p style={{ margin: '8px 6px', fontSize: '0.8125rem', color: 'var(--status-on-track)', fontWeight: 500 }}>
                                    ✓ All clear — no actions needed.
                                </p>
                            ) : actions_.map((a, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                                    background: 'var(--muted)',
                                }}>
                                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{a.icon}</span>
                                    <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--foreground)', lineHeight: 1.4 }}>{a.text}</span>
                                    {a.href && (
                                        <Link href={a.href} style={{
                                            fontSize: '0.75rem', padding: '4px 10px',
                                            border: '1px solid var(--primary)',
                                            background: 'transparent', color: 'var(--primary)',
                                            borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                                            fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>
                                            {a.label}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Halqa consistency */}
                    <Card title="Halqa Consistency" href="/admin/halqas">
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {halqaEng_.length === 0 ? (
                                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No halqas yet.</p>
                            ) : [...halqaEng_].sort((a, b) => b.score - a.score).map((h) => (
                                <div key={h.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--foreground)' }}>{h.name}</span>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                                            color: h.score >= 70 ? 'var(--status-on-track)' : h.score >= 40 ? 'var(--status-slipping)' : 'var(--status-at-risk)',
                                        }}>{h.score}%</span>
                                    </div>
                                    <SegmentedBar value={h.score} max={100} segments={16} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Needs attention */}
                    <Card title="Needs Attention" href="/admin/students">
                        {earlyWarning_.length === 0 && neverList_.length === 0 ? (
                            <p style={{ margin: '12px 14px', fontSize: '0.8125rem', color: 'var(--status-on-track)', fontWeight: 500 }}>
                                ✓ No students flagged.
                            </p>
                        ) : (
                            <div>
                                {earlyWarning_.map((w, i) => (
                                    <div key={w.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '7px 14px', gap: '8px',
                                        background: 'var(--status-at-risk-bg)',
                                        borderBottom: '1px solid var(--border)',
                                    }}>
                                        <Link href={`/admin/students/${w.id}`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {w.name}
                                        </Link>
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--status-at-risk)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {w.missed_of_5}/5 missed
                                        </span>
                                    </div>
                                ))}
                                {neverList_.slice(0, 8).map((s, i) => (
                                    <div key={s.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '7px 14px', gap: '8px',
                                        background: i % 2 === 0 ? 'transparent' : 'var(--muted)',
                                        borderBottom: '1px solid var(--border)',
                                    }}>
                                        <Link href={`/admin/students/${s.id}`} style={{ fontSize: '0.8125rem', color: 'var(--foreground)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.name}
                                        </Link>
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', flexShrink: 0 }}>never submitted</span>
                                    </div>
                                ))}
                                {neverList_.length > 8 && (
                                    <p style={{ margin: '6px 14px', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                        +{neverList_.length - 8} more
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── Recent submissions — compact table ───────────────────── */}
                <Card title="Recent Submissions">
                    {recentSubs_.length === 0 ? (
                        <p style={{ padding: '12px 14px', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No submissions yet.</p>
                    ) : (
                        <div>
                            {/* Table header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 72px 110px', gap: '0', padding: '6px 14px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                                {['Student', 'Juz', 'Pages', 'Time'].map(h => (
                                    <span key={h} style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>{h}</span>
                                ))}
                            </div>
                            {recentSubs_.map((s, i) => (
                                <div key={i} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 52px 72px 110px', gap: '0',
                                    padding: '7px 14px', alignItems: 'center',
                                    background: i % 2 === 1 ? 'var(--muted)' : 'transparent',
                                    borderBottom: i < recentSubs_.length - 1 ? '1px solid var(--border)' : 'none',
                                }}>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--foreground)' }}>{s.name}</span>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>{s.juz}</span>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>{s.pages} pp</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

            </div>

            <style>{`
                @media (max-width: 900px) {
                    .triple-grid { grid-template-columns: 1fr 1fr !important; }
                }
                @media (max-width: 600px) {
                    .triple-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
