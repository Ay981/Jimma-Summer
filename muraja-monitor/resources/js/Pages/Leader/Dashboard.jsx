import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';
import Sparkline from '@/Components/UI/Sparkline';
import StatusTag from '@/Components/UI/StatusTag';
import SummaryPill from '@/Components/UI/SummaryPill';
import AnnouncementBanner from '@/Components/UI/AnnouncementBanner';

// ── Absence Follow-up Queue ───────────────────────────────────────────────────

function AbsenceQueueItem({ pair }) {
    const [note, setNote]       = useState('');
    const [showNote, setShowNote] = useState(false);
    const [done, setDone]       = useState(false);

    function markFollowedUp() {
        router.post(`/leader/outreach/followup/${pair.id}`, { note: note || undefined }, {
            preserveScroll: true,
            onSuccess: () => setDone(true),
        });
    }

    if (done) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--muted)', opacity: 0.6,
            }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', textDecoration: 'line-through' }}>
                    {pair.student_a.name} & {pair.student_b.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: 'auto' }}>Followed up ✓</span>
            </div>
        );
    }

    return (
        <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--card)', border: '1px solid var(--border)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>
                        {pair.student_a.name} & {pair.student_b.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        No submission yesterday
                    </p>
                </div>
                <button
                    onClick={() => setShowNote(!showNote)}
                    style={{
                        padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)', background: 'transparent',
                        fontSize: '0.75rem', cursor: 'pointer', color: 'var(--foreground)',
                    }}
                >
                    Add note
                </button>
                <button
                    onClick={markFollowedUp}
                    style={{
                        padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                        border: 'none', background: 'var(--success)',
                        color: 'var(--success-foreground)', fontSize: '0.75rem',
                        cursor: 'pointer', fontWeight: 600,
                    }}
                >
                    Mark followed up
                </button>
            </div>
            {showNote && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note..."
                        style={{
                            flex: 1, padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                            background: 'var(--background)', color: 'var(--foreground)',
                            fontSize: '0.8125rem',
                        }}
                    />
                    <button
                        onClick={markFollowedUp}
                        style={{
                            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                            border: 'none', background: 'var(--primary)',
                            color: 'var(--primary-foreground)', fontSize: '0.8125rem',
                            cursor: 'pointer',
                        }}
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Today submitted indicator ─────────────────────────────────────────────────

function TodayDot({ status }) {
    const config = {
        both: { color: 'var(--success)',      label: 'Both submitted' },
        one:  { color: 'oklch(70% 0.15 84)', label: 'One submitted' },
        none: { color: 'var(--destructive)',  label: 'None submitted' },
    };
    const c = config[status] ?? config.none;
    return (
        <span title={c.label} style={{
            display: 'inline-block', width: '10px', height: '10px',
            borderRadius: '50%', background: c.color, flexShrink: 0,
        }} />
    );
}

// ── Broadcast modal ───────────────────────────────────────────────────────────

function BroadcastModal({ onClose }) {
    const [msg, setMsg] = useState('');
    function send() {
        if (!msg.trim()) return;
        router.post('/leader/broadcast', { message: msg }, { onSuccess: onClose });
    }
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', width: '380px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700 }}>Broadcast to Halqa</h3>
                <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>All students in your halqa will receive this notification.</p>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Your message…" rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem', resize: 'none', fontFamily: 'inherit', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={send} style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Send</button>
                </div>
            </div>
        </div>
    );
}

// ── Nudge modal ───────────────────────────────────────────────────────────────

const NUDGE_PRESETS = [
    "We missed you today — keep going!",
    "Great consistency this week!",
    "Remember to log your muraja'a today.",
];

