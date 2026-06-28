import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    FileArrowDown, ClipboardText, CaretRight, Warning, CheckCircle, TrendDown,
    MagnifyingGlass, UsersThree, Megaphone,
} from '@phosphor-icons/react';
import LeaderLayout from '@/Layouts/LeaderLayout';
import StatusTag from '@/Components/UI/StatusTag';

// ── Helpers ───────────────────────────────────────────────────────────────────

function diffForHumans(dateStr) {
    if (!dateStr) return null;
    const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
}

function consistencyColor(pct) {
    if (pct == null) return 'var(--muted-foreground)';
    if (pct >= 70) return 'var(--success)';
    if (pct >= 40) return 'oklch(55% 0.12 84)';
    return 'var(--destructive)';
}

// ── Mini 7-day activity strip ─────────────────────────────────────────────────

function MiniStrip({ sparkline }) {
    const last7 = (sparkline ?? []).slice(-7);
    return (
        <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
            {last7.map((v, i) => (
                <span key={i} style={{
                    width: '6px', height: '6px', borderRadius: '2px', flexShrink: 0,
                    background: v ? 'var(--success)' : 'var(--border)',
                }} />
            ))}
        </div>
    );
}

// ── Today dot ─────────────────────────────────────────────────────────────────

function TodayDot({ status }) {
    const submitted = status !== 'none';
    const label = { both: 'Both submitted', one: 'One submitted', none: 'None submitted' }[status] ?? '';
    return (
        <span
            title={label}
            aria-label={label}
            style={{
                display: 'inline-block', width: '10px', height: '10px',
                borderRadius: '50%', flexShrink: 0,
                background: submitted ? 'var(--success)' : 'transparent',
                border: submitted ? 'none' : '1.5px solid var(--muted-foreground)',
            }}
        />
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon }) {
    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', borderTop: `3px solid ${color}`,
            padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px',
            flex: '1 1 0', minWidth: 0,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
                    {label}
                </p>
                {Icon && <Icon size={15} style={{ color, opacity: 0.7 }} weight="bold" />}
            </div>
            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color }}>
                {value}
            </p>
        </div>
    );
}

// ── Absence queue item ────────────────────────────────────────────────────────

function StudentMissed({ student, submitted }) {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem' }}>
            <span style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: submitted ? 'var(--success)' : 'var(--destructive)',
            }} />
            <span style={{ color: submitted ? 'var(--muted-foreground)' : 'var(--foreground)', fontWeight: submitted ? 400 : 600 }}>
                {student.name}
            </span>
            {submitted && <span style={{ fontSize: '0.6875rem', color: 'var(--success)' }}>✓</span>}
        </span>
    );
}

