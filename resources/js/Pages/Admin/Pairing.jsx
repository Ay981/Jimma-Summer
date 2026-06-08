import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const SLOT_LABELS = { after_subhi:'Fajr', after_zuhr:'Dhuhr', after_asr:'Asr', after_maghrib:'Maghrib', after_isha:'Isha' };
const DAY_LABELS  = { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' };
const MEMO_LABELS = { less_than_1:'< 1 Juz', '1_5':'1–5 Juz', '6_10':'6–10 Juz', '11_20':'11–20 Juz', '21_29':'21–29 Juz', full_hifz:'Full Hifz' };

const TYPE_COLOR = {
    mutual:    { bg: 'oklch(95% 0.06 150)', color: 'oklch(35% 0.12 150)', label: '✓ Mutual' },
    one_sided: { bg: 'oklch(96% 0.05 84)',  color: 'oklch(45% 0.12 84)',  label: '→ One-sided' },
    conflict:  { bg: 'oklch(96% 0.05 20)',  color: 'var(--destructive)',   label: '✗ Conflict' },
};

export default function Pairing({ window_open, window_deadline, requests, stats, incompatibles, flagged }) {
    const [running, setRunning] = useState(false);
    const { data, setData, post, processing } = useForm({
        open:     window_open,
        deadline: window_deadline ?? '',
    });

    function saveWindow(open) {
        setData('open', open);
        router.post('/admin/pairing/window', { open, deadline: data.deadline }, { preserveScroll: true });
    }

    function runPairing() {
        if (!confirm('Run global pairing now?\n\nThis will create pairs for all students based on their requests and time slot overlap. This cannot be undone automatically.')) return;
        setRunning(true);
        router.post('/admin/pairing/run', {}, { onFinish: () => setRunning(false) });
    }

    const mutual   = (requests ?? []).filter(r => r.type === 'mutual');
    const oneSided = (requests ?? []).filter(r => r.type === 'one_sided');
    const conflict = (requests ?? []).filter(r => r.type === 'conflict');

    return (
        <AdminLayout title="Pairing">
            <Head title="Pairing" />

            {/* Stats bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {[
                    { label: 'Total Students',  value: stats.total_students },
                    { label: 'Submitted Request', value: stats.requested, color: 'var(--primary)' },
                    { label: 'No Request',       value: stats.no_request, color: 'var(--muted-foreground)' },
                    { label: 'Mutual Pairs',     value: Math.floor(stats.mutual), color: 'oklch(40% 0.12 150)' },
                    { label: 'One-sided',        value: stats.one_sided, color: 'oklch(45% 0.12 84)' },
                    { label: 'Conflicts',        value: stats.conflict, color: 'var(--destructive)' },
                    { label: 'Pairs Created',    value: stats.existing_pairs, color: stats.existing_pairs > 0 ? 'var(--success)' : 'var(--muted-foreground)' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', minWidth: '110px', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: color ?? 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                        <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Already-paired banner */}
            {stats.existing_pairs > 0 && (
                <div style={{
                    marginBottom: '16px', padding: '12px 16px',
                    background: 'oklch(96% 0.05 150)', border: '1px solid oklch(82% 0.1 150)',
                    borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <span style={{ fontSize: '1rem' }}>✓</span>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'oklch(35% 0.12 150)' }}>
                            {stats.existing_pairs} pair{stats.existing_pairs !== 1 ? 's' : ''} already created
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'oklch(45% 0.1 150)' }}>
                            Running pairing again will only pair students not yet assigned to a pair.
                        </p>
                    </div>
                </div>
            )}

            {/* Window control */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 700 }}>Pairing Request Window</p>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {window_open
                            ? `Open${window_deadline ? ` · closes ${window_deadline}` : ''}`
                            : 'Closed — students cannot submit requests'}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        value={data.deadline}
                        onChange={e => setData('deadline', e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }}
                    />
                    {window_open
                        ? <button onClick={() => saveWindow(false)} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Close Window</button>
                        : <button onClick={() => saveWindow(true)}  style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--success)', color: 'var(--success-foreground)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Open Window</button>
                    }
                </div>
                <button
                    onClick={runPairing}
                    disabled={running}
                    style={{
                        padding: '7px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
                        background: 'var(--primary)', color: 'var(--primary-foreground)',
                        fontWeight: 700, fontSize: '0.875rem',
                        cursor: running ? 'not-allowed' : 'pointer',
                        opacity: running ? 0.7 : 1,
                    }}
                >
                    {running ? 'Running…' : '⚡ Run Pairing'}
                </button>
            </div>

            {/* Incompatibles warning */}
            {(incompatibles ?? []).length > 0 && (
                <div style={{
                    marginBottom: '16px', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    border: '1px solid oklch(82% 0.1 30)', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
                }}>
                    <div style={{
                        background: 'oklch(96% 0.05 30)', padding: '12px 16px',
                        borderBottom: '1px solid oklch(82% 0.1 30)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1rem' }}>⚠</span>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'oklch(35% 0.12 30)' }}>
                                    {incompatibles.length} student{incompatibles.length !== 1 ? 's' : ''} could not be paired — incompatible schedules
                                </p>
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'oklch(45% 0.1 30)' }}>
                                    Ask them to discuss and update their available days / times, then re-run pairing.
                                </p>
                            </div>
                        </div>
                        <a
                            href="/admin/pairing/incompatible-pdf"
                            target="_blank"
                            style={{
                                padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
                                background: 'oklch(45% 0.12 30)', color: '#fff',
                                fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none', whiteSpace: 'nowrap',
                            }}
                        >
                            Download Notice PDF
                        </a>
                    </div>
                    <div style={{ background: 'var(--card)' }}>
                        {incompatibles.map((s, i) => (
                            <div key={s.id ?? i} style={{
                                display: 'grid', gridTemplateColumns: '1fr 80px 80px 1fr 1fr',
                                gap: '10px', padding: '10px 16px',
                                borderBottom: i < incompatibles.length - 1 ? '1px solid var(--border)' : 'none',
                                alignItems: 'center',
                            }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.student_id}</p>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                    {MEMO_LABELS[s.memo_level] ?? '—'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                    Juz {s.current_juz ?? '—'}
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                    {(s.available_days ?? []).map(d => (
                                        <span key={d} style={{ fontSize: '0.6875rem', padding: '1px 5px', background: 'var(--secondary)', borderRadius: '3px' }}>
                                            {DAY_LABELS[d] ?? d}
                                        </span>
                                    ))}
                                    {!(s.available_days ?? []).length && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>—</span>}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                    {(s.available_times ?? []).map(t => (
                                        <span key={t} style={{ fontSize: '0.6875rem', padding: '1px 5px', background: 'var(--secondary)', borderRadius: '3px' }}>
                                            {SLOT_LABELS[t] ?? t}
                                        </span>
                                    ))}
                                    {!(s.available_times ?? []).length && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>—</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Flagged (low-score) pairs */}
            {(flagged ?? []).length > 0 && (
                <div style={{
                    marginBottom: '16px', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    border: '1px solid oklch(82% 0.1 50)', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
                }}>
                    <div style={{ background: 'oklch(96% 0.04 50)', padding: '10px 16px', borderBottom: '1px solid oklch(82% 0.1 50)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.875rem' }}>🔶</span>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'oklch(38% 0.12 50)' }}>
                            {flagged.length} pair{flagged.length !== 1 ? 's' : ''} flagged for review — low compatibility score
                        </p>
                    </div>
                    <div style={{ background: 'var(--card)' }}>
                        {flagged.map((p, i) => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '9px 16px', gap: '12px',
                                borderBottom: i < flagged.length - 1 ? '1px solid var(--border)' : 'none',
                            }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    {p.student_a.name} <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>×</span> {p.student_b.name}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px',
                                    background: 'oklch(88% 0.08 50)', color: 'oklch(38% 0.12 50)',
                                    borderRadius: '99px', whiteSpace: 'nowrap',
                                }}>
                                    score {p.compatibility_score}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {Object.entries(TYPE_COLOR).map(([key, cfg]) => (
                    <span key={key} style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 'var(--radius-sm)', background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                ))}
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', alignSelf: 'center' }}>— {requests?.length ?? 0} total requests</span>
            </div>

            {/* Requests table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 140px', gap: '10px', padding: '7px 14px', borderBottom: '1px solid var(--border)' }}>
                    {['Student', 'Requested Partner', 'Status', 'Submitted'].map(h => (
                        <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                    ))}
                </div>

                {(requests ?? []).length === 0
                    ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No requests yet. Open the pairing window so students can submit.</p>
                    : [...mutual, ...oneSided, ...conflict].map((r, i) => {
                        const cfg = TYPE_COLOR[r.type];
                        return (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 140px', gap: '10px', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'oklch(99% 0 0 / 0.4)' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{r.student_name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.student_code}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{r.partner_name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.partner_code}</p>
                                </div>
                                <span style={{ alignSelf: 'center', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: cfg.bg, color: cfg.color }}>
                                    {cfg.label}
                                </span>
                                <span style={{ alignSelf: 'center', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                            </div>
                        );
                    })
                }
            </div>
        </AdminLayout>
    );
}
