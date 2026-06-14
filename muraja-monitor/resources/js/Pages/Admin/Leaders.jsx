import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const COL        = '1fr 100px 80px 90px 80px 80px 80px 100px';
const COL_MOBILE = '1fr 50px 90px'; // name | logins | reset btn

const LEADERS_CSS = `
.leaders-row {
    display: grid;
    grid-template-columns: ${COL};
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    color: var(--foreground);
    cursor: pointer;
    align-items: center;
}
.leaders-header {
    grid-template-columns: ${COL};
    padding: 6px 14px;
    cursor: default;
}
.leaders-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 639px) {
    .leaders-row { grid-template-columns: ${COL_MOBILE}; gap: 8px; }
    .leaders-header { grid-template-columns: ${COL_MOBILE}; }
    .leaders-col-hide { display: none !important; }
}
`;

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
            <style>{LEADERS_CSS}</style>

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
                <div className="leaders-row leaders-header" style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leader</span>
                    <span className="leaders-col-hide" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Halqa</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logins 30d</span>
                    <span className="leaders-col-hide" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Login</span>
                    <span className="leaders-col-hide" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes/wk</span>
                    <span className="leaders-col-hide" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meetings</span>
                    <span className="leaders-col-hide" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</span>
                    <span />
                </div>

                {(leaders ?? []).length === 0
                    ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No leaders yet.</p>
                    : (leaders ?? []).map((l) => (
                        <Link
                            key={l.id}
                            href={`/admin/leaders/${l.id}`}
                            className="leaders-row"
                            style={{ background: rowBg(l) }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = rowBg(l))}
                        >
                            {/* Leader name + badge + ID */}
                            <div className="leaders-name">
                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {l.name}
                                    {l.never_logged_in && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'var(--destructive)', fontWeight: 600 }}>NEVER LOGGED IN</span>}
                                    {!l.never_logged_in && l.inactive_this_week && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'oklch(50% 0.12 50)', fontWeight: 600 }}>INACTIVE</span>}
                                </p>
                                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.student_id}</p>
                            </div>

                            <span className="leaders-col-hide" style={{ fontSize: '0.875rem' }}>{l.halqa}</span>
                            <span style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{l.logins_30d}</span>
                            <span className="leaders-col-hide" style={{ fontSize: '0.8125rem', color: l.never_logged_in ? 'var(--destructive)' : 'var(--foreground)' }}>{l.last_login}</span>
                            <span className="leaders-col-hide" style={{ fontSize: '0.875rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{l.notes_this_week}/{l.total_notes}</span>
                            <span className="leaders-col-hide" style={{ fontSize: '0.875rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{l.meeting_count}</span>
                            <span className="leaders-col-hide" style={{ fontSize: '0.875rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{l.member_count}</span>

                            {/* Reset PW */}
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
