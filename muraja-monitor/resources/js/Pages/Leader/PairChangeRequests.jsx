import { Head, Link } from '@inertiajs/react';
import LeaderLayout from '@/Layouts/LeaderLayout';

const STATUS_CONFIG = {
    escalated_to_admin: { label: 'Pending',  bg: 'var(--status-slipping-bg)',  color: 'var(--status-slipping)' },
    approved:           { label: 'Approved', bg: 'var(--status-on-track-bg)',  color: 'var(--status-on-track)' },
    rejected:           { label: 'Rejected', bg: 'var(--status-at-risk-bg)',   color: 'var(--status-at-risk)' },
};

const TYPE_CONFIG = {
    same_halqa:   { label: 'Same Halqa',  bg: 'var(--status-on-track-bg)',  color: 'var(--status-on-track)' },
    cross_halqa:  { label: 'Cross-Halqa', bg: 'var(--status-at-risk-bg)',   color: 'var(--status-at-risk)' },
    unspecified:  { label: 'Unspecified', bg: 'var(--muted)',               color: 'var(--muted-foreground)' },
};

export default function PairChangeRequests({ requests }) {
    return (
        <LeaderLayout title="Pair Change Requests">
            <Head title="Pair Change Requests" />

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Pair Change Requests</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        All requests you have submitted — admin review required.
                    </p>
                </div>
                <Link href="/leader/dashboard" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}>← Dashboard</Link>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {requests.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--muted-foreground)' }}>
                            No pair change requests submitted yet.
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>You can request a pair change from a student's pair detail page.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        {/* Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 80px 90px', gap: '10px', padding: '8px 16px', background: 'var(--muted)', borderBottom: '1px solid var(--border)', minWidth: '560px' }}>
                            {['Student', 'Partner', 'Requested', 'Type', 'Status', 'Date'].map(h => (
                                <span key={h} style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>{h}</span>
                            ))}
                        </div>
                        {requests.map((r, i) => {
                            const s = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.escalated_to_admin;
                            const t = TYPE_CONFIG[r.type]   ?? TYPE_CONFIG.unspecified;
                            return (
                                <div key={r.id} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 80px 90px',
                                    gap: '10px', padding: '10px 16px', alignItems: 'start',
                                    background: 'transparent',
                                    borderBottom: i < requests.length - 1 ? '1px solid var(--border)' : 'none',
                                    minWidth: '560px',
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{r.student_name}</p>
                                        <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{r.student_code}</p>
                                    </div>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--foreground)' }}>{r.partner_name ?? '—'}</span>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{r.requested_partner ?? 'No preference'}</span>
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 7px', borderRadius: '99px', background: t.bg, color: t.color, whiteSpace: 'nowrap', display: 'inline-block' }}>{t.label}</span>
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 7px', borderRadius: '99px', background: s.bg, color: s.color, whiteSpace: 'nowrap', display: 'inline-block' }}>{s.label}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{r.requested_at}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </LeaderLayout>
    );
}
