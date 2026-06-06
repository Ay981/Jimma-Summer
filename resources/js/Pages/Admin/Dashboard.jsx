import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import BarChart from '@/Components/UI/BarChart';
import LineChart from '@/Components/UI/LineChart';
import StatusTag from '@/Components/UI/StatusTag';

// ── Pulse meter ───────────────────────────────────────────────────────────────

function PulseMeter({ score }) {
    const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'oklch(70% 0.15 84)' : 'var(--destructive)';
    const cx = 60, cy = 60, r = 48;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * (circ * 0.75);
    const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Fair' : 'Low';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width={120} height={80} viewBox="0 0 120 80">
                <path d={`M ${cx - r},${cy} A ${r},${r} 0 1 1 ${cx + r},${cy}`} fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
                <path d={`M ${cx - r},${cy} A ${r},${r} 0 1 1 ${cx + r},${cy}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight={700} fill={color}>{score}</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">{label}</text>
            </svg>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Daily Pulse</p>
        </div>
    );
}

// ── Program calendar ──────────────────────────────────────────────────────────

function ProgramCalendar({ calendar }) {
    if (!calendar.length) return null;
    const max = Math.max(...calendar.map((c) => c.pct), 1);
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
            {calendar.map((c) => {
                const intensity = c.pct / max;
                const bg = c.pct === 0
                    ? 'var(--muted)'
                    : `oklch(${55 + intensity * 15}% 0.12 ${160 - intensity * 20})`;
                return (
                    <div key={c.date} title={`${c.date}: ${c.pct}% (${c.count} submitted)`} style={{
                        width: '12px', height: '12px', borderRadius: '2px',
                        background: bg, border: c.pct === 0 ? '1px solid var(--border)' : 'none', flexShrink: 0,
                    }} />
                );
            })}
        </div>
    );
}

// ── Sankey (simplified SVG) ───────────────────────────────────────────────────

function SankeyDiagram({ data }) {
    const { nodes = [], links = [] } = data ?? {};
    const halqas   = nodes.filter((n) => n.type === 'halqa');
    const students = nodes.filter((n) => n.type === 'student');
    if (!halqas.length) return <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>No data.</p>;

    const ROW = 20;
    const H = Math.max(180, Math.max(halqas.length, students.length) * ROW);
    const W = 320;  // viewBox width — scales with container
    const halqaX = 8, studentX = 230;

    const halqaY   = (i) => (i + 0.5) * (H / halqas.length);
    const studentY = (i) => (i + 0.5) * (H / students.length);

    const halqaIdx   = Object.fromEntries(halqas.map((h, i) => [h.id, i]));
    const studentIdx = Object.fromEntries(students.map((s, i) => [s.id, i]));

    return (
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {/* width:100% makes it fill the card; viewBox handles coordinate space */}
            <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
                {links.map((l, i) => {
                    const hi = halqaIdx[l.source];
                    const si = studentIdx[l.target];
                    if (hi === undefined || si === undefined) return null;
                    const y1 = halqaY(hi), y2 = studentY(si);
                    const strokeW = Math.max(0.5, Math.min(5, l.value / 20));
                    const alpha   = Math.max(0.1, Math.min(0.7, l.value / 100));
                    return (
                        <path key={i}
                            d={`M ${halqaX + 68},${y1} C ${halqaX + 130},${y1} ${studentX - 60},${y2} ${studentX},${y2}`}
                            fill="none" stroke="var(--success)" strokeWidth={strokeW} opacity={alpha}
                        />
                    );
                })}
                {halqas.map((h, i) => (
                    <g key={h.id} transform={`translate(${halqaX},${halqaY(i) - 8})`}>
                        <rect width={66} height={15} rx={3} fill="var(--secondary)" />
                        <text x={4} y={10} fontSize={8} fill="var(--foreground)">{h.label.slice(0, 10)}</text>
                    </g>
                ))}
                {students.map((s, i) => (
                    <text key={s.id} x={studentX + 3} y={studentY(i) + 3}
                        fontSize={7} fill="var(--muted-foreground)">
                        {s.label.split(' ')[0]}
                    </text>
                ))}
            </svg>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard({
    pulse, todaySubs, activeStudents, totalStudents, statusCounts,
    dropOff, weeklyTrend, hourBars, neverList, retentionCurve,
    earlyWarning, halqaEngagement, sankeyData, calendar, actions, recentSubs,
    program_start,
}) {
    const sc = statusCounts ?? {};

    // Build overlaid line data for drop-off chart (scale 0–100 %)
    const consistencyLine = (weeklyTrend ?? []).length >= dropOff?.length
        ? []
        : [{
            label: 'Consistency %',
            color: 'var(--success)',
            values: (dropOff ?? []).map((_, i) => {
                const idx = Math.floor(i / (dropOff.length / Math.max(1, weeklyTrend?.length ?? 1)));
                return weeklyTrend?.[Math.min(idx, (weeklyTrend?.length ?? 1) - 1)]?.value ?? 0;
            }),
        }];

    const Card = ({ title, children, href }) => (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>{title}</h3>
                {href && <Link href={href} style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>}
            </div>
            {children}
        </div>
    );

    return (
        <AdminLayout title="Dashboard">
            <Head title="Admin Dashboard" />
            <div style={{ maxWidth: '1400px' }}>

            <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Program started {new Date(program_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {/* Top row: pulse + quick stats + actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'start' }} className="top-grid">
                {/* Pulse */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <PulseMeter score={pulse ?? 0} />
                    <div className="pulse-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                        {[
                            { label: 'Submitted today', value: todaySubs, sub: `of ${activeStudents}` },
                            { label: 'On Track',  value: sc.on_track  ?? 0, color: 'var(--success)' },
                            { label: 'Slipping',  value: sc.slipping  ?? 0, color: 'oklch(70% 0.15 84)' },
                            { label: 'At Risk',   value: sc.at_risk   ?? 0, color: 'var(--destructive)' },
                            { label: 'Inactive',  value: sc.inactive  ?? 0, color: 'var(--muted-foreground)' },
                            { label: 'Total',     value: totalStudents },
                        ].map(({ label, value, sub, color }) => (
                            <div key={label}>
                                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: color ?? 'var(--foreground)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</p>
                                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{label}{sub && ` (${sub})`}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Suggested actions */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Suggested Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(actions ?? []).map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                                <span style={{ fontSize: '1rem' }}>{a.icon}</span>
                                <span style={{ flex: 1, fontSize: '0.8125rem' }}>{a.text}</span>
                                {a.href && <Link href={a.href} style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>{a.label}</Link>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Early warning */}
                {(earlyWarning ?? []).length > 0 && (
                    <div style={{ background: 'oklch(97% 0.04 20)', border: '1px solid oklch(85% 0.08 20)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', minWidth: '220px' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '0.8125rem', fontWeight: 700, color: 'oklch(50% 0.1 20)' }}>⚠ Early Warning</h3>
                        {earlyWarning.map((w) => (
                            <div key={w.id} style={{ fontSize: '0.8125rem', padding: '4px 0', borderBottom: '1px solid oklch(88% 0.06 20)' }}>
                                <Link href={`/admin/students/${w.id}`} style={{ fontWeight: 500, color: 'var(--foreground)', textDecoration: 'none' }}>{w.name}</Link>
                                <span style={{ fontSize: '0.75rem', color: 'oklch(50% 0.1 20)', marginLeft: '6px' }}>{w.missed_of_5}/5 days missed</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Charts row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="chart-grid">
                <Card title="Daily Submissions (30 days)">
                    <BarChart data={dropOff ?? []} height={160} barColor="var(--primary)" />
                </Card>
                <Card title="Weekly Consistency Trend">
                    <LineChart
                        series={[{ label: 'Consistency %', color: 'var(--success)', data: (weeklyTrend ?? []).map((w) => w.value) }]}
                        labels={(weeklyTrend ?? []).map((w) => w.label)}
                        height={160} yMax={100} unit="%"
                    />
                </Card>
            </div>

            {/* Charts row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }} className="chart-grid">
                <Card title="Peak Submission Hours">
                    <BarChart data={hourBars ?? []} height={140} barColor="var(--accent)" />
                </Card>
                <Card title="Retention Curve (weekly)">
                    <LineChart
                        series={[{ label: '% Still Active', color: 'oklch(60% 0.15 260)', data: (retentionCurve ?? []).map((r) => r.value), fill: true }]}
                        labels={(retentionCurve ?? []).map((r) => r.label)}
                        height={140} yMax={100} unit="%"
                    />
                </Card>
            </div>

            {/* Row 3: calendar + halqa engagement */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }} className="chart-grid">
                <Card title="Program Calendar — Submission Rate per Day">
                    <ProgramCalendar calendar={calendar ?? []} />
                    <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'oklch(60% 0.12 150)' }} /><span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>High</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--muted)', border: '1px solid var(--border)' }} /><span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>No submissions</span></div>
                    </div>
                </Card>
                <Card title="Halqa Engagement This Week" href="/admin/halqas">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(halqaEngagement ?? []).map((h) => (
                            <div key={h.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '0.8125rem' }}>{h.name}</span>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: h.score >= 70 ? 'var(--success)' : h.score >= 40 ? 'oklch(55% 0.12 84)' : 'var(--destructive)' }}>{h.score}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'var(--muted)', borderRadius: '2px' }}>
                                    <div style={{ height: '100%', width: `${h.score}%`, background: h.score >= 70 ? 'var(--success)' : h.score >= 40 ? 'oklch(70% 0.15 84)' : 'var(--destructive)', borderRadius: '2px', transition: 'width 0.4s' }} />
                                </div>
                            </div>
                        ))}
                        {!(halqaEngagement ?? []).length && <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No halqas yet.</p>}
                    </div>
                </Card>
            </div>

            {/* Row 4: Sankey + never submitted + recent */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }} className="triple-grid">
                <Card title="Halqa → Student Flow (Sankey)">
                    <SankeyDiagram data={sankeyData} />
                </Card>
                <Card title={`Never Submitted (${(neverList ?? []).length})`} href="/admin/students">
                    {(neverList ?? []).length === 0
                        ? <p style={{ color: 'var(--success)', fontSize: '0.875rem', margin: 0 }}>All students have submitted at least once.</p>
                        : (neverList ?? []).slice(0, 10).map((s) => (
                            <div key={s.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                <Link href={`/admin/students/${s.id}`} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)', textDecoration: 'none' }}>{s.name}</Link>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.student_id}</span>
                            </div>
                        ))
                    }
                </Card>
                <Card title="Recent Submissions">
                    {(recentSubs ?? []).map((s, i) => (
                        <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginLeft: '6px' }}>Juz {s.juz} · {s.pages} pp</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{s.time}</span>
                        </div>
                    ))}
                </Card>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .top-grid    { grid-template-columns: 1fr !important; }
                    .chart-grid  { grid-template-columns: 1fr !important; }
                    .triple-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .pulse-stats { grid-template-columns: repeat(3, 1fr) !important; gap: 6px 10px !important; }
                }
                /* Big screens: pin pulse and early-warning columns so the middle
                   doesn't balloon. :has(> div:nth-child(3)) ensures the rule only
                   fires when all three cards are rendered (early-warning present). */
                @media (min-width: 1280px) {
                    .top-grid:has(> div:nth-child(3)) {
                        grid-template-columns: 360px 1fr 240px !important;
                    }
                }
            `}</style>
            </div>
        </AdminLayout>
    );
}
