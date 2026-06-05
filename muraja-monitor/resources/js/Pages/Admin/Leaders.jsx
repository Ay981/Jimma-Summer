import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Leaders({ leaders }) {
    const flagged = (leaders ?? []).filter((l) => l.never_logged_in || l.inactive_this_week);

    return (
        <AdminLayout title="Leader Monitoring">
            <Head title="Leaders" />

            {flagged.length > 0 && (
                <div style={{ background: 'oklch(97% 0.04 20)', border: '1px solid oklch(85% 0.08 20)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', fontWeight: 700, color: 'oklch(45% 0.1 20)' }}>⚠ Leaders needing attention ({flagged.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {flagged.map((l) => (
                            <span key={l.id} style={{ fontSize: '0.8125rem', padding: '3px 8px', background: 'oklch(92% 0.06 20)', borderRadius: 'var(--radius-sm)', color: 'oklch(40% 0.1 20)' }}>
                                {l.name} {l.never_logged_in ? '(never logged in)' : '(inactive this week)'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 80px 80px 80px', gap: '10px', padding: '6px 14px', borderBottom: '1px solid var(--border)' }}>
                    {['Leader', 'Halqa', 'Logins 30d', 'Last Login', 'Notes/wk', 'Meetings', 'Members'].map((h) => (
                        <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                    ))}
                </div>
                {(leaders ?? []).length === 0
                    ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No leaders yet.</p>
                    : (leaders ?? []).map((l) => (
                        <div key={l.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 80px 80px 80px',
                            gap: '10px', padding: '10px 14px', borderBottom: '1px solid var(--border)',
                            background: (l.never_logged_in || l.inactive_this_week) ? 'oklch(98% 0.02 20)' : 'transparent',
                        }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                                    {l.name}
                                    {l.never_logged_in && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'var(--destructive)', fontWeight: 600 }}>NEVER LOGGED IN</span>}
                                    {!l.never_logged_in && l.inactive_this_week && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'oklch(50% 0.12 50)', fontWeight: 600 }}>INACTIVE</span>}
                                </p>
                                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{l.student_id}</p>
                            </div>
                            <span style={{ fontSize: '0.875rem', alignSelf: 'center' }}>{l.halqa}</span>
                            <span style={{ fontSize: '0.875rem', alignSelf: 'center', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{l.logins_30d}</span>
                            <span style={{ fontSize: '0.8125rem', alignSelf: 'center', color: l.never_logged_in ? 'var(--destructive)' : 'var(--foreground)' }}>{l.last_login}</span>
                            <span style={{ fontSize: '0.875rem', alignSelf: 'center', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{l.notes_this_week}/{l.total_notes}</span>
                            <span style={{ fontSize: '0.875rem', alignSelf: 'center', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{l.meeting_count}</span>
                            <span style={{ fontSize: '0.875rem', alignSelf: 'center', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{l.member_count}</span>
                        </div>
                    ))
                }
            </div>
        </AdminLayout>
    );
}