function AbsenceItem({ pair }) {
    const [note, setNote]         = useState('');
    const [showNote, setShowNote] = useState(false);
    const [done, setDone]         = useState(false);

    function mark() {
        router.post(`/leader/outreach/followup/${pair.id}`, { note: note || undefined }, {
            preserveScroll: true, onSuccess: () => setDone(true),
        });
    }

    if (done) return (
        <div style={{ padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gold-200)' }}>
            <span style={{ textDecoration: 'line-through' }}>{pair.student_a.name} &amp; {pair.student_b?.name}</span>
            <span style={{ color: 'var(--success)' }}>Followed up ✓</span>
        </div>
    );

    return (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--gold-200)' }}>
            {/* Who missed */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <StudentMissed student={pair.student_a} submitted={pair.student_a.submitted_yesterday} />
                {pair.student_b?.name && (
                    <StudentMissed student={pair.student_b} submitted={pair.student_b.submitted_yesterday} />
                )}
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                    onClick={() => setShowNote(!showNote)}
                    style={{ padding: '3px 10px', border: '1px solid var(--gold-400)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--gold-700)' }}
                >
                    Note
                </button>
                <button
                    onClick={mark}
                    style={{ padding: '3px 10px', border: 'none', background: 'var(--success)', color: 'var(--success-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                    Done
                </button>
            </div>
            {showNote && (
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Quick note…"
                        style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' }}
                    />
                    <button
                        onClick={mark}
                        style={{ padding: '5px 10px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Dashboard triage row (overview) ──────────────────────────────────────────

const STATUS_ACCENT = {
    at_risk:  'var(--destructive)',
    slipping: 'oklch(70% 0.15 84)',
    inactive: 'var(--muted-foreground)',
    on_track: 'var(--success)',
};

function TriagePairRow({ pair }) {
    const c      = consistencyColor(pair.consistency);
    const accent = STATUS_ACCENT[pair.status] ?? 'var(--border)';
    const lastAgo = pair.last_submission ? diffForHumans(pair.last_submission) : null;

    return (
        <Link href={`/leader/members/${pair.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dash-pair-row" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', background: 'var(--card)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer', transition: 'box-shadow 0.12s',
            }}>
                {/* Names */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pair.student_a.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pair.student_b?.name ?? <em>Solo</em>}
                    </p>
                    {lastAgo
                        ? <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Last: {lastAgo}</p>
                        : <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: 'var(--destructive)' }}>Never submitted</p>
                    }
                </div>
                {/* Consistency */}
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: c, flexShrink: 0 }}>
                    {pair.consistency != null ? `${pair.consistency}%` : '—'}
                </span>
                {/* Status */}
                {pair.status && (
                    <span className="dash-status-hide-xs">
                        <StatusTag status={pair.status} />
                    </span>
                )}
                {/* Today dot */}
                <TodayDot status={pair.today_submitted} />
                {/* Chevron */}
                <CaretRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            </div>
        </Link>
    );
}

// ── Pairs tab row (enhanced) ──────────────────────────────────────────────────

function PairRow({ pair }) {
    const c       = consistencyColor(pair.consistency);
    const lastAgo = pair.last_submission ? diffForHumans(pair.last_submission) : null;

    return (
        <Link href={`/leader/members/${pair.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="pair-row" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', background: 'var(--card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', transition: 'box-shadow 0.12s, border-color 0.12s',
            }}>
                {/* Left: names + activity strip */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pair.student_a.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pair.student_b?.name ?? <em>Solo</em>}
                    </p>
                    <MiniStrip sparkline={pair.sparkline} />
                </div>
                {/* Consistency + last submission */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: c }}>
                        {pair.consistency != null ? `${pair.consistency}%` : '—'}
                    </p>
                    {lastAgo
                        ? <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>Last: {lastAgo}</p>
                        : <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: 'var(--destructive)', whiteSpace: 'nowrap' }}>Never submitted</p>
                    }
                </div>
                {/* Status tag */}
                {pair.status && (
                    <span className="pair-status-hide-xs">
                        <StatusTag status={pair.status} />
                    </span>
                )}
                {/* Today dot */}
                <TodayDot status={pair.today_submitted} />
                {/* Chevron */}
                <CaretRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            </div>
        </Link>
    );
}

// ── Student row ───────────────────────────────────────────────────────────────

function StudentRow({ student, certPublished }) {
    const c    = consistencyColor(student.consistency);
    const href = student.pair_id ? `/leader/members/${student.pair_id}` : null;
    const lastAgo = student.last_submission ? diffForHumans(student.last_submission) : null;
    const initial = student.name?.charAt(0)?.toUpperCase() ?? '?';

    const row = (
        <div className="student-row" style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            cursor: href ? 'pointer' : 'default',
            transition: 'box-shadow 0.12s, border-color 0.12s',
        }}>
            {/* Avatar */}
            <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--green-100)', color: 'var(--green-800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', fontWeight: 700,
            }}>
                {initial}
            </div>
            {/* Name + ID + strip */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {student.name}
                    {student.is_solo && (
                        <span style={{ marginLeft: '6px', fontSize: '0.6875rem', padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: 'var(--secondary)', color: 'var(--secondary-foreground)', fontWeight: 600, verticalAlign: 'middle' }}>Solo</span>
                    )}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {student.student_id}
                    {lastAgo && <span style={{ marginLeft: '8px' }}>· Last: {lastAgo}</span>}
                    {!lastAgo && <span style={{ marginLeft: '8px', color: 'var(--destructive)' }}>· Never submitted</span>}
                </p>
                <MiniStrip sparkline={student.sparkline} />
            </div>
            {/* Consistency */}
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: c, flexShrink: 0 }}>
                {student.consistency != null ? `${student.consistency}%` : '—'}
            </span>
            {/* Status */}
            {student.status && (
                <span className="student-status-hide-xs">
                    <StatusTag status={student.status} />
                </span>
            )}
            {/* Today dot */}
            <span
                aria-label={student.today_submitted ? 'Submitted today' : 'Not yet today'}
                title={student.today_submitted ? 'Submitted today' : 'Not yet today'}
                style={{
                    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                    background: student.today_submitted ? 'var(--success)' : 'transparent',
                    border: student.today_submitted ? 'none' : '1.5px solid var(--muted-foreground)',
                }}
            />
            {/* Cert download */}
            {certPublished && (
                <a
                    href={`/leader/certificates/${student.id}/download`}
                    onClick={e => e.stopPropagation()}
                    title="Download certificate"
                    style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        color: 'var(--foreground)', textDecoration: 'none', flexShrink: 0,
                        background: 'var(--card)', whiteSpace: 'nowrap',
                    }}
                >
                    PDF ↓
                </a>
            )}
            {/* Chevron */}
            {href && <CaretRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
        </div>
    );

    return href
        ? <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{row}</Link>
        : row;
}

// ── Broadcast modal ───────────────────────────────────────────────────────────

function BroadcastModal({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({ title: '', body: '' });

    function submit(e) {
        e.preventDefault();
        post('/leader/announcements', {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    const inp = {
        width: '100%', boxSizing: 'border-box', padding: '9px 11px',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem',
        fontFamily: 'inherit',
    };

    return (
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed', inset: 0, zIndex: 500,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}
        >
            <div style={{
                width: '100%', maxWidth: '520px',
                background: 'var(--card)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                padding: '20px 20px 32px',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Post to Halqa</p>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1, padding: '2px 6px' }}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <input
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="Title…"
                            required
                            style={inp}
                        />
                        {errors.title && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.title}</p>}
                    </div>
                    <div>
                        <textarea
                            value={data.body}
                            onChange={e => setData('body', e.target.value)}
                            placeholder="Write your announcement…"
                            rows={4}
                            required
                            style={{ ...inp, resize: 'vertical' }}
                        />
                        <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'right' }}>
                            {data.body.length} / 5000
                        </p>
                        {errors.body && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.body}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '8px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{ padding: '8px 18px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}
                        >
                            {processing ? 'Posting…' : 'Post & Notify Students'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function LeaderDashboard({
    halqa, pairs, students, summary, today_subs,
    absence_queue, follow_up_queue, group_identity,
    certificates_published,
}) {
    const view = typeof window !== 'undefined'
        ? (new URLSearchParams(window.location.search).get('view') ?? 'overview')
        : 'overview';

    const [search, setSearch]             = useState('');
    const [sortBy, setSortBy]             = useState('consistency');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAbsence, setShowAbsence]   = useState(true);
    const [showBroadcast, setShowBroadcast] = useState(false);

    const totalPairs     = (pairs ?? []).length;
    const totalStudents  = (pairs ?? []).reduce((acc, p) => acc + (p.student_b ? 2 : 1), 0);
    const submittedPairs = (pairs ?? []).filter((p) => p.today_submitted !== 'none').length;

    const summaryColor = submittedPairs >= totalPairs && totalPairs > 0
        ? 'var(--success)'
        : submittedPairs < totalPairs / 2
            ? 'var(--destructive)'
            : 'oklch(55% 0.12 84)';

    // Filtered + sorted pairs for Pairs tab
    const filteredPairs = useMemo(() => {
        let list = [...(pairs ?? [])];
        if (statusFilter) list = list.filter((p) => p.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((p) =>
                p.student_a.name.toLowerCase().includes(q) ||
                p.student_b?.name?.toLowerCase().includes(q)
            );
        }
        if (sortBy === 'consistency') list.sort((a, b) => b.consistency - a.consistency);
        else if (sortBy === 'last_seen') list.sort((a, b) => new Date(b.last_submission ?? 0) - new Date(a.last_submission ?? 0));
        else if (sortBy === 'name') list.sort((a, b) => a.student_a.name.localeCompare(b.student_a.name));
        return list;
    }, [pairs, search, sortBy, statusFilter]);

    const filteredStudents = useMemo(() => {
        let list = [...(students ?? [])];
        if (statusFilter) list = list.filter((s) => s.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((s) => s.name.toLowerCase().includes(q));
        }
        if (sortBy === 'consistency') list.sort((a, b) => b.consistency - a.consistency);
        else if (sortBy === 'last_seen') list.sort((a, b) => new Date(b.last_submission ?? 0) - new Date(a.last_submission ?? 0));
        else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [students, search, sortBy, statusFilter]);

    // Dashboard triage groups
    const attentionPairs = useMemo(() =>
        (pairs ?? []).filter(p => ['at_risk', 'inactive', 'slipping'].includes(p.status))
            .sort((a, b) => {
                const order = { at_risk: 0, inactive: 1, slipping: 2 };
                return (order[a.status] ?? 3) - (order[b.status] ?? 3);
            }),
    [pairs]);

    const onTrackPairs = useMemo(() =>
        (pairs ?? []).filter(p => p.status === 'on_track' || !p.status),
    [pairs]);

    return (
        <LeaderLayout title={halqa ? halqa.name : 'Leader Dashboard'}>
            <Head title="Leader Dashboard" />

            {/* ── HEADER ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UsersThree size={20} weight="duotone" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {halqa?.name ?? 'Your Halqa'}
                        </h1>
                    </div>
                    {/* Summary line */}
                    <p style={{ margin: 0, fontSize: '0.8125rem', paddingLeft: '28px', color: 'var(--muted-foreground)' }}>
                        <span style={{ fontWeight: 700, color: summaryColor, fontVariantNumeric: 'tabular-nums' }}>
                            {submittedPairs}
                        </span>
                        {' of '}
                        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{totalPairs}</strong>
                        {' pairs submitted today'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                    <a
                        href="/leader/export/pdf"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                        <FileArrowDown size={15} weight="bold" />
                        <span className="action-label">Export PDF</span>
                    </a>
                    <Link
                        href="/leader/meetings"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                        <ClipboardText size={15} weight="bold" />
                        <span className="action-label">Log Meeting</span>
                    </Link>
                </div>
            </div>

            {/* ── STAT CARDS ──────────────────────────────────────────── */}
            <div className="stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                <StatCard label="On Track"  value={summary?.on_track ?? 0} color="var(--success)"         icon={CheckCircle} />
                <StatCard label="Slipping"  value={summary?.slipping ?? 0} color="oklch(70% 0.15 84)"     icon={TrendDown} />
                <StatCard label="At Risk"   value={summary?.at_risk ?? 0}  color="var(--destructive)"      icon={Warning} />
                <StatCard label="Inactive"  value={summary?.inactive ?? 0} color="var(--muted-foreground)" />
            </div>

            {/* ── LEADER CERT BANNER ──────────────────────────────────── */}
            {certificates_published && (
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Your Leader Certificate is Ready</p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Download your leader completion certificate for this program.</p>
                    </div>
                    <a href="/leader/certificate/download" style={{
                        padding: '7px 16px', background: 'var(--primary)', color: 'var(--primary-foreground)',
                        borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem',
                        textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                        Download Certificate ↓
                    </a>
                </div>
            )}

            {/* ── ABSENCE QUEUE — hidden on overview ───────────────────── */}
            {view !== 'overview' && absence_queue?.length > 0 && (
                <div style={{
                    marginBottom: '14px',
                    background: 'var(--gold-50)',
                    border: '1px solid var(--gold-200)',
                    borderLeft: '3px solid var(--gold-500)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                }}>
                    <button
                        onClick={() => setShowAbsence(!showAbsence)}
                        style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', borderBottom: showAbsence ? '1px solid var(--gold-200)' : 'none', cursor: 'pointer', color: 'var(--foreground)' }}
                    >
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gold-800)' }}>
                            Missed Yesterday &nbsp;·&nbsp; {absence_queue.length} pair{absence_queue.length !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold-600)' }}>{showAbsence ? 'Hide' : 'Show'}</span>
                    </button>
                    {showAbsence && (
                        <>
                            {absence_queue.map((p) => <AbsenceItem key={p.id} pair={p} />)}
                            <div style={{ padding: '10px 12px' }}>
                                <button
                                    onClick={() => router.post('/leader/outreach/notify-all', {}, { preserveScroll: true })}
                                    style={{ padding: '6px 14px', border: 'none', background: 'var(--gold-600)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Notify all absent pairs
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── FOLLOW-UP QUEUE — hidden on overview ─────────────────── */}
            {view !== 'overview' && follow_up_queue?.length > 0 && (
                <div style={{
                    marginBottom: '14px', background: 'oklch(99% 0.02 84)',
                    border: '1px solid oklch(82% 0.08 84)', borderLeft: '4px solid oklch(65% 0.13 84)',
                    borderRadius: 'var(--radius-md)',
                }}>
                    <p style={{ margin: 0, padding: '8px 14px', fontSize: '0.875rem', fontWeight: 700, color: 'oklch(40% 0.1 84)', borderBottom: '1px solid oklch(88% 0.06 84)' }}>
                        Follow-up Queue &nbsp;
                        <span style={{ fontWeight: 400, fontSize: '0.8125rem', color: 'oklch(50% 0.08 84)' }}>({follow_up_queue.length} pending)</span>
                    </p>
                    {follow_up_queue.map((item, i) => (
                        <div
                            key={i}
                            style={{ padding: '7px 14px', borderBottom: i < follow_up_queue.length - 1 ? '1px solid oklch(88% 0.06 84)' : 'none', fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                        >
                            <span><strong>{item.student}</strong>: {item.description ?? item.note}</span>
                            <span style={{ color: 'var(--destructive)', fontSize: '0.75rem', flexShrink: 0 }}>
                                Due {item.due_date ?? item.snooze_until}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── PAIRS / STUDENTS TAB VIEWS ──────────────────────────── */}
            {(view === 'pairs' || view === 'students') && (<>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', flex: '1 1 auto', minWidth: '120px' }}
                    >
                        <option value="">All statuses</option>
                        <option value="on_track">On Track</option>
                        <option value="slipping">Slipping</option>
                        <option value="at_risk">At Risk</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', flex: '1 1 auto', minWidth: '120px' }}
                    >
                        <option value="consistency">Sort: Consistency</option>
                        <option value="last_seen">Sort: Last Seen</option>
                        <option value="name">Sort: Name</option>
                    </select>
                    <div style={{ position: 'relative', flex: '1 1 160px', minWidth: '120px' }}>
                        <MagnifyingGlass size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={view === 'pairs' ? 'Search pairs…' : 'Search students…'}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px 6px 28px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }}
                        />
                    </div>
                </div>

                {view === 'pairs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredPairs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted-foreground)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                                <UsersThree size={40} style={{ marginBottom: '12px', opacity: 0.35, display: 'block', margin: '0 auto 12px' }} />
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9375rem' }}>No pairs assigned yet</p>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>Contact your admin to set up pairs for your halqa</p>
                            </div>
                        ) : (
                            filteredPairs.map((pair) => <PairRow key={pair.id} pair={pair} />)
                        )}
                    </div>
                )}

                {view === 'students' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredStudents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted-foreground)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                                <UsersThree size={40} style={{ opacity: 0.35, display: 'block', margin: '0 auto 12px' }} />
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9375rem' }}>No students found</p>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>Try adjusting the filters above</p>
                            </div>
                        ) : (
                            filteredStudents.map((s) => <StudentRow key={s.id} student={s} certPublished={certificates_published} />)
                        )}
                    </div>
                )}
            </>)}

            {/* ── OVERVIEW: SUMMARY INFO + QUICK ACTIONS ───────────────── */}
            {view === 'overview' && (<>

                {/* Summary info card */}
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', marginBottom: '16px', overflow: 'hidden',
                }}>
                    {[
                        {
                            label: `${submittedPairs} of ${totalPairs} pairs submitted today`,
                            color: summaryColor,
                            dot: summaryColor,
                        },
                        onTrackPairs.length > 0 && {
                            label: `${onTrackPairs.length} pair${onTrackPairs.length !== 1 ? 's' : ''} on track`,
                            color: 'var(--foreground)',
                            dot: 'var(--success)',
                        },
                        attentionPairs.length > 0 && {
                            label: `${attentionPairs.length} pair${attentionPairs.length !== 1 ? 's' : ''} need attention`,
                            color: 'var(--destructive)',
                            dot: 'var(--destructive)',
                            href: '?view=pairs',
                        },
                        (absence_queue?.length > 0) && {
                            label: `${absence_queue.length} pair${absence_queue.length !== 1 ? 's' : ''} missed yesterday`,
                            color: 'oklch(55% 0.12 84)',
                            dot: 'oklch(70% 0.15 84)',
                        },
                        (follow_up_queue?.length > 0) && {
                            label: `${follow_up_queue.length} follow-up${follow_up_queue.length !== 1 ? 's' : ''} overdue`,
                            color: 'var(--foreground)',
                            dot: 'var(--destructive)',
                        },
                    ].filter(Boolean).map((item, i, arr) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '11px 16px',
                                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                                <span style={{ fontSize: '0.9rem', color: item.color, fontWeight: i === 0 ? 600 : 400 }}>
                                    {item.label}
                                </span>
                            </div>
                            {item.href && (
                                <Link href={item.href} style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>
                                    View →
                                </Link>
                            )}
                        </div>
                    ))}
                    {(pairs ?? []).length === 0 && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                            No pairs assigned yet — contact your admin
                        </div>
                    )}
                </div>

                {/* Broadcast shortcut */}
                <button
                    onClick={() => setShowBroadcast(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, border: '1.5px solid var(--gold-400)', background: 'transparent', color: 'var(--gold-700)', cursor: 'pointer', width: '100%' }}
                >
                    <Megaphone size={16} weight="bold" />
                    Broadcast to Halqa
                </button>
            </>)}

            {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}

            <style>{`
                @media (max-width: 600px) {
                    .stat-cards { grid-template-columns: 1fr 1fr !important; }
                }
                @media (max-width: 480px) {
                    .action-label { display: none; }
                    .dash-status-hide-xs { display: none; }
                    .pair-status-hide-xs { display: none; }
                }
                .dash-pair-row:hover,
                .pair-row:hover,
                .student-row:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
                    border-color: var(--green-300) !important;
                }
                @media (max-width: 480px) {
                    .student-status-hide-xs { display: none; }
                }
            `}</style>
        </LeaderLayout>
    );
}
