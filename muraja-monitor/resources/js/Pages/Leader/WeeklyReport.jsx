import { useState } from 'react';
import { Head } from '@inertiajs/react';
import LeaderLayout from '@/Layouts/LeaderLayout';

const SHADOW = { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' };

function SectionLabel({ children }) {
    return <p style={{ margin: '0 0 8px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>{children}</p>;
}

function Delta({ value }) {
    if (value === 0) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
    const color = value > 0 ? 'var(--success)' : 'var(--destructive)';
    return <span style={{ color, fontWeight: 700 }}>{value > 0 ? '+' : ''}{value}</span>;
}

export default function WeeklyReport({
    halqa_name, week_start, week_end, total_members, submitted_count,
    student_rows, nudge_list, pair_rows, pdf_url,
}) {
    const [pdfLoading, setPdfLoading] = useState(false);
    const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const handlePdfClick = (e) => {
        setPdfLoading(true);
        setTimeout(() => setPdfLoading(false), 3000);
    };

    return (
        <LeaderLayout title="Weekly Report">
            <Head title="Weekly Report" />

            {/* Header */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Weekly Report — {halqa_name}</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {fmt(week_start)} – {fmt(week_end)}
                    </p>
                </div>
                <a href={pdf_url} target="_blank" onClick={handlePdfClick} style={{
                    padding: '7px 16px', background: 'var(--primary)', color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                    opacity: pdfLoading ? 0.7 : 1, pointerEvents: pdfLoading ? 'none' : 'auto',
                }}>
                    {pdfLoading ? 'Generating…' : '↓ Download PDF'}
                </a>
            </div>

            {/* Summary pills */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                    { label: 'Total Members', value: total_members, borderColor: 'var(--foreground)' },
                    { label: 'Submitted This Week', value: submitted_count, borderColor: submitted_count === total_members ? 'var(--success)' : 'var(--foreground)' },
                    { label: 'Missed (no excuse)', value: nudge_list.length, borderColor: nudge_list.length > 0 ? 'var(--destructive)' : 'var(--success)' },
                ].map(({ label, value, borderColor }) => (
                    <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: `3px solid ${borderColor}`, borderRadius: 'var(--radius-lg)', padding: '12px 18px', ...SHADOW }}>
                        <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>{label}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 700, color: borderColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Nudge list */}
            {nudge_list.length > 0 && (
                <div style={{ background: 'oklch(97% 0.03 30)', border: '1px solid var(--status-at-risk-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '16px', ...SHADOW }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--status-at-risk-border)' }}>
                        <SectionLabel>Students to Contact This Week ({nudge_list.length})</SectionLabel>
                    </div>
                    <div>
                        {nudge_list.map((s) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid var(--border)', gap: '8px' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600 }}>{s.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Last week: {s.last_week} · Streak: {s.streak}d</p>
                                </div>
                                <Delta value={s.delta} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Student table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '16px', ...SHADOW }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <SectionLabel>All Students</SectionLabel>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--muted)' }}>
                                {['Name', 'This Week', 'Last Week', 'Δ', 'Pages', 'Streak', 'Excuse / Makeup'].map(h => (
                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {student_rows.map((s, i) => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: s.this_week === 0 && !s.has_excuse ? 'oklch(98.5% 0.01 20)' : i % 2 === 0 ? 'transparent' : 'var(--muted)' }}>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</td>
                                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', color: s.this_week === 0 ? 'var(--destructive)' : 'var(--foreground)', fontWeight: s.this_week === 0 ? 700 : 400 }}>{s.this_week}</td>
                                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', color: 'var(--muted-foreground)' }}>{s.last_week}</td>
                                    <td style={{ padding: '8px 12px' }}><Delta value={s.delta} /></td>
                                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{s.pages.toLocaleString()}</td>
                                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{s.streak}d</td>
                                    <td style={{ padding: '8px 12px' }}>
                                        {s.has_excuse ? (
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--status-slipping-bg)', color: 'var(--status-slipping)', borderRadius: '99px', fontWeight: 600 }}>
                                                Makeup {new Date(s.makeup_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                            </span>
                                        ) : s.this_week === 0 ? (
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--status-at-risk-bg)', color: 'var(--status-at-risk)', borderRadius: '99px', fontWeight: 600 }}>Needs nudge</span>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pair activity */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...SHADOW }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <SectionLabel>Pair Activity This Week</SectionLabel>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--muted)' }}>
                                {['Student A', 'Student B', 'A Submitted', 'B Submitted', 'Joint Days'].map(h => (
                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pair_rows.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: p.zero_joint ? 'oklch(98.5% 0.02 50)' : i % 2 === 0 ? 'transparent' : 'var(--muted)' }}>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem', fontWeight: 500 }}>{p.student_a}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '0.875rem' }}>{p.student_b}</td>
                                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{p.a_submitted}</td>
                                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{p.b_submitted ?? '—'}</td>
                                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', color: p.zero_joint ? 'var(--destructive)' : 'var(--foreground)', fontWeight: p.zero_joint ? 700 : 400 }}>
                                        {p.joint_days}{p.zero_joint ? ' ⚠' : ''}
                                    </td>
                                </tr>
                            ))}
                            {pair_rows.length === 0 && <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No pairs in this halqa yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </LeaderLayout>
    );
}