function NudgeModal({ student, onClose }) {
    const [msg, setMsg] = useState(NUDGE_PRESETS[0]);
    const [custom, setCustom] = useState(false);
    function send() {
        if (!msg.trim()) return;
        router.post(`/leader/nudge/${student.id}`, { message: msg }, { onSuccess: onClose });
    }
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', width: '360px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700 }}>Nudge {student.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {NUDGE_PRESETS.map((p) => (
                        <label key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <input type="radio" name="nudge_msg" checked={!custom && msg === p} onChange={() => { setMsg(p); setCustom(false); }} style={{ marginTop: '2px' }} />
                            {p}
                        </label>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="nudge_msg" checked={custom} onChange={() => setCustom(true)} />
                        Custom message
                    </label>
                    {custom && <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} style={{ padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem', resize: 'none', fontFamily: 'inherit' }} />}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={send} style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Send</button>
                </div>
            </div>
        </div>
    );
}

// ── Password reset modal ──────────────────────────────────────────────────────

function PwResetModal({ student, onClose }) {
    const [done, setDone] = useState(false);
    const [copied, setCopied] = useState(false);
    const tempPw = 'Muraja@1446';

    function doReset() {
        router.post(`/leader/students/${student.id}/pw-reset`, {}, {
            preserveScroll: true,
            onSuccess: () => setDone(true),
        });
    }
    function copy() {
        navigator.clipboard.writeText(tempPw);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', width: '340px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                {!done ? (
                    <>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>Reset {student.name}'s Password?</h3>
                        <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Password will be reset to the default. The student must change it on next login.</p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={doReset} style={{ padding: '6px 14px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>Password Reset ✓</h3>
                        <p style={{ margin: '0 0 4px', fontSize: '0.875rem' }}>Temporary password for {student.name}:</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                            <code style={{ flex: 1, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}>{tempPw}</code>
                            <button onClick={copy} style={{ padding: '4px 8px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--foreground)' }}>{copied ? 'Copied!' : 'Copy'}</button>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Notify the student manually. This is shown only once.</p>
                        <button onClick={onClose} style={{ padding: '6px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Done</button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Pair row ─────────────────────────────────────────────────────────────────

function PairRow({ pair }) {
    const [nudgeStudent, setNudgeStudent] = useState(null);
    const [resetStudent, setResetStudent] = useState(null);

    const sparklineColor = {
        on_track: 'var(--success)',
        slipping: 'oklch(70% 0.15 84)',
        at_risk:  'var(--destructive)',
        inactive: 'var(--muted-foreground)',
    }[pair.status] ?? 'var(--success)';

    const lastSeen = pair.last_submission
        ? new Date(pair.last_submission).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'Never';

    return (
        <>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto auto auto auto',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'var(--foreground)',
                transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
        >
            {/* Names */}
            <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                    {pair.student_a.name}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    {pair.student_b.name}
                </p>
            </div>

            {/* Consistency */}
            <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {pair.consistency}%
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                    consistency
                </p>
            </div>

            {/* Last seen */}
            <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {lastSeen}
                </p>
            </div>

            {/* Status tag */}
            {pair.status ? <StatusTag status={pair.status} /> : <span />}

            {/* Sparkline */}
            <Sparkline data={pair.sparkline} width={72} height={20} color={sparklineColor} />

            {/* Today dot */}
            <TodayDot status={pair.today_submitted} />

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={(e) => { e.preventDefault(); setNudgeStudent(pair.student_a); }} title="Nudge student A" style={{ padding: '3px 7px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer' }}>💬</button>
                <button onClick={(e) => { e.preventDefault(); setResetStudent(pair.student_a); }} title="Reset password" style={{ padding: '3px 7px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer' }}>🔑</button>
                <Link href={`/leader/members/${pair.id}`} style={{ padding: '3px 7px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', textDecoration: 'none', color: 'var(--foreground)' }}>→</Link>
            </div>
        </div>

        {nudgeStudent && <NudgeModal student={nudgeStudent} onClose={() => setNudgeStudent(null)} />}
        {resetStudent && <PwResetModal student={resetStudent} onClose={() => setResetStudent(null)} />}
        </>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TABS = ['All', 'At Risk', 'Watchlist'];
const STATUS_FILTER_MAP = {
    'All':      null,
    'At Risk':  ['at_risk', 'inactive'],
    'Watchlist':null,  // handled by watchlist data when available
};

export default function LeaderDashboard({ halqa, pairs, summary, absence_queue, announcements, follow_up_queue, group_identity }) {
    const [tab, setTab]           = useState('All');
    const [search, setSearch]     = useState('');
    const [sortBy, setSortBy]     = useState('consistency');
    const [statusFilter, setStatusFilter] = useState('');
    const [showQueue, setShowQueue]       = useState(true);
    const [showBroadcast, setShowBroadcast] = useState(false);

    const filtered = useMemo(() => {
        let list = [...(pairs ?? [])];

        // Tab filter
        if (tab === 'At Risk') {
            list = list.filter((p) => p.status === 'at_risk' || p.status === 'inactive');
        }

        // Status dropdown filter
        if (statusFilter) {
            list = list.filter((p) => p.status === statusFilter);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.student_a.name.toLowerCase().includes(q) ||
                    p.student_b.name.toLowerCase().includes(q),
            );
        }

        // Sort
        if (sortBy === 'consistency') {
            list.sort((a, b) => b.consistency - a.consistency);
        } else if (sortBy === 'last_seen') {
            list.sort((a, b) => {
                const da = a.last_submission ? new Date(a.last_submission) : new Date(0);
                const db = b.last_submission ? new Date(b.last_submission) : new Date(0);
                return db - da;
            });
        } else if (sortBy === 'name') {
            list.sort((a, b) => a.student_a.name.localeCompare(b.student_a.name));
        }

        return list;
    }, [pairs, tab, search, sortBy, statusFilter]);

    return (
        <LeaderLayout title={halqa ? `${halqa.name} — Dashboard` : 'Leader Dashboard'}>
            <Head title="Leader Dashboard" />

            {/* ── Announcements ─────────────────────────────────────────── */}
            <AnnouncementBanner announcements={announcements} />

            {/* ── Summary pills ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px',
                padding: '14px 16px',
                background: 'var(--card)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', marginBottom: '20px',
            }}>
                <SummaryPill count={summary.on_track} label="on track"  variant="success" />
                <SummaryPill count={summary.slipping}  label="slipping"  variant="warning" />
                <SummaryPill count={summary.at_risk}   label="at risk"   variant="danger" />
                {summary.inactive > 0 && (
                    <SummaryPill count={summary.inactive} label="inactive" variant="default" />
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {(pairs ?? []).length} pairs · {halqa?.name}
                    </span>
                    <a
                        href="/leader/export/pdf"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--secondary)', border: '1px solid var(--border)',
                            fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary-foreground)',
                            textDecoration: 'none',
                        }}
                    >
                        Export PDF
                    </a>
                </div>
            </div>

            {/* ── Group identity panel ──────────────────────────────────── */}
            {group_identity && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{group_identity.consistency}%</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>halqa consistency</span>
                    </div>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>Rank {group_identity.rank}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>of {group_identity.total_halqas} halqas</span>
                    </div>
                    {group_identity.top_student && (
                        <>
                            <span style={{ color: 'var(--border)' }}>·</span>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '0.875rem' }}>⭐ This week: <strong>{group_identity.top_student.name}</strong></span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{group_identity.top_student.count} days</span>
                            </div>
                        </>
                    )}
                    <div style={{ marginLeft: 'auto' }}>
                        <button onClick={() => setShowBroadcast(true)} style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                            📢 Broadcast
                        </button>
                    </div>
                </div>
            )}

            {/* ── Follow-up queue ───────────────────────────────────────── */}
            {follow_up_queue?.length > 0 && (
                <div style={{ marginBottom: '16px', background: 'var(--card)', border: '1px solid oklch(82% 0.08 50)', borderLeft: '4px solid oklch(55% 0.12 50)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: '0', padding: '8px 14px', fontSize: '0.875rem', fontWeight: 700, color: 'oklch(45% 0.1 50)', borderBottom: '1px solid var(--border)' }}>
                        Follow-up Queue ({follow_up_queue.length})
                    </p>
                    {follow_up_queue.map((item, i) => (
                        <div key={i} style={{ padding: '7px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong>{item.student}</strong>: {item.description ?? item.note}</span>
                            <span style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>Due {item.due_date ?? item.snooze_until}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Absence follow-up queue ───────────────────────────────── */}
            {absence_queue?.length > 0 && (
                <div style={{
                    marginBottom: '20px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                    <button
                        onClick={() => setShowQueue(!showQueue)}
                        style={{
                            width: '100%', padding: '10px 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'oklch(83% 0.08 84 / 0.15)', border: 'none',
                            cursor: 'pointer', color: 'var(--foreground)',
                        }}
                    >
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Absence Follow-up · {absence_queue.length} pair{absence_queue.length !== 1 ? 's' : ''} missed yesterday
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            {showQueue ? 'Hide' : 'Show'}
                        </span>
                    </button>
                    {showQueue && (
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--background)' }}>
                            {absence_queue.map((pair) => (
                                <AbsenceQueueItem key={pair.id} pair={pair} />
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                                <button
                                    onClick={() => router.post('/leader/outreach/notify-all', {}, { preserveScroll: true })}
                                    style={{
                                        padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--primary)', color: 'var(--primary-foreground)',
                                        border: 'none', fontSize: '0.8125rem', fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Notify all absent pairs
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tabs + filters ────────────────────────────────────────── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px',
                alignItems: 'center', marginBottom: '12px',
            }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setStatusFilter(''); }}
                            style={{
                                padding: '5px 14px', borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border)',
                                background: tab === t ? 'var(--primary)' : 'var(--card)',
                                color: tab === t ? 'var(--primary-foreground)' : 'var(--foreground)',
                                fontSize: '0.8125rem', fontWeight: tab === t ? 600 : 400,
                                cursor: 'pointer',
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1 }} />

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--card)', color: 'var(--foreground)',
                        fontSize: '0.8125rem', cursor: 'pointer',
                    }}
                >
                    <option value="">All statuses</option>
                    <option value="on_track">On Track</option>
                    <option value="slipping">Slipping</option>
                    <option value="at_risk">At Risk</option>
                    <option value="inactive">Inactive</option>
                </select>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--card)', color: 'var(--foreground)',
                        fontSize: '0.8125rem', cursor: 'pointer',
                    }}
                >
                    <option value="consistency">Sort: Consistency</option>
                    <option value="last_seen">Sort: Last Seen</option>
                    <option value="name">Sort: Name</option>
                </select>

                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name..."
                    style={{
                        padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--card)', color: 'var(--foreground)',
                        fontSize: '0.8125rem', width: '160px',
                    }}
                />
            </div>

            {/* ── Column header ─────────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto auto auto',
                gap: '12px', padding: '4px 14px',
            }}>
                {['Pair', 'Consistency', 'Last Seen', 'Status', '14 days', 'Today'].map((h) => (
                    <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                    </span>
                ))}
            </div>

            {/* ── Pair list ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                        No pairs match the current filters.
                    </div>
                ) : (
                    filtered.map((pair) => <PairRow key={pair.id} pair={pair} />)
                )}
            </div>

            {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
        </LeaderLayout>
    );
}
