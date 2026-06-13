import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

// ── Credentials table (shown after bulk create) ───────────────────────────────

function CredentialsTable({ credentials, onClose }) {
    function downloadCsv() {
        const rows = ['Halqa,Username,Password', ...credentials.map((c) => `${c.halqa},${c.username},${c.password}`)];
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'leader-credentials.csv';
        a.click();
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', width: '520px', maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Leader Credentials Generated</h3>
                    <button onClick={downloadCsv} style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                        Download CSV
                    </button>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    Distribute these credentials in person or via WhatsApp. Leaders must change their password on first login.
                </p>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Halqa', 'Username', 'Password'].map((h) => (
                                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {credentials.map((c, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '7px 8px', fontWeight: 500 }}>{c.halqa}</td>
                                    <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{c.username}</td>
                                    <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{c.password}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '7px 18px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Done</button>
                </div>
            </div>
        </div>
    );
}

// ── Halqa card ────────────────────────────────────────────────────────────────

function HalqaCard({ halqa }) {
    const [renaming, setRenaming]   = useState(false);
    const [expanded, setExpanded]   = useState(false);
    const { data, setData, put, processing } = useForm({ name: halqa.name });

    function del() {
        if (!confirm(`Delete "${halqa.name}"? This cannot be undone.`)) return;
        router.delete(`/admin/halqas/${halqa.id}`, { preserveScroll: true });
    }

    function saveRename(e) {
        e.preventDefault();
        put(`/admin/halqas/${halqa.id}`, { onSuccess: () => setRenaming(false) });
    }

    function randomPair() {
        if (!confirm(`Auto-pair students in ${halqa.name}?`)) return;
        router.post(`/admin/halqas/${halqa.id}/random-pair`, {}, { preserveScroll: true });
    }

    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renaming ? (
                    <form onSubmit={saveRename} style={{ flex: 1, display: 'flex', gap: '6px' }}>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus
                            style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} />
                        <button type="submit" disabled={processing}
                            style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Save</button>
                        <button type="button" onClick={() => setRenaming(false)}
                            style={{ padding: '5px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
                    </form>
                ) : (
                    <>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{halqa.name}</h3>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                Leader: {halqa.leader?.name ?? 'No leader assigned'} · {halqa.student_count} students · {halqa.pair_count} pairs · {halqa.group_consistency}%
                            </p>
                        </div>
                        <button onClick={() => setRenaming(true)}
                            style={{ padding: '5px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Rename</button>
                        <button onClick={randomPair}
                            style={{ padding: '5px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Auto-pair</button>
                        <button onClick={del}
                            style={{ padding: '5px 10px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Delete</button>
                        <button onClick={() => setExpanded(!expanded)}
                            style={{ padding: '5px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>
                            {expanded ? 'Collapse' : 'Details'}
                        </button>
                    </>
                )}
            </div>

            {expanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Students */}
                    <div>
                        <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Students ({halqa.members.length})
                        </p>
                        {halqa.members.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>No students assigned yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {halqa.members.map((s) => (
                                    <span key={s.id} style={{
                                        fontSize: '0.8125rem', padding: '3px 10px',
                                        background: 'var(--secondary)', borderRadius: '99px',
                                        color: 'var(--foreground)',
                                    }}>
                                        {s.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Meetings */}
                    <div>
                        <p style={{ margin: '0 0 6px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Recent Meetings
                        </p>
                        {halqa.meetings.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>No meetings logged yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {halqa.meetings.map((m) => (
                                    <div key={m.id} style={{ padding: '6px 10px', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                            {new Date(m.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{m.attendance_count} attended</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Halqas({ halqas, total_active_students, unassigned_count }) {
    const { flash } = usePage().props;
    const credentials = usePage().props.credentials ?? null;

    const [showCreds, setShowCreds] = useState(!!credentials?.length);

    // Bulk create form
    const bulk = useForm({ num_leaders: '' });
    // Single create
    const single = useForm({ name: '' });

    const s = {
        padding: '7px 10px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', background: 'var(--background)',
        color: 'var(--foreground)', fontSize: '0.875rem',
        width: '100%', boxSizing: 'border-box',
    };

    function bulkSubmit(e) {
        e.preventDefault();
        bulk.post('/admin/halqas/bulk-create', { onSuccess: () => { bulk.reset(); setShowCreds(true); } });
    }

    function singleSubmit(e) {
        e.preventDefault();
        single.post('/admin/halqas', { onSuccess: () => single.reset() });
    }

    function randomAssign() {
        if (!confirm(`Randomly assign ${unassigned_count} unassigned students to halqas by available time slot?`)) return;
        router.post('/admin/halqas/random-assign', {}, { preserveScroll: true });
    }

    const soloWarning = total_active_students % 2 !== 0;

    return (
        <AdminLayout title="Halqa Management">
            <Head title="Halqas" />

            {showCreds && credentials?.length > 0 && (
                <CredentialsTable credentials={credentials} onClose={() => setShowCreds(false)} />
            )}

            {/* Stats banner */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Active students</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{total_active_students}</p>
                </div>
                <div style={{ color: 'var(--border)' }}>·</div>
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Halqas</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{halqas.length}</p>
                </div>
                <div style={{ color: 'var(--border)' }}>·</div>
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Unassigned students</p>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: unassigned_count > 0 ? 'var(--destructive)' : 'var(--success)' }}>{unassigned_count}</p>
                </div>
                {unassigned_count > 0 && halqas.length > 0 && (
                    <button onClick={randomAssign} style={{ marginLeft: 'auto', padding: '7px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        Auto-assign to halqas
                    </button>
                )}
            </div>

            {/* Solo student warning */}
            {soloWarning && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'var(--status-slipping-bg)', border: '1px solid var(--status-slipping-border)', borderLeft: '4px solid var(--status-slipping)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--status-slipping)' }}>
                    ⚠ <strong>{total_active_students} students total is odd.</strong> 1 student cannot be paired and will be assigned to her halqa leader for direct monitoring.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }} className="halqas-grid">

                {/* Halqa list */}
                <div>
                    <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>All Halqas ({halqas.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {halqas.map((h) => <HalqaCard key={h.id} halqa={h} />)}
                        {halqas.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                                No halqas yet. Use the form to create them.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '70px' }}>

                    {/* Bulk create */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Create Halqas & Leaders</h3>
                        </div>
                        <form onSubmit={bulkSubmit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Number of leaders</label>
                                <input
                                    type="number" min="1" max="50"
                                    value={bulk.data.num_leaders}
                                    onChange={(e) => bulk.setData('num_leaders', e.target.value)}
                                    placeholder="e.g. 5"
                                    style={s}
                                />
                                {bulk.errors.num_leaders && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{bulk.errors.num_leaders}</p>}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                                Creates Halqa 1…N with leader-01…leader-N accounts (password: Muraja@1446). Leaders must change password on first login.
                            </p>
                            <button type="submit" disabled={bulk.processing}
                                style={{ padding: '8px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem', cursor: bulk.processing ? 'not-allowed' : 'pointer' }}>
                                {bulk.processing ? 'Creating…' : 'Create Halqas + Leaders'}
                            </button>
                        </form>
                    </div>

                    {/* Single create */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Add Single Halqa</h3>
                        </div>
                        <form onSubmit={singleSubmit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                                value={single.data.name}
                                onChange={(e) => single.setData('name', e.target.value)}
                                placeholder="Halqa name"
                                style={s}
                            />
                            {single.errors.name && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{single.errors.name}</p>}
                            <button type="submit" disabled={single.processing}
                                style={{ padding: '7px', border: 'none', background: 'var(--secondary)', color: 'var(--secondary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                                Add Halqa
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .halqas-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
