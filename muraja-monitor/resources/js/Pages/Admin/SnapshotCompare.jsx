import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function Delta({ value, unit = '' }) {
    if (value === null || value === undefined) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
    const positive = value > 0;
    const zero     = value === 0;
    return (
        <span style={{
            fontWeight: 600, fontSize: '0.8125rem',
            color: zero ? 'var(--muted-foreground)' : positive ? 'var(--success)' : 'var(--destructive)',
        }}>
            {positive ? '+' : ''}{value}{unit}
        </span>
    );
}

export default function SnapshotCompare({ snapshots, snap_a, snap_b, comparison }) {
    function pick(side, id) {
        const params = new URLSearchParams(window.location.search);
        params.set(side, id);
        router.get('/admin/leaderboard/snapshots/compare?' + params.toString());
    }

    const sel = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' };
    const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' };

    return (
        <AdminLayout title="Compare Programs">
            <Head title="Compare Programs" />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Program A</span>
                    <select value={snap_a?.id ?? ''} onChange={e => pick('a', e.target.value)} style={sel}>
                        <option value="">— Select —</option>
                        {snapshots.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ended_at})</option>)}
                    </select>
                </div>
                <span style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)' }}>vs</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Program B</span>
                    <select value={snap_b?.id ?? ''} onChange={e => pick('b', e.target.value)} style={sel}>
                        <option value="">— Select —</option>
                        {snapshots.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ended_at})</option>)}
                    </select>
                </div>
                {snap_a && (
                    <a href={`/admin/leaderboard/snapshots/${snap_a.id}/pdf`} target="_blank" style={{ marginLeft: 'auto', padding: '6px 14px', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', color: 'var(--foreground)' }}>
                        ↓ PDF A
                    </a>
                )}
                {snap_b && (
                    <a href={`/admin/leaderboard/snapshots/${snap_b.id}/pdf`} target="_blank" style={{ padding: '6px 14px', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', color: 'var(--foreground)' }}>
                        ↓ PDF B
                    </a>
                )}
            </div>

            {!comparison && (
                <div style={{ ...card, textAlign: 'center', color: 'var(--muted-foreground)', padding: '60px' }}>
                    Select two programs above to compare them.
                </div>
            )}

            {comparison && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Summary stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {[
                            { label: 'Students', a: comparison.total_students_a, b: comparison.total_students_b },
                            { label: 'Avg Consistency', a: comparison.avg_consistency_a + '%', b: comparison.avg_consistency_b + '%', delta: round(comparison.avg_consistency_b - comparison.avg_consistency_a, 1), unit: '%' },
                            { label: 'Avg Pages / Student', a: comparison.avg_pages_a, b: comparison.avg_pages_b, delta: comparison.avg_pages_b - comparison.avg_pages_a },
                            { label: 'Returning Students', a: '—', b: comparison.returning_students },
                        ].map(({ label, a, b, delta, unit }) => (
                            <div key={label} style={card}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>{label}</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{a}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>→</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{b}</span>
                                    {delta !== undefined && <Delta value={delta} unit={unit ?? ''} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Returning students comparison table */}
                    {comparison.students.length > 0 && (
                        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700 }}>
                                    Returning Students — {snap_a?.name} vs {snap_b?.name}
                                </p>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{comparison.returning_students} students</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--muted)' }}>
                                            {['Name', 'ID', 'Consistency A', 'Consistency B', 'Δ Consistency', 'Pages A', 'Pages B', 'Δ Pages'].map(h => (
                                                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparison.students.map((s, i) => (
                                            <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--muted)' }}>
                                                <td style={{ padding: '7px 10px', fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</td>
                                                <td style={{ padding: '7px 10px', fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{s.student_id}</td>
                                                <td style={{ padding: '7px 10px', fontSize: '0.875rem' }}>{s.consistency_a}%</td>
                                                <td style={{ padding: '7px 10px', fontSize: '0.875rem' }}>{s.consistency_b}%</td>
                                                <td style={{ padding: '7px 10px' }}><Delta value={s.consistency_delta} unit="%" /></td>
                                                <td style={{ padding: '7px 10px', fontSize: '0.875rem' }}>{s.pages_a.toLocaleString()}</td>
                                                <td style={{ padding: '7px 10px', fontSize: '0.875rem' }}>{s.pages_b.toLocaleString()}</td>
                                                <td style={{ padding: '7px 10px' }}><Delta value={s.pages_delta} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}

function round(v, d) { return Math.round(v * Math.pow(10, d)) / Math.pow(10, d); }
