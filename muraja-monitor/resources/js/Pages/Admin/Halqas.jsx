import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function CodeBadge({ code, onDeactivate }) {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(code.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: 'var(--radius-sm)', background: code.is_active && !code.used_by ? 'var(--secondary)' : 'var(--muted)', border: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em', color: code.used_by ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                {code.code}
            </span>
            {code.used_by && <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>used by {code.used_by}</span>}
            {!code.is_active && !code.used_by && <span style={{ fontSize: '0.6875rem', color: 'var(--destructive)' }}>deactivated</span>}
            {code.is_active && !code.used_by && (
                <>
                    <button onClick={copy} style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', fontSize: '0.6875rem', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--foreground)' }}>
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={() => onDeactivate(code.id)} style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontSize: '0.6875rem', cursor: 'pointer' }}>
                        Deactivate
                    </button>
                </>
            )}
        </div>
    );
}

function HalqaCard({ halqa }) {
    const [expanded, setExpanded] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const { data, setData, put, processing, errors } = useForm({ name: halqa.name });

    function deactivateCode(id) {
        router.post(`/admin/halqas/codes/${id}/deactivate`, {}, { preserveScroll: true });
    }
    function generateCode() {
        router.post(`/admin/halqas/${halqa.id}/generate-code`, {}, { preserveScroll: true });
    }
    function del() {
        if (!confirm(`Delete halqa "${halqa.name}"? This cannot be undone.`)) return;
        router.delete(`/admin/halqas/${halqa.id}`, { preserveScroll: true });
    }
    function saveRename(e) {
        e.preventDefault();
        put(`/admin/halqas/${halqa.id}`, { onSuccess: () => setRenaming(false) });
    }

    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renaming ? (
                    <form onSubmit={saveRename} style={{ flex: 1, display: 'flex', gap: '6px' }}>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} />
                        <button type="submit" disabled={processing} style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Save</button>
                        <button type="button" onClick={() => setRenaming(false)} style={{ padding: '5px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
                    </form>
                ) : (
                    <>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{halqa.name}</h3>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                Leader: {halqa.leader} · {halqa.student_count} students · {halqa.pair_count} pairs · {halqa.group_consistency}% consistency
                            </p>
                        </div>
                        <button onClick={() => setRenaming(true)} style={{ padding: '5px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Rename</button>
                        <button onClick={del} style={{ padding: '5px 10px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Delete</button>
                        <button onClick={() => setExpanded(!expanded)} style={{ padding: '5px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>
                            {expanded ? 'Collapse' : 'Details'}
                        </button>
                    </>
                )}
            </div>

            {expanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Leader codes */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leader Codes</p>
                            <button onClick={generateCode} style={{ padding: '4px 10px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                                Generate New Code
                            </button>
                        </div>
                        {halqa.codes.length === 0 ? (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: 0 }}>No codes generated yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {halqa.codes.map((c) => <CodeBadge key={c.id} code={c} onDeactivate={deactivateCode} />)}
                            </div>
                        )}
                    </div>

                    {/* Recent meetings */}
                    {halqa.meetings.length > 0 && (
                        <div>
                            <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Meetings</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {halqa.meetings.map((m) => (
                                    <div key={m.id} style={{ padding: '7px 10px', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                            {new Date(m.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{m.attendance_count} attended</span>
                                        {m.notes && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Halqas({ halqas }) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '' });

    function create(e) {
        e.preventDefault();
        post('/admin/halqas', { onSuccess: () => reset() });
    }

    return (
        <AdminLayout title="Halqa Management">
            <Head title="Halqas" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }} className="halqas-grid">
                {/* Halqa list */}
                <div>
                    <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>All Halqas ({halqas.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {halqas.map((h) => <HalqaCard key={h.id} halqa={h} />)}
                        {halqas.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                                No halqas yet. Create one using the form.
                            </div>
                        )}
                    </div>
                </div>

                {/* Create halqa form */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'sticky', top: '70px' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Create Halqa</h3>
                    </div>
                    <form onSubmit={create} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Halqa Name</label>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Halqa Al-Fajr" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                            {errors.name && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.name}</p>}
                        </div>
                        <button type="submit" disabled={processing} style={{ padding: '8px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem', cursor: processing ? 'not-allowed' : 'pointer' }}>
                            {processing ? 'Creating…' : 'Create Halqa'}
                        </button>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                            After creating, generate a code and share it with the leader. They use it at /leader/setup to onboard.
                        </p>
                    </form>
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
