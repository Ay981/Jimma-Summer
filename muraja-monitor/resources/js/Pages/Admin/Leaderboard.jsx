import { Head, router, useForm } from '@inertiajs/react';
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

function LockModal({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({ program_name: '' });
    function submit(e) { e.preventDefault(); post('/admin/leaderboard/lock', { onSuccess: onClose }); }
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '380px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>Lock & Archive Leaderboard</h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>This saves a permanent snapshot of the current rankings. Enter the program name for the archive.</p>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input value={data.program_name} onChange={(e) => setData('program_name', e.target.value)} placeholder="e.g. Summer 1446H" style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                    {errors.program_name && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', margin: 0 }}>{errors.program_name}</p>}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '7px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Lock</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StudentTable({ students }) {
    return (
        <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 60px 60px 60px 60px 60px auto', gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                {['Rank', 'Student', 'Consistency', 'Streak', 'Pages', 'Min', 'Badges', 'Halqa', ''].map((h) => (
                    <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</span>
                ))}
            </div>
            {(students ?? []).map((s) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 60px 60px 60px 60px 60px auto', gap: '8px', padding: '9px 12px', borderBottom: '1px solid var(--border)', background: s.rank <= 3 ? 'oklch(98% 0.02 84)' : 'transparent' }}>
                    <RankBadge rank={s.rank} />
                    <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.student_id}</p>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center', fontWeight: s.rank <= 3 ? 700 : 400 }}>{s.consistency}%</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{s.streak}d</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{s.pages}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{s.minutes}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{s.badges}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', alignSelf: 'center' }}>{s.halqa}</span>
                    <a href={`/admin/leaderboard/certificate/${s.id}`} style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'var(--secondary)', color: 'var(--secondary-foreground)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                        Certificate ↓
                    </a>
                </div>
            ))}
        </div>
    );
}

function PairTable({ pairs }) {
    return (
        <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 60px 60px 60px', gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                {['Rank', 'Student A', 'Student B', 'Consistency', 'Pages', 'Min', 'Streak'].map((h) => (
                    <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</span>
                ))}
            </div>
            {(pairs ?? []).map((p) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 60px 60px 60px', gap: '8px', padding: '9px 12px', borderBottom: '1px solid var(--border)', background: p.rank <= 3 ? 'oklch(98% 0.02 84)' : 'transparent' }}>
                    <RankBadge rank={p.rank} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, alignSelf: 'center' }}>{p.student_a}</span>
                    <span style={{ fontSize: '0.875rem', alignSelf: 'center' }}>{p.student_b}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center', fontWeight: p.rank <= 3 ? 700 : 400 }}>{p.consistency}%</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{p.pages}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{p.minutes}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{p.streak}d</span>
                </div>
            ))}
        </div>
    );
}

function HalqaTable({ halqas }) {
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 60px 80px 60px 60px', gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                {['Rank', 'Halqa', 'Pairs', 'Consistency', 'Pages', 'Avg Streak'].map((h) => (
                    <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</span>
                ))}
            </div>
            {(halqas ?? []).map((h) => (
                <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 60px 80px 60px 60px', gap: '8px', padding: '9px 12px', borderBottom: '1px solid var(--border)', background: h.rank <= 3 ? 'oklch(98% 0.02 84)' : 'transparent' }}>
                    <RankBadge rank={h.rank} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, alignSelf: 'center' }}>{h.name}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{h.pair_count}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center', fontWeight: h.rank <= 3 ? 700 : 400 }}>{h.consistency}%</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{h.pages}</span>
                    <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', alignSelf: 'center' }}>{h.avg_streak}d</span>
                </div>
            ))}
        </div>
    );
}

export default function Leaderboard({ students, pairs, halqas, awards, snapshots }) {
    const [tab, setTab]  = useState('Students');
    const [showLock, setShowLock] = useState(false);

    const aw = awards ?? {};

    return (
        <AdminLayout title="Leaderboard">
            <Head title="Leaderboard" />

            {/* Awards strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ margin: '0 12px 0 0', fontSize: '0.875rem', fontWeight: 700, alignSelf: 'center' }}>🏆 Awards</h3>
                {[
                    { label: 'Most Consistent', value: aw.most_consistent_students?.[0]?.name },
                    { label: 'Best Pair', value: aw.most_consistent_pair ? `${aw.most_consistent_pair.student_a} & ${aw.most_consistent_pair.student_b}` : null },
                    { label: 'Longest Streak', value: aw.longest_streak?.name, sub: aw.longest_streak ? `${aw.longest_streak.streak}d` : null },
                    { label: 'Most Pages', value: aw.most_pages?.name, sub: aw.most_pages ? `${aw.most_pages.pages}pp` : null },
                    { label: 'Most Improved', value: aw.most_improved_student?.name },
                ].filter((a) => a.value).map(({ label, value, sub }) => (
                    <div key={label} style={{ padding: '6px 12px', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                        <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>{value}{sub && <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: '4px' }}>{sub}</span>}</p>
                    </div>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <a href="/admin/leaderboard/pdf" target="_blank" style={{ padding: '6px 12px', border: '1px solid var(--border)', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', textDecoration: 'none', color: 'var(--foreground)' }}>Export PDF</a>
                    <button onClick={() => setShowLock(true)} style={{ padding: '6px 12px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>🔒 Lock & Archive</button>
                </div>
            </div>

            {/* Past snapshots */}
            {(snapshots ?? []).length > 0 && (
                <div style={{ marginBottom: '14px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Past archives:</span>
                    {snapshots.map((s) => (
                        <span key={s.id} style={{ fontSize: '0.8125rem', padding: '3px 8px', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--secondary-foreground)' }}>{s.name} · {s.ended_at}</span>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {['Students', 'Pairs', 'Halqas'].map((t) => (
                    <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', background: tab === t ? 'var(--primary)' : 'var(--card)', color: tab === t ? 'var(--primary-foreground)' : 'var(--foreground)', fontWeight: tab === t ? 600 : 400, fontSize: '0.875rem' }}>{t}</button>
                ))}
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {tab === 'Students' && <StudentTable students={students} />}
                {tab === 'Pairs'    && <PairTable pairs={pairs} />}
                {tab === 'Halqas'   && <HalqaTable halqas={halqas} />}
            </div>

            {showLock && <LockModal onClose={() => setShowLock(false)} />}
        </AdminLayout>
    );
}
