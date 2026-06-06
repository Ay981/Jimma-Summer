import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Heatmap from '@/Components/UI/Heatmap';

// ── Mini bar chart (submissions per week) ─────────────────────────────────────

function WeeklyBars({ data, color }) {
    if (!data?.length) return null;
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div style={{
                        width: '100%', background: color,
                        borderRadius: '2px 2px 0 0',
                        height: `${(d.value / max) * 48}px`,
                        minHeight: d.value > 0 ? '3px' : '0',
                        transition: 'height 0.3s',
                    }} />
                    <span style={{ fontSize: '0.5rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                        {d.label.split(' ')[0]}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────

function StatCell({ label, valueA, valueB, unit = '', higher = 'good' }) {
    const a = parseFloat(valueA) || 0;
    const b = parseFloat(valueB) || 0;
    const aWins = higher === 'good' ? a >= b : a <= b;
    const tie   = a === b;

    const highlight = (wins) => wins && !tie
        ? { color: 'var(--success)', fontWeight: 700 }
        : { color: 'var(--foreground)', fontWeight: 400 };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', textAlign: 'right', ...highlight(aWins) }}>
                {valueA}{unit}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', textAlign: 'center', minWidth: '110px' }}>
                {label}
            </span>
            <span style={{ fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', textAlign: 'left', ...highlight(!aWins) }}>
                {valueB}{unit}
            </span>
        </div>
    );
}

const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const MEMO_LABELS = { less_than_1: '<1 juz', '1_5': '1–5 juz', '6_10': '6–10 juz', '11_20': '11–20 juz', '21_29': '21–29 juz', full_hifz: 'Full Hifz' };

const COLORS = ['var(--primary)', 'oklch(60% 0.18 20)'];

export default function StudentCompare({ students, all_students, selected_ids }) {
    const [selA, setSelA] = useState(selected_ids?.[0] ?? '');
    const [selB, setSelB] = useState(selected_ids?.[1] ?? '');

    function runCompare() {
        if (!selA || !selB || selA === selB) return;
        router.get('/admin/students/compare', { a: selA, b: selB }, { preserveState: false });
    }

    const [a, b] = students ?? [];
    const sel = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem', minWidth: '200px' };

    return (
        <AdminLayout title="Compare Students">
            <Head title="Compare Students" />

            {/* ── Selector ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '24px', padding: '16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Student A</p>
                    <select value={selA} onChange={(e) => setSelA(e.target.value)} style={sel}>
                        <option value="">Select student…</option>
                        {all_students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.student_id}</option>)}
                    </select>
                </div>
                <span style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', paddingBottom: '4px' }}>vs</span>
                <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Student B</p>
                    <select value={selB} onChange={(e) => setSelB(e.target.value)} style={sel}>
                        <option value="">Select student…</option>
                        {all_students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.student_id}</option>)}
                    </select>
                </div>
                <button
                    onClick={runCompare}
                    disabled={!selA || !selB || selA === selB}
                    style={{ padding: '8px 20px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', opacity: (!selA || !selB || selA === selB) ? 0.5 : 1 }}
                >
                    Compare →
                </button>
            </div>

            {/* No selection yet */}
            {(!a || !b) && (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                    Select two students above to see their comparison.
                </div>
            )}

            {a && b && (
                <>
                    {/* ── Header names ─────────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', marginBottom: '16px' }}>
                        {[a, b].map((s, i) => (
                            <div key={s.id} style={{
                                background: 'var(--card)', border: `2px solid ${COLORS[i]}`,
                                borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                                gridColumn: i === 0 ? '1' : '3',
                            }}>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: COLORS[i] }}>{s.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.student_id} · {s.halqa}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{MEMO_LABELS[s.memo_level] ?? s.memo_level}</p>
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.5rem', color: 'var(--muted-foreground)' }}>vs</span>
                        </div>
                    </div>

                    {/* ── Head-to-head stats ───────────────────────────────────── */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                            Head-to-Head · green = better
                        </p>
                        <StatCell label="Consistency"         valueA={a.consistency} valueB={b.consistency} unit="%" />
                        <StatCell label="Current Streak"      valueA={a.streak}       valueB={b.streak}      unit="d" />
                        <StatCell label="Longest Streak"      valueA={a.longest_streak} valueB={b.longest_streak} unit="d" />
                        <StatCell label="Total Submissions"   valueA={a.submissions}  valueB={b.submissions} />
                        <StatCell label="Total Pages"         valueA={a.pages}        valueB={b.pages}       unit=" pp" />
                        <StatCell label="Total Minutes"       valueA={a.minutes}      valueB={b.minutes}     unit=" min" />
                    </div>

                    {/* ── Available days ───────────────────────────────────────── */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                            Available Days
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[a, b].map((s, i) => (
                                <div key={s.id}>
                                    <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', fontWeight: 600, color: COLORS[i] }}>{s.name}</p>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((d) => {
                                            const active = (s.available_days ?? []).includes(d);
                                            return (
                                                <span key={d} style={{
                                                    fontSize: '0.75rem', padding: '3px 7px', borderRadius: 'var(--radius-sm)',
                                                    background: active ? COLORS[i] + '22' : 'var(--muted)',
                                                    color: active ? COLORS[i] : 'var(--muted-foreground)',
                                                    fontWeight: active ? 700 : 400,
                                                }}>
                                                    {DAY_LABELS[d]}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Weekly submission chart ──────────────────────────────── */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                            Submissions per Week (last 8 weeks)
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[a, b].map((s, i) => (
                                <div key={s.id}>
                                    <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', fontWeight: 600, color: COLORS[i] }}>{s.name}</p>
                                    <WeeklyBars data={s.weekly} color={COLORS[i]} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Heatmaps ─────────────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[a, b].map((s, i) => (
                            <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                                <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 600, color: COLORS[i] }}>
                                    {s.name} — 30-day activity
                                </p>
                                <Heatmap data={s.heatmap} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
