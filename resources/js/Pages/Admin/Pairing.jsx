import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const TYPE_COLOR = {
    mutual:    { bg: 'oklch(95% 0.06 150)', color: 'oklch(35% 0.12 150)', label: '✓ Mutual' },
    one_sided: { bg: 'oklch(96% 0.05 84)',  color: 'oklch(45% 0.12 84)',  label: '→ One-sided' },
    conflict:  { bg: 'oklch(96% 0.05 20)',  color: 'var(--destructive)',   label: '✗ Conflict' },
};

export default function Pairing({ window_open, window_deadline, requests, stats }) {
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
                    <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', minWidth: '110px' }}>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: color ?? 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                        <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Window control */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
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
                    disabled={running || stats.existing_pairs > 0}
                    style={{
                        padding: '7px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
                        background: stats.existing_pairs > 0 ? 'var(--muted)' : 'var(--primary)',
                        color: stats.existing_pairs > 0 ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                        fontWeight: 700, fontSize: '0.875rem',
                        cursor: (running || stats.existing_pairs > 0) ? 'not-allowed' : 'pointer',
                        opacity: running ? 0.7 : 1,
                    }}
                >
                    {running ? 'Running…' : stats.existing_pairs > 0 ? 'Pairs Already Created' : '⚡ Run Pairing'}
                </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {Object.entries(TYPE_COLOR).map(([key, cfg]) => (
                    <span key={key} style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 'var(--radius-sm)', background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                ))}
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', alignSelf: 'center' }}>— {requests?.length ?? 0} total requests</span>
            </div>

            {/* Requests table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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
