import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const STATUS = {
    escalated_to_admin: { label: 'Pending',  bg: 'oklch(88% 0.1 75)',  color: 'oklch(38% 0.12 75)' },
    approved:           { label: 'Approved', bg: 'var(--success)',      color: 'var(--success-foreground)' },
    rejected:           { label: 'Rejected', bg: 'var(--destructive)',  color: 'var(--destructive-foreground)' },
};
const TYPE = {
    same_halqa:  { label: 'Same Halqa',  bg: 'oklch(90% 0.08 145)', color: 'oklch(36% 0.12 145)' },
    cross_halqa: { label: 'Cross-Halqa', bg: 'oklch(92% 0.08 20)',  color: 'var(--destructive)', warn: true },
    unspecified: { label: 'Unspecified', bg: 'var(--muted)',         color: 'var(--muted-foreground)' },
};

export default function PairChangeRequests({ requests, halqas, filter_status, filter_type, filter_halqa }) {
    const [status, setStatus] = useState(filter_status);
    const [type,   setType]   = useState(filter_type);
    const [halqa,  setHalqa]  = useState(filter_halqa);

    function applyFilters() {
        router.get('/admin/pair-changes', {
            filter_status: status, filter_type: type, filter_halqa: halqa,
        }, { preserveState: true });
    }

    const selStyle = {
        padding: '6px 10px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', background: 'var(--background)',
        color: 'var(--foreground)', fontSize: '0.8125rem',
    };

    return (
        <AdminLayout title="Pair Change Requests">
            <Head title="Pair Change Requests" />

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Pair Change Requests</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {requests.length} request{requests.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={() => router.get('/admin/pairs')} style={{ ...selStyle, cursor: 'pointer' }}>← All Pairs</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '3px' }}>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} style={selStyle}>
                        <option value="">All</option>
                        <option value="escalated_to_admin">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '3px' }}>Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} style={selStyle}>
                        <option value="">All</option>
                        <option value="same_halqa">Same Halqa</option>
                        <option value="cross_halqa">Cross-Halqa</option>
                        <option value="unspecified">Unspecified</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: '3px' }}>Halqa</label>
                    <select value={halqa} onChange={e => setHalqa(e.target.value)} style={selStyle}>
                        <option value="">All</option>
                        {halqas.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                <button onClick={applyFilters} style={{ padding: '6px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                    Apply
                </button>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {requests.length === 0 ? (
                    <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No requests found.</p>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 1fr 70px 70px 90px 80px', gap: '8px', padding: '7px 14px', background: 'oklch(97% 0.005 0)', borderBottom: '1px solid var(--border)' }}>
                            {['Student','Halqa','Partner','Requested','Type','Status','Date',''].map(h => (
                                <span key={h} style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>{h}</span>
                            ))}
                        </div>
                        {requests.map((r, i) => {
                            const s = STATUS[r.status] ?? STATUS.escalated_to_admin;
                            const t = TYPE[r.type]     ?? TYPE.unspecified;
                            return (
                                <div key={r.id} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 80px 1fr 1fr 70px 70px 90px 80px',
                                    gap: '8px', padding: '9px 14px', alignItems: 'center',
                                    background: i % 2 ? 'oklch(98.5% 0.003 0)' : 'transparent',
                                    borderBottom: i < requests.length - 1 ? '1px solid var(--border)' : 'none',
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{r.student_name}</p>
                                        <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{r.student_code}</p>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.student_halqa_id ?? '—'}</span>
                                    <span style={{ fontSize: '0.8125rem' }}>{r.partner_name ?? '—'}</span>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{r.requested_partner ?? 'No preference'}</span>
                                    <span style={{
                                        fontSize: '0.6875rem', fontWeight: 600, padding: '2px 7px',
                                        borderRadius: '99px', background: t.bg, color: t.color,
                                        border: t.warn ? '1px solid var(--destructive)' : 'none',
                                        whiteSpace: 'nowrap', display: 'inline-block',
                                    }}>{t.label}</span>
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 7px', borderRadius: '99px', background: s.bg, color: s.color, whiteSpace: 'nowrap', display: 'inline-block' }}>{s.label}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.requested_at}</span>
                                    <button
                                        onClick={() => router.get(`/admin/pair-changes/${r.id}`)}
                                        style={{ padding: '4px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Review
                                    </button>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
