import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

function RankBadge({ rank }) {
    return (
        <span style={{ fontSize: rank <= 3 ? '1.125rem' : '0.875rem', fontVariantNumeric: 'tabular-nums', minWidth: '28px', display: 'inline-block', textAlign: 'center' }}>
            {MEDAL[rank] ?? rank}
        </span>
    );
}

// ── Fix 3: Two-step lock modal with confirmation ──────────────────────────────

function LockModal({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({ program_name: '' });
    const [confirmed, setConfirmed] = useState(false);

    function submit(e) {
        e.preventDefault();
        if (!confirmed) { setConfirmed(true); return; }
        post('/admin/leaderboard/lock', { onSuccess: onClose });
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '400px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700 }}>Lock & Archive Leaderboard</h3>

                {!confirmed ? (
                    <>
                        <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            Enter the program name to save a permanent snapshot of the current rankings.
                        </p>
                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input value={data.program_name} onChange={(e) => setData('program_name', e.target.value)}
                                placeholder="e.g. Summer 1446H"
                                style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                            {errors.program_name && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', margin: 0 }}>{errors.program_name}</p>}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={onClose} style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={!data.program_name.trim()} style={{ padding: '7px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: !data.program_name.trim() ? 0.6 : 1 }}>Continue →</button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <div style={{ padding: '12px 14px', background: 'oklch(97% 0.04 20)', border: '1px solid oklch(85% 0.1 20)', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--status-at-risk)' }}>⚠ Are you sure?</p>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--status-at-risk)' }}>
                                This saves a permanent snapshot for <strong>"{data.program_name}"</strong>. The leaderboard will be locked. This action cannot be undone (but an admin can manually unlock in emergencies).
                            </p>
                        </div>
                        <form onSubmit={submit} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setConfirmed(false)} style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>← Back</button>
                            <button type="submit" disabled={processing} style={{ padding: '7px 16px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer' }}>
                                {processing ? 'Locking…' : '🔒 Lock for real'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Shared table utilities ────────────────────────────────────────────────────

const NUM = { fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' };
const HDR = { fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

// Responsive table wrapper: scrolls on mobile, fills width on desktop.
// header and rows share the same className so media queries hit both together.
function LbTable({ cols, colsMobile, headers, rows, className }) {
    const gridStyle = (mobile) => ({
        display: 'grid',
        gridTemplateColumns: mobile ? colsMobile : cols,
        gap: '8px',
        alignItems: 'center',
    });

    return (
        <>
            <style>{`
                .${className}-row        { ${objToCSS(gridStyle(false))} padding: 9px 12px; border-bottom: 1px solid var(--border); }
                .${className}-header     { ${objToCSS(gridStyle(false))} padding: 6px 12px; border-bottom: 1px solid var(--border); }
                .${className}-hide       { }
                .${className}-hdr-short  { display: none; }
                @media (max-width: 640px) {
                    .${className}-row      { ${objToCSS(gridStyle(true))} }
                    .${className}-header   { ${objToCSS(gridStyle(true))} }
                    .${className}-hide     { display: none !important; }
                    .${className}-hdr-full { display: none; }
                    .${className}-hdr-short{ display: inline; }
                }
            `}</style>
            <div>
                <div className={`${className}-header`}>
                    {headers.map(({ label, mobileLabel, hide }, i) => (
                        <span key={i} className={hide ? `${className}-hide` : ''} style={HDR}>
                            {mobileLabel
                                ? <><span className={`${className}-hdr-full`}>{label}</span><span className={`${className}-hdr-short`}>{mobileLabel}</span></>
                                : label
                            }
                        </span>
                    ))}
                </div>
                {rows}
            </div>
        </>
    );
}

// Converts a plain object of CSS properties to inline CSS string (subset only)
function objToCSS(obj) {
    return Object.entries(obj)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
        .join(' ');
}

// ── Tables ────────────────────────────────────────────────────────────────────

function StudentTable({ students }) {
    // Desktop: rank | name(capped) | consistency | streak | pages | min | halqa | cert
    // Mobile:  rank | name(capped) | % | pages | cert
    const COLS        = '36px minmax(100px, 200px) 76px 56px 60px 56px 70px 88px';
    const COLS_MOBILE = '36px minmax(80px, 130px) 46px 52px 80px';
    const HDRS = [
        { label: 'Rank' },
        { label: 'Student' },
        { label: 'Consistency', mobileLabel: '%' },
        { label: 'Streak',  hide: true },
        { label: 'Pages',   mobileLabel: 'Pgs' },
        { label: 'Min',     hide: true },
        { label: 'Halqa',   hide: true },
        { label: '' },
    ];

    return (
        <LbTable cols={COLS} colsMobile={COLS_MOBILE} headers={HDRS} className="lb-student" rows={
            (students ?? []).map((s) => (
                <div key={s.id} className="lb-student-row" style={{ background: s.rank <= 3 ? 'var(--gold-50)' : 'transparent' }}>
                    <RankBadge rank={s.rank} />
                    <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.student_id}</p>
                    </div>
                    <span style={{ ...NUM, fontWeight: s.rank <= 3 ? 700 : 400 }}>{s.consistency}%</span>
                    <span className="lb-student-hide" style={NUM}>{s.streak}d</span>
                    <span style={NUM}>{s.pages}</span>
                    <span className="lb-student-hide" style={NUM}>{s.minutes}</span>
                    <span className="lb-student-hide" style={{ ...NUM, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.halqa}</span>
                    <a href={`/admin/leaderboard/certificate/${s.id}`} style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                        Cert ↓
                    </a>
                </div>
            ))
        } />
    );
}

function PairTable({ pairs }) {
    // Desktop: rank | A | B | consistency | pages | min | streak
    // Mobile:  rank | A + B stacked | consistency
    const COLS        = '36px minmax(80px,160px) minmax(80px,160px) 76px 60px 56px 56px';
    const COLS_MOBILE = '36px minmax(80px,1fr) 76px';
    const HDRS = [
        { label: 'Rank' },
        { label: 'Student A' },
        { label: 'Student B', hide: true },
        { label: 'Consistency' },
        { label: 'Pages',  hide: true },
        { label: 'Min',    hide: true },
        { label: 'Streak', hide: true },
    ];

    return (
        <LbTable cols={COLS} colsMobile={COLS_MOBILE} headers={HDRS} className="lb-pair" rows={
            (pairs ?? []).map((p) => (
                <div key={p.id} className="lb-pair-row" style={{ background: p.rank <= 3 ? 'var(--gold-50)' : 'transparent' }}>
                    <RankBadge rank={p.rank} />
                    {/* On mobile, stack both names in one cell */}
                    <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.student_a}</p>
                        <p className="lb-pair-hide" style={{ margin: 0, display: 'none' }} />
                        {/* mobile-only second name shown inside first cell via sub-p */}
                        <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="lb-pair-second">{p.student_b}</p>
                    </div>
                    <span className="lb-pair-hide" style={{ ...NUM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.student_b}</span>
                    <span style={{ ...NUM, fontWeight: p.rank <= 3 ? 700 : 400 }}>{p.consistency}%</span>
                    <span className="lb-pair-hide" style={NUM}>{p.pages}</span>
                    <span className="lb-pair-hide" style={NUM}>{p.minutes}</span>
                    <span className="lb-pair-hide" style={NUM}>{p.streak}d</span>
                </div>
            ))
        } />
    );
}

function HalqaTable({ halqas }) {
    // Desktop: rank | name | pairs | consistency | pages | avg streak
    // Mobile:  rank | name | consistency
    const COLS        = '36px minmax(80px,180px) 56px 76px 60px 70px';
    const COLS_MOBILE = '36px minmax(80px,1fr) 76px';
    const HDRS = [
        { label: 'Rank' },
        { label: 'Halqa' },
        { label: 'Pairs',      hide: true },
        { label: 'Consistency' },
        { label: 'Pages',      hide: true },
        { label: 'Avg Streak', hide: true },
    ];

    return (
        <LbTable cols={COLS} colsMobile={COLS_MOBILE} headers={HDRS} className="lb-halqa" rows={
            (halqas ?? []).map((h) => (
                <div key={h.id} className="lb-halqa-row" style={{ background: h.rank <= 3 ? 'var(--gold-50)' : 'transparent' }}>
                    <RankBadge rank={h.rank} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                    <span className="lb-halqa-hide" style={NUM}>{h.pair_count}</span>
                    <span style={{ ...NUM, fontWeight: h.rank <= 3 ? 700 : 400 }}>{h.consistency}%</span>
                    <span className="lb-halqa-hide" style={NUM}>{h.pages}</span>
                    <span className="lb-halqa-hide" style={NUM}>{h.avg_streak}d</span>
                </div>
            ))
        } />
    );
}

function LeaderTable({ leaders }) {
    if (!leaders?.length) return (
        <p style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No leader data yet.</p>
    );

    // Desktop: rank | leader | halqa | meetings | attendance | notes | resolved | recovered | score
    // Mobile:  rank | leader | score
    const COLS        = '36px minmax(80px,180px) 80px 66px 72px 56px 72px 68px 60px';
    const COLS_MOBILE = '36px minmax(80px,1fr) 60px';
    const HDRS = [
        { label: 'Rank' },
        { label: 'Leader' },
        { label: 'Halqa',      hide: true },
        { label: 'Meetings',   hide: true },
        { label: 'Attendance', hide: true },
        { label: 'Notes',      hide: true },
        { label: 'Resolved',   hide: true },
        { label: 'Recovered',  hide: true },
        { label: 'Score' },
    ];

    return (
        <LbTable cols={COLS} colsMobile={COLS_MOBILE} headers={HDRS} className="lb-leader" rows={
            leaders.map((l) => (
                <div key={l.id} className="lb-leader-row" style={{ background: l.rank <= 3 ? 'var(--gold-50)' : 'transparent' }}>
                    <RankBadge rank={l.rank} />
                    <div style={{ minWidth: 0 }}>
                        <Link href={`/admin/leaders/${l.id}`} style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</Link>
                        <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.halqa}</p>
                    </div>
                    <span className="lb-leader-hide" style={{ ...NUM, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{l.halqa}</span>
                    <span className="lb-leader-hide" style={NUM}>{l.meetings}</span>
                    <span className="lb-leader-hide" style={NUM}>{l.avg_attendance}%</span>
                    <span className="lb-leader-hide" style={NUM}>{l.contact_notes}</span>
                    <span className="lb-leader-hide" style={NUM}>{l.resolved_actions}<span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>/{l.total_actions}</span></span>
                    <span className="lb-leader-hide" style={NUM}>{l.recovered}</span>
                    <span style={{ ...NUM, fontWeight: l.rank <= 3 ? 700 : 400 }}>{l.score}</span>
                </div>
            ))
        } />
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Leaderboard({ students, pairs, halqas, leaders, awards, snapshots, is_ended, is_locked }) {
    const [tab, setTab]           = useState('Students');
    const [showLock, setShowLock] = useState(false);

    const aw = awards ?? {};
    const totalPagesAll = (students ?? []).reduce((sum, s) => sum + (s.pages || 0), 0);

    function unlock() {
        if (!confirm('Unlock the leaderboard? This will delete the most recent snapshot.')) return;
        router.post('/admin/leaderboard/unlock', {}, { preserveScroll: true });
    }

    return (
        <AdminLayout title="Leaderboard">
            <Head title="Leaderboard" />

            {/* Fix 10 — program ended banner */}
            {is_ended && (
                <div style={{ marginBottom: '14px', padding: '10px 16px', background: 'oklch(97% 0.04 20)', border: '1px solid oklch(85% 0.1 20)', borderLeft: '4px solid var(--destructive)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-at-risk)' }}>
                        ⚠ The program has ended — lock the leaderboard to finalise awards.
                    </p>
                    <button onClick={() => setShowLock(true)} style={{ padding: '6px 14px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        🔒 Lock Now
                    </button>
                </div>
            )}

            {/* Awards strip */}
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                {/* Title row: Awards left, action buttons right */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>🏆 Awards</h3>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <a href="/admin/leaderboard/pdf" target="_blank" style={{ padding: '6px 12px', border: '1px solid var(--border)', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', textDecoration: 'none', color: 'var(--foreground)' }}>Export PDF</a>
                        {is_locked ? (
                            <button onClick={unlock} style={{ padding: '6px 12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>🔓 Unlock</button>
                        ) : (
                            <button onClick={() => setShowLock(true)} style={{ padding: '6px 12px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>🔒 Lock & Archive</button>
                        )}
                    </div>
                </div>
                {/* Award chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                        { label: 'Total Pages', value: totalPagesAll > 0 ? totalPagesAll.toLocaleString() : null, sub: 'pages recited' },
                        { label: 'Most Consistent', value: aw.most_consistent_students?.[0]?.name },
                        { label: 'Best Pair', value: aw.most_consistent_pair ? `${aw.most_consistent_pair.student_a} & ${aw.most_consistent_pair.student_b}` : null },
                        { label: 'Longest Streak', value: aw.longest_streak?.name, sub: aw.longest_streak ? `${aw.longest_streak.streak}d` : null },
                        { label: 'Most Pages', value: aw.most_pages?.name, sub: aw.most_pages ? `${aw.most_pages.pages}pp` : null },
                        { label: 'Most Improved', value: aw.most_improved_student?.name },
                        { label: 'Best Leader', value: leaders?.[0]?.name, sub: leaders?.[0]?.halqa },
                    ].filter((a) => a.value).map(({ label, value, sub }) => (
                        <div key={label} style={{ padding: '6px 12px', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>{value}{sub && <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: '4px' }}>{sub}</span>}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Past snapshots */}
            {(snapshots ?? []).length > 0 && (
                <div style={{ marginBottom: '14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)' }}>Archived Programs</span>
                        {snapshots.length >= 2 && (
                            <a href="/admin/leaderboard/snapshots/compare" style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                                Compare years →
                            </a>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {snapshots.map((s) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '6px 10px', background: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{s.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.ended_at}</span>
                                    <a href={`/admin/leaderboard/snapshots/${s.id}/pdf`} target="_blank" style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--foreground)', fontWeight: 600 }}>
                                        ↓ PDF
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs: desktop row / mobile select */}
            <div style={{ marginBottom: '12px' }}>
                <div className="tab-row-desktop">
                    {['Students', 'Pairs', 'Halqas', 'Leaders'].map((t) => (
                        <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', background: tab === t ? 'var(--primary)' : 'var(--card)', color: tab === t ? 'var(--primary-foreground)' : 'var(--foreground)', fontWeight: tab === t ? 600 : 400, fontSize: '0.875rem' }}>{t}</button>
                    ))}
                </div>
                <select className="tab-select-mobile" value={tab} onChange={(e) => setTab(e.target.value)}>
                    {['Students', 'Pairs', 'Halqas', 'Leaders'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {tab === 'Students' && <StudentTable students={students} />}
                {tab === 'Pairs'    && <PairTable    pairs={pairs} />}
                {tab === 'Halqas'   && <HalqaTable   halqas={halqas} />}
                {tab === 'Leaders'  && <LeaderTable  leaders={leaders} />}
            </div>

            {showLock && <LockModal onClose={() => setShowLock(false)} />}
        </AdminLayout>
    );
}
