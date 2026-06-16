import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    FileArrowDown, ClipboardText,
    CaretRight, Warning, CheckCircle, TrendDown,
    MagnifyingGlass, UsersThree,
} from '@phosphor-icons/react';
import LeaderLayout from '@/Layouts/LeaderLayout';
import Sparkline from '@/Components/UI/Sparkline';
import StatusTag from '@/Components/UI/StatusTag';

// ── Absence follow-up item ────────────────────────────────────────────────────

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
        <div style={{ padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
            <span style={{ textDecoration: 'line-through' }}>{pair.student_a.name} &amp; {pair.student_b?.name}</span>
            <span style={{ color: 'var(--success)' }}>Followed up ✓</span>
        </div>
    );

    return (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 500 }}>{pair.student_a.name} &amp; {pair.student_b?.name}</span>
                <button
                    onClick={() => setShowNote(!showNote)}
                    style={{ padding: '3px 8px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                    Note
                </button>
                <button
                    onClick={mark}
                    style={{ padding: '3px 8px', border: 'none', background: 'var(--success)', color: 'var(--success-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
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

// ── Today dot ─────────────────────────────────────────────────────────────────

function TodayDot({ status }) {
    const c     = { both: 'var(--success)', one: 'oklch(70% 0.15 84)', none: 'var(--destructive)' }[status] ?? 'var(--destructive)';
    const label = { both: 'Both submitted', one: 'One submitted', none: 'None submitted' }[status] ?? '';
    return (
        <span
            title={label}
            aria-label={label}
            style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: c, flexShrink: 0 }}
        />
    );
}

// ── Pair row ──────────────────────────────────────────────────────────────────

function PairRow({ pair }) {
    const sparkColor = {
        on_track: 'var(--success)', slipping: 'oklch(70% 0.15 84)',
        at_risk:  'var(--destructive)', inactive: 'var(--muted-foreground)',
    }[pair.status] ?? 'var(--success)';

    const stripeColor = {
        on_track: 'var(--success)', slipping: 'oklch(70% 0.15 84)',
        at_risk:  'var(--destructive)', inactive: 'var(--muted-foreground)',
    }[pair.status] ?? 'var(--border)';

    const lastSeen = pair.last_submission
        ? new Date(pair.last_submission).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'Never';

    return (
        <Link href={`/leader/members/${pair.id}`} style={{ textDecoration: 'none', color: 'var(--foreground)', display: 'contents' }}>
            <div className="pair-row" style={{ borderLeft: `3px solid ${stripeColor}`, paddingLeft: '12px' }}>
                {/* Names */}
                <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pair.student_a.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pair.student_b?.name ?? <em>Solo</em>}</p>
                </div>
                {/* Consistency */}
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pair.consistency}%</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>consistency</p>
                </div>
                {/* Last seen */}
                <div style={{ textAlign: 'right' }} className="pair-row-hide-mobile">
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{lastSeen}</p>
                </div>
                {/* Status tag */}
                <span className="pair-row-hide-mobile">
                    {pair.status ? <StatusTag status={pair.status} /> : null}
                </span>
                {/* Sparkline */}
                <span className="pair-row-hide-mobile">
                    <Sparkline data={pair.sparkline} width={72} height={20} color={sparkColor} />
                </span>
                {/* Today */}
                <TodayDot status={pair.today_submitted} />
                {/* Arrow */}
                <CaretRight size={16} style={{ color: 'var(--muted-foreground)', alignSelf: 'center', flexShrink: 0 }} />
            </div>
        </Link>
    );
}

// ── Student card ──────────────────────────────────────────────────────────────

