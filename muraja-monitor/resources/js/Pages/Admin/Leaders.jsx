import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const COL = '1fr 100px 80px 90px 80px 80px 80px 100px';

export default function Leaders({ leaders }) {
    const flagged = (leaders ?? []).filter((l) => l.never_logged_in || l.inactive_this_week);
    const [resetting, setResetting] = useState(null);

    function handleReset(e, l) {
        e.preventDefault();          // don't navigate
        e.stopPropagation();
        if (!confirm(`Reset password for ${l.name}?\n\nThey will be forced to set a new password on next login.`)) return;
        setResetting(l.id);
        router.post(`/admin/leaders/${l.id}/reset-password`, {}, {
            onFinish: () => setResetting(null),
        });
    }

    const rowBg = (l) => (l.never_logged_in || l.inactive_this_week) ? 'var(--status-at-risk-bg)' : 'transparent';

    return (
        <AdminLayout title="Leader Monitoring">
            <Head title="Leaders" />

            {flagged.length > 0 && (
                <div style={{ background: 'oklch(97% 0.04 20)', border: '1px solid oklch(85% 0.08 20)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--status-at-risk)' }}>⚠ Leaders needing attention ({flagged.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {flagged.map((l) => (
                            <span key={l.id} style={{ fontSize: '0.8125rem', padding: '3px 8px', background: 'oklch(92% 0.06 20)', borderRadius: 'var(--radius-sm)', color: 'var(--status-at-risk)' }}>
                                {l.name} {l.never_logged_in ? '(never logged in)' : '(inactive this week)'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: COL, gap: '10px', padding: '6px 14px', borderBottom: '1px solid var(--border)' }}>
                    {['Leader', 'Halqa', 'Logins 30d', 'Last Login', 'Notes/wk', 'Meetings', 'Members', ''].map((h) => (
                        <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                    ))}
                </div>

                {(leaders ?? []).length === 0
                    ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No leaders yet.</p>
                    : (leaders ?? []).map((l) => (
                        <Link
                            key={l.id}
                            href={`/admin/leaders/${l.id}`}
                            style={{
                                display: 'grid', gridTemplateColumns: COL,
                                gap: '10px', padding: '10px 14px',
                                borderBottom: '1px solid var(--border)',
                                background: rowBg(l),
                                textDecoration: 'none', color: 'var(--foreground)',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = rowBg(l))}
                        >
                            {/* Leader name + ID */}
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

                            {/* Reset PW — stops row navigation */}
                            <div style={{ alignSelf: 'center' }}>
                                <button
                                    onClick={(e) => handleReset(e, l)}
                                    disabled={resetting === l.id}
                                    style={{
                                        padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--secondary)', color: 'var(--foreground)',
                                        cursor: resetting === l.id ? 'not-allowed' : 'pointer',
                                        opacity: resetting === l.id ? 0.6 : 1,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {resetting === l.id ? 'Resetting…' : '↺ Reset PW'}
                                </button>
                            </div>
                        </Link>
                    ))
                }
            </div>
        </AdminLayout>
    );
}
