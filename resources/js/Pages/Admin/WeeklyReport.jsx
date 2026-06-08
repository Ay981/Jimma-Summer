import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const SHADOW = { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' };

function StatCard({ label, value, sub, color }) {
    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', ...SHADOW }}>
            <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>{label}</p>
            <p style={{ margin: '4px 0 2px', fontSize: '1.75rem', fontWeight: 700, color: color ?? 'var(--foreground)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
            {sub && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{sub}</p>}
        </div>
    );
}

function Delta({ value }) {
    if (value === 0) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
    const color = value > 0 ? 'var(--success)' : 'var(--destructive)';
    return <span style={{ color, fontWeight: 700 }}>{value > 0 ? '+' : ''}{value}</span>;
}

function SectionLabel({ children }) {
    return <p style={{ margin: '0 0 8px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>{children}</p>;
}

export default function WeeklyReport({
    week_start, week_end, this_week_total, last_week_total, delta,
    total_students, zero_this_week, improved, halqa_rows, zero_pairs,
    student_rows, pdf_url,
}) {
    const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <AdminLayout title="Weekly Report">
            <Head title="Weekly Report" />

            {/* Header */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Weekly Report</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {fmt(week_start)} – {fmt(week_end)}
                    </p>
                </div>
                <a href={pdf_url} target="_blank" style={{
                    padding: '7px 16px', background: 'var(--primary)', color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                }}>
                    ↓ Download PDF
                </a>
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <StatCard label="Submissions This Week" value={this_week_total} sub={`vs ${last_week_total} last week`} />
                <StatCard label="Week-on-Week Delta" value={delta > 0 ? `+${delta}` : delta}
                    color={delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--destructive)' : 'var(--muted-foreground)'} />
                <StatCard label="Students with Zero" value={zero_this_week.length}
                    color={zero_this_week.length > 0 ? 'var(--destructive)' : 'var(--success)'}
                    sub="no submissions this week" />
                <StatCard label="Zero-Pair Days" value={zero_pairs.length}
                    color={zero_pairs.length > 0 ? 'oklch(55% 0.15 50)' : 'var(--success)'}
                    sub="pairs with no joint subs" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="two-col">

                {/* Halqa breakdown */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...SHADOW }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                        <SectionLabel>Halqa Consistency This Week</SectionLabel>
                    </div>
                    <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {halqa_rows.map((h) => {
                            const color = h.consistency >= 70 ? 'var(--success)' : h.consistency >= 40 ? 'oklch(55% 0.15 84)' : 'var(--destructive)';
                            return (
                                <div key={h.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{h.name}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <Delta value={h.delta} />
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color }}>{h.consistency}%</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '5px', background: 'var(--muted)', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${h.consistency}%`, background: color, borderRadius: '99px', transition: 'width 0.4s' }} />
                                    </div>
                                </div>
                            );
                        })}
                        {halqa_rows.length === 0 && <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>No halqas yet.</p>}
                    </div>
                </div>

                {/* Most improved */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...SHADOW }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                        <SectionLabel>Most Improved This Week</SectionLabel>
                    </div>
                    <div style={{ padding: '0' }}>
                        {improved.length === 0 ? (
                            <p style={{ padding: '20px 14px', margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>No improvement data yet.</p>
                        ) : improved.map((s, i) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid var(--border)', gap: '8px' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</span>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.last_week} → {s.this_week}</span>
                                    <Delta value={s.delta} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zero submissions */}
            {zero_this_week.length > 0 && (
                <div style={{ background: 'var(--card)', border: '1px solid oklch(82% 0.1 30)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '16px', ...SHADOW }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid oklch(82% 0.1 30)', background: 'oklch(97% 0.03 30)' }}>
                        <SectionLabel>⚠ No Submissions This Week ({zero_this_week.length})</SectionLabel>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0' }}>
                        {zero_this_week.map((s) => (
                            <div key={s.id} style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500 }}>{s.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.halqa}</p>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>streak: {s.streak}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Zero pairs */}
            {zero_pairs.length > 0 && (
                <div style={{ background: 'var(--card)', border: '1px solid oklch(82% 0.1 50)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '16px', ...SHADOW }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid oklch(82% 0.1 50)', background: 'oklch(97% 0.03 50)' }}>
                        <SectionLabel>🔶 Pairs with Zero Joint Submissions ({zero_pairs.length})</SectionLabel>
                    </div>
                    <div>
                        {zero_pairs.map((p, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                                <span>{p.student_a} <span style={{ color: 'var(--muted-foreground)' }}>×</span> {p.student_b}</span>
                                <span style={{ color: 'var(--muted-foreground)' }}>{p.halqa}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Full student table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...SHADOW }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <SectionLabel>All Students — This Week</SectionLabel>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--muted)' }}>
                                {['Name', 'Halqa', 'This Week', 'Last Week', 'Δ', 'Pages', 'Streak'].map(h => (
                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {student_rows.map((s, i) => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: s.this_week === 0 ? 'oklch(98.5% 0.01 20)' : i % 2 === 0 ? 'transparent' : 'var(--muted)' }}>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.halqa}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', color: s.this_week === 0 ? 'var(--destructive)' : 'var(--foreground)', fontWeight: s.this_week === 0 ? 700 : 400 }}>{s.this_week}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>{s.last_week}</td>
                                    <td style={{ padding: '8px 12px' }}><Delta value={s.delta} /></td>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>{s.pages.toLocaleString()}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>{s.streak}d</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`@media(max-width:768px){.two-col{grid-template-columns:1fr !important;}}`}</style>
        </AdminLayout>
    );
}