function StudentCard({ student }) {
    const sparkColor = {
        on_track: 'var(--success)', slipping: 'oklch(70% 0.15 84)',
        at_risk:  'var(--destructive)', inactive: 'var(--muted-foreground)',
    }[student.status] ?? 'var(--success)';

    const lastSeen = student.last_submission
        ? new Date(student.last_submission).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'Never';

    const href = student.pair_id ? `/leader/members/${student.pair_id}` : null;

    const card = (
        <div
            className="student-card"
            style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: '10px',
                transition: 'box-shadow 0.15s',
                cursor: href ? 'pointer' : 'default',
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{student.student_id}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    {student.status && <StatusTag status={student.status} />}
                    {student.is_solo && (
                        <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--secondary)', color: 'var(--secondary-foreground)', fontWeight: 600 }}>
                            Solo
                        </span>
                    )}
                </div>
            </div>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div>
                    <p style={{
                        margin: 0, fontSize: '1.375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                        color: student.consistency >= 70 ? 'var(--success)' : student.consistency >= 40 ? 'oklch(55% 0.12 84)' : 'var(--destructive)',
                    }}>
                        {student.consistency}%
                    </p>
                    <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>consistency</p>
                </div>
                <div style={{ flex: 1 }}>
                    <Sparkline data={student.sparkline} width="100%" height={28} color={sparkColor} />
                </div>
            </div>
            {/* Footer row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: student.today_submitted ? 'var(--success)' : 'var(--muted-foreground)',
                    }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {student.today_submitted ? 'Submitted today' : 'Not yet today'}
                    </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Last: {lastSeen}</span>
            </div>
        </div>
    );

    return href ? <Link href={href} style={{ textDecoration: 'none' }}>{card}</Link> : card;
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

// ── Icon action button ────────────────────────────────────────────────────────

function ActionIconButton({ onClick, href, icon: Icon, label, primary }) {
    const base = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 13px', borderRadius: 'var(--radius-sm)',
        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap', textDecoration: 'none',
        border: primary ? 'none' : '1px solid var(--border)',
        background: primary ? 'var(--primary)' : 'var(--card)',
        color: primary ? 'var(--primary-foreground)' : 'var(--foreground)',
        transition: 'opacity 0.1s',
    };

    if (href) {
        return (
            <a href={href} target="_blank" rel="noreferrer" style={base}>
                <Icon size={15} weight="bold" />
                <span className="action-label">{label}</span>
            </a>
        );
    }
    return (
        <button onClick={onClick} style={base}>
            <Icon size={15} weight="bold" />
            <span className="action-label">{label}</span>
        </button>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function LeaderDashboard({
    halqa, pairs, students, summary, today_subs,
    absence_queue, follow_up_queue, group_identity,
}) {
    const view = typeof window !== 'undefined'
        ? (new URLSearchParams(window.location.search).get('view') ?? 'overview')
        : 'overview';

    const [search, setSearch]             = useState('');
    const [sortBy, setSortBy]             = useState('consistency');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAbsence, setShowAbsence]   = useState(true);

    const totalStudents = (pairs ?? []).reduce((acc, p) => acc + (p.student_b ? 2 : 1), 0);

    // Filtered + sorted pairs
    const filteredPairs = useMemo(() => {
        let list = [...(pairs ?? [])];
        if (statusFilter) list = list.filter((p) => p.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((p) => p.student_a.name.toLowerCase().includes(q) || p.student_b?.name?.toLowerCase().includes(q));
        }
        if (sortBy === 'consistency') list.sort((a, b) => b.consistency - a.consistency);
        else if (sortBy === 'last_seen') list.sort((a, b) => new Date(b.last_submission ?? 0) - new Date(a.last_submission ?? 0));
        else if (sortBy === 'name') list.sort((a, b) => a.student_a.name.localeCompare(b.student_a.name));
        return list;
    }, [pairs, search, sortBy, statusFilter]);

    // Filtered + sorted students
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

    const LABEL_STYLE = { fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' };

    return (
        <LeaderLayout title={halqa ? halqa.name : 'Leader Dashboard'}>
            <Head title="Leader Dashboard" />

            {/* ── HEADER ROW ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {/* Left: halqa name + today counter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UsersThree size={20} weight="duotone" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {halqa?.name ?? 'Your Halqa'}
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)', paddingLeft: '28px' }}>
                        Today:&nbsp;
                        <strong style={{ color: today_subs > 0 ? 'var(--success)' : 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                            {today_subs}
                        </strong>
                        <span style={{ color: 'var(--muted-foreground)' }}>/{totalStudents} submitted</span>
                    </p>
                </div>

                {/* Right: action buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                    <ActionIconButton href="/leader/export/pdf" icon={FileArrowDown} label="Export PDF" />
                    <ActionIconButton href="/leader/meetings"   icon={ClipboardText} label="Log Meeting" />
                </div>
            </div>

            {/* ── STAT CARDS ROW ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }} data-onboard="summary-pills">
                <StatCard
                    label="On Track"
                    value={summary?.on_track ?? 0}
                    color="var(--success)"
                    icon={CheckCircle}
                />
                <StatCard
                    label="Slipping"
                    value={summary?.slipping ?? 0}
                    color="oklch(70% 0.15 84)"
                    icon={TrendDown}
                />
                <StatCard
                    label="At Risk"
                    value={summary?.at_risk ?? 0}
                    color="var(--destructive)"
                    icon={Warning}
                />
                <StatCard
                    label="Inactive"
                    value={summary?.inactive ?? 0}
                    color="var(--muted-foreground)"
                />
            </div>

            {/* ── GROUP IDENTITY BANNER ────────────────────────────────────── */}
            {group_identity && (
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: '9px 14px',
                    display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
                    marginBottom: '12px',
                }}>
                    <p style={{ ...LABEL_STYLE, margin: 0, flexShrink: 0 }}>Halqa Standing</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{
                            fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                            color: group_identity.consistency >= 70 ? 'var(--success)' : group_identity.consistency >= 40 ? 'oklch(55% 0.12 84)' : 'var(--destructive)',
                        }}>
                            {group_identity.consistency}%
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>consistency</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            #{group_identity.rank}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>of {group_identity.total_halqas} halqas</span>
                    </div>
                    {group_identity.top_student && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Top this week:</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{group_identity.top_student.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{group_identity.top_student.count} days</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── FOLLOW-UP QUEUE BANNER ───────────────────────────────────── */}
            {follow_up_queue?.length > 0 && (
                <div style={{
                    marginBottom: '12px', background: 'oklch(99% 0.02 84)',
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

            {/* ── ABSENCE QUEUE (collapsible) ──────────────────────────────── */}
            {absence_queue?.length > 0 && (
                <div data-onboard="absence-queue" style={{ marginBottom: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <button
                        onClick={() => setShowAbsence(!showAbsence)}
                        style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'oklch(83% 0.08 84 / 0.15)', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}
                    >
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Missed Yesterday &nbsp;·&nbsp; {absence_queue.length} pair{absence_queue.length !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{showAbsence ? 'Hide' : 'Show'}</span>
                    </button>
                    {showAbsence && (
                        <div style={{ background: 'var(--background)' }}>
                            {absence_queue.map((p) => <AbsenceItem key={p.id} pair={p} />)}
                            <div style={{ padding: '8px 12px' }}>
                                <button
                                    onClick={() => router.post('/leader/outreach/notify-all', {}, { preserveScroll: true })}
                                    style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Notify all absent pairs
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── PAIRS / STUDENTS VIEWS ──────────────────────────────────── */}
            {(view === 'pairs' || view === 'students') && (<>

                {/* Filter bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', flex: '1 1 auto', minWidth: '120px' }}>
                        <option value="">All statuses</option>
                        <option value="on_track">On Track</option>
                        <option value="slipping">Slipping</option>
                        <option value="at_risk">At Risk</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', flex: '1 1 auto', minWidth: '120px' }}>
                        <option value="consistency">Sort: Consistency</option>
                        <option value="last_seen">Sort: Last Seen</option>
                        <option value="name">Sort: Name</option>
                    </select>
                    <div style={{ position: 'relative', flex: '1 1 160px', minWidth: '120px' }}>
                        <MagnifyingGlass size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder={view === 'pairs' ? 'Search pairs…' : 'Search students…'}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px 6px 28px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' }} />
                    </div>
                </div>

                {view === 'pairs' && (<>
                    <div className="pair-row-header" style={{ padding: '4px 14px', paddingLeft: '17px' }}>
                        {['Pair', 'Consistency', 'Last Seen', 'Status', '14 days', 'Today', ''].map((h, i) => (
                            <span key={i} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                        ))}
                    </div>
                    <div data-onboard="pair-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredPairs.length === 0
                            ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)', fontSize: '0.875rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>No pairs match the current filters.</div>
                            : filteredPairs.map((pair) => <PairRow key={pair.id} pair={pair} />)}
                    </div>
                </>)}

                {view === 'students' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                        {filteredStudents.length === 0
                            ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)', fontSize: '0.875rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>No students match the current filters.</div>
                            : filteredStudents.map((s) => <StudentCard key={s.id} student={s} />)}
                    </div>
                )}
            </>)}

            <style>{`
                @media (max-width: 480px) {
                    .action-label { display: none; }
                }
                .student-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
            `}</style>
        </LeaderLayout>
    );
}
