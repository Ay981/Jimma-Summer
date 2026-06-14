import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';
import Sparkline from '@/Components/UI/Sparkline';
import StatusTag from '@/Components/UI/StatusTag';
import SummaryPill from '@/Components/UI/SummaryPill';

// ── Pulse gauge (mirrors admin) ───────────────────────────────────────────────

function PulseMeter({ score }) {
    const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'oklch(70% 0.15 84)' : 'var(--destructive)';
    const cx = 60, cy = 60, r = 48;
    const circ = 2 * Math.PI * r;
    const dash  = (score / 100) * (circ * 0.75);
    const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Fair' : 'Low';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width={120} height={80} viewBox="0 0 120 80">
                <path d={`M ${cx-r},${cy} A ${r},${r} 0 1 1 ${cx+r},${cy}`}
                    fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
                <path d={`M ${cx-r},${cy} A ${r},${r} 0 1 1 ${cx+r},${cy}`}
                    fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                <text x={cx} y={cy-8}  textAnchor="middle" fontSize={22} fontWeight={700} fill={color}>{score}</text>
                <text x={cx} y={cy+8}  textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">{label}</text>
            </svg>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Halqa Pulse</p>
        </div>
    );
}

// ── Broadcast modal ───────────────────────────────────────────────────────────

function BroadcastModal({ onClose }) {
    const [msg, setMsg] = useState('');
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', width: '380px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>Broadcast to Halqa</h3>
                <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>All students in your halqa will receive this notification.</p>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Your message…" rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem', resize: 'none', fontFamily: 'inherit', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => { if (msg.trim()) router.post('/leader/broadcast', { message: msg }, { onSuccess: onClose }); }}
                        style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Send</button>
                </div>
            </div>
        </div>
    );
}

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
                <button onClick={() => setShowNote(!showNote)} style={{ padding: '3px 8px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>Note</button>
                <button onClick={mark} style={{ padding: '3px 8px', border: 'none', background: 'var(--success)', color: 'var(--success-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Done</button>
            </div>
            {showNote && (
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Quick note…"
                        style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' }} />
                    <button onClick={mark} style={{ padding: '5px 10px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Save</button>
                </div>
            )}
        </div>
    );
}

// ── Pair row ──────────────────────────────────────────────────────────────────

function TodayDot({ status }) {
    const c = { both: 'var(--success)', one: 'oklch(70% 0.15 84)', none: 'var(--destructive)' }[status] ?? 'var(--destructive)';
    const label = { both: 'Both submitted', one: 'One submitted', none: 'None submitted' }[status] ?? '';
    return <span title={label} style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: c, flexShrink: 0 }} />;
}

function PairRow({ pair }) {
    const sparkColor = {
        on_track: 'var(--success)', slipping: 'oklch(70% 0.15 84)',
        at_risk: 'var(--destructive)', inactive: 'var(--muted-foreground)',
    }[pair.status] ?? 'var(--success)';

    const lastSeen = pair.last_submission
        ? new Date(pair.last_submission).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'Never';

    return (
        <Link href={`/leader/members/${pair.id}`} style={{ textDecoration: 'none', color: 'var(--foreground)', display: 'contents' }}>
            <div className="pair-row"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
                style={{ cursor: 'pointer' }}
            >
                {/* Names */}
                <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{pair.student_a.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{pair.student_b?.name ?? '—'}</p>
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
                {/* Status */}
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
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>→</span>
            </div>
        </Link>
    );
}

// ── Student card ──────────────────────────────────────────────────────────────

function StudentCard({ student }) {
    const sparkColor = {
        on_track: 'var(--success)', slipping: 'oklch(70% 0.15 84)',
        at_risk: 'var(--destructive)', inactive: 'var(--muted-foreground)',
    }[student.status] ?? 'var(--success)';

    const lastSeen = student.last_submission
        ? new Date(student.last_submission).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'Never';

    const href = student.pair_id ? `/leader/members/${student.pair_id}` : null;

    const card = (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            transition: 'box-shadow 0.15s',
            cursor: href ? 'pointer' : 'default',
        }}
            onMouseEnter={(e) => href && (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{student.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{student.student_id}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
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
                    <p style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                        color: student.consistency >= 70 ? 'var(--success)' : student.consistency >= 40 ? 'oklch(55% 0.12 84)' : 'var(--destructive)'
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
                        {student.today_submitted ? 'Submitted today' : 'Not submitted yet'}
                    </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Last: {lastSeen}</span>
            </div>
        </div>
    );

    return href ? <Link href={href} style={{ textDecoration: 'none' }}>{card}</Link> : card;
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function LeaderDashboard({
    halqa, pairs, students, summary, today_subs,
    absence_queue, follow_up_queue, group_identity,
}) {
    const [view, setView] = useState(() => {
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search).get('view');
            if (p === 'students') return 'students';
        }
        return 'pairs';
    });
    const [search, setSearch]             = useState('');
    const [sortBy, setSortBy]             = useState('consistency');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAbsence, setShowAbsence]   = useState(true);
    const [showBroadcast, setShowBroadcast] = useState(false);

    const totalStudents = (pairs ?? []).reduce((acc, p) => acc + (p.student_b ? 2 : 1), 0);
    const pulse = totalStudents > 0 ? Math.round((today_subs / totalStudents) * 100) : 0;

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

    const Card = ({ title, children }) => (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>{title}</p>
            {children}
        </div>
    );

    return (
        <LeaderLayout title={halqa ? `${halqa.name}` : 'Leader Dashboard'}>
            <Head title="Leader Dashboard" />

            {/* ── Onboarding banner ──────────────────────────────────────── */}
            <div style={{
                background:'var(--secondary)',border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)',padding:'12px 16px',
                display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',
                marginBottom:'16px',
            }}>
                <div>
                    <p style={{margin:0,fontSize:'0.875rem',fontWeight:600,color:'var(--secondary-foreground)'}}>New to Muraja Monitor?</p>
                    <p style={{margin:'2px 0 0',fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>Download the visual leader onboarding guide.</p>
                </div>
                <a href="/leader/onboarding/guide" target="_blank" rel="noreferrer" style={{
                    padding:'7px 16px',background:'var(--primary)',color:'var(--primary-foreground)',
                    borderRadius:'var(--radius-sm)',fontWeight:600,fontSize:'0.8125rem',
                    textDecoration:'none',whiteSpace:'nowrap',flexShrink:0,
                }}>Download Guide (PDF)</a>
            </div>

            {/* ── Top: Pulse + stats + suggested actions ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'start' }} className="top-grid">

                {/* Pulse + quick counts */}
                <div data-onboard="pulse-meter" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <PulseMeter score={pulse} />
                    <div data-onboard="summary-pills" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                        {[
                            { label: 'Submitted today',  value: today_subs,      sub: `of ${totalStudents}` },
                            { label: 'On Track',          value: summary?.on_track ?? 0, color: 'var(--success)' },
                            { label: 'Slipping',          value: summary?.slipping  ?? 0, color: 'oklch(70% 0.15 84)' },
                            { label: 'At Risk',           value: summary?.at_risk   ?? 0, color: 'var(--destructive)' },
                            { label: 'Inactive',          value: summary?.inactive  ?? 0, color: 'var(--muted-foreground)' },
                            { label: 'Total pairs',       value: (pairs ?? []).length },
                        ].map(({ label, value, sub, color }) => (
                            <div key={label}>
                                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: color ?? 'var(--foreground)' }}>{value}</p>
                                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{label}{sub ? ` (${sub})` : ''}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Group identity panel */}
                {group_identity ? (
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>Halqa Standing</p>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: group_identity.consistency >= 70 ? 'var(--success)' : group_identity.consistency >= 40 ? 'oklch(55% 0.12 84)' : 'var(--destructive)', lineHeight: 1 }}>
                                    {group_identity.consistency}%
                                </p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>group consistency</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>#{group_identity.rank}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>of {group_identity.total_halqas} halqas</p>
                            </div>
                        </div>
                        {group_identity.top_student && (
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--foreground)' }}>
                                ⭐ This week: <strong>{group_identity.top_student.name}</strong>
                                <span style={{ color: 'var(--muted-foreground)', marginLeft: '4px' }}>{group_identity.top_student.count} days</span>
                            </p>
                        )}
                    </div>
                ) : <div />}

                {/* Actions */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', minWidth: '200px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>Quick Actions</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button onClick={() => setShowBroadcast(true)}
                            style={{ padding: '8px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                            📢 Broadcast to halqa
                        </button>
                        <a href="/leader/export/pdf" target="_blank" rel="noreferrer"
                            style={{ padding: '8px 12px', border: '1px solid var(--border)', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', color: 'var(--foreground)', display: 'block' }}>
                            📄 Export PDF report
                        </a>
                        <Link href="/leader/meetings"
                            style={{ padding: '8px 12px', border: '1px solid var(--border)', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none', color: 'var(--foreground)', display: 'block' }}>
                            📋 Log a meeting
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Follow-up queue ────────────────────────────────────────── */}
            {follow_up_queue?.length > 0 && (
                <div style={{ marginBottom: '14px', background: 'var(--card)', border: '1px solid oklch(82% 0.08 50)', borderLeft: '4px solid oklch(55% 0.12 50)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: 0, padding: '8px 14px', fontSize: '0.875rem', fontWeight: 700, color: 'oklch(40% 0.1 50)', borderBottom: '1px solid var(--border)' }}>
                        Follow-up Queue ({follow_up_queue.length})
                    </p>
                    {follow_up_queue.map((item, i) => (
                        <div key={i} style={{ padding: '7px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <span><strong>{item.student}</strong>: {item.description ?? item.note}</span>
                            <span style={{ color: 'var(--destructive)', fontSize: '0.75rem', flexShrink: 0 }}>
                                Due {item.due_date ?? item.snooze_until}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Absence queue (collapsible) ────────────────────────────── */}
            {absence_queue?.length > 0 && (
                <div data-onboard="absence-queue" style={{ marginBottom: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <button onClick={() => setShowAbsence(!showAbsence)}
                        style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'oklch(83% 0.08 84 / 0.15)', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Missed Yesterday · {absence_queue.length} pair{absence_queue.length !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{showAbsence ? 'Hide' : 'Show'}</span>
                    </button>
                    {showAbsence && (
                        <div style={{ background: 'var(--background)' }}>
                            {absence_queue.map((p) => <AbsenceItem key={p.id} pair={p} />)}
                            <div style={{ padding: '8px 12px' }}>
                                <button onClick={() => router.post('/leader/outreach/notify-all', {}, { preserveScroll: true })}
                                    style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Notify all absent pairs
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── View switcher + filters ────────────────────────────────── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                {/* Pairs / Students tabs */}
                <div style={{ display: 'flex', background: 'var(--muted)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
                    {[['pairs', 'Pairs'], ['students', 'Students']].map(([key, label]) => (
                        <button key={key} onClick={() => setView(key)}
                            style={{
                                padding: '5px 18px', borderRadius: 'calc(var(--radius-md) - 2px)',
                                border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: view === key ? 700 : 400,
                                background: view === key ? 'var(--card)' : 'transparent',
                                color: view === key ? 'var(--foreground)' : 'var(--muted-foreground)',
                                boxShadow: view === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.1s',
                            }}>
                            {label}
                            <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted-foreground)' }}>
                                {key === 'pairs' ? (pairs ?? []).length : (students ?? []).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Status filter */}
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', flex: '1 1 auto', minWidth: '120px' }}>
                    <option value="">All statuses</option>
                    <option value="on_track">On Track</option>
                    <option value="slipping">Slipping</option>
                    <option value="at_risk">At Risk</option>
                    <option value="inactive">Inactive</option>
                </select>

                {/* Sort */}
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', flex: '1 1 auto', minWidth: '120px' }}>
                    <option value="consistency">Sort: Consistency</option>
                    <option value="last_seen">Sort: Last Seen</option>
                    <option value="name">Sort: Name</option>
                </select>

                {/* Search */}
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder={view === 'pairs' ? 'Search pairs…' : 'Search students…'}
                    style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem', flex: '1 1 140px', minWidth: '120px' }} />
            </div>

            {/* ── Pairs view ─────────────────────────────────────────────── */}
            {view === 'pairs' && (
                <>
                    <div className="pair-row-header" style={{ padding: '4px 14px' }}>
                        {['Pair', 'Consistency', 'Last Seen', 'Status', '14 days', 'Today', ''].map((h) => (
                            <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                        ))}
                    </div>
                    <div data-onboard="pair-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredPairs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)', fontSize: '0.875rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                                No pairs match the current filters.
                            </div>
                        ) : filteredPairs.map((pair) => <PairRow key={pair.id} pair={pair} />)}
                    </div>
                </>
            )}

            {/* ── Students view ──────────────────────────────────────────── */}
            {view === 'students' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {filteredStudents.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)', fontSize: '0.875rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                            No students match the current filters.
                        </div>
                    ) : filteredStudents.map((s) => <StudentCard key={s.id} student={s} />)}
                </div>
            )}

            {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
        </LeaderLayout>
    );
}
