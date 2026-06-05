import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';
import Sparkline from '@/Components/UI/Sparkline';
import StatusTag from '@/Components/UI/StatusTag';
import SummaryPill from '@/Components/UI/SummaryPill';

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

// ── Pair row ─────────────────────────────────────────────────────────────────

function PairRow({ pair }) {
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
        <Link
            href={`/leader/members/${pair.id}`}
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto auto auto',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
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
            <StatusTag status={pair.status} />

            {/* Sparkline */}
            <Sparkline data={pair.sparkline} width={80} height={22} color={sparklineColor} />

            {/* Today dot */}
            <TodayDot status={pair.today_submitted} />
        </Link>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TABS = ['All', 'At Risk', 'Watchlist'];
const STATUS_FILTER_MAP = {
    'All':      null,
    'At Risk':  ['at_risk', 'inactive'],
    'Watchlist':null,  // handled by watchlist data when available
};

export default function LeaderDashboard({ halqa, pairs, summary, absence_queue }) {
    const [tab, setTab]       = useState('All');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('consistency');
    const [statusFilter, setStatusFilter] = useState('');
    const [showQueue, setShowQueue] = useState(true);

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
        </LeaderLayout>
    );
}
