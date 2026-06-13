import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

// ── Edit form modal ───────────────────────────────────────────────────────────

function EditForm({ leader, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name:  leader.name,
        phone: leader.phone ?? '',
    });

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '400px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Edit Leader</h3>
                <form onSubmit={(e) => { e.preventDefault(); put(`/admin/leaders/${leader.id}`, { onSuccess: onClose }); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: 'Full Name', key: 'name', placeholder: 'e.g. Ahmed Mohamed' },
                        { label: 'Phone',     key: 'phone', placeholder: '09XXXXXXXX' },
                    ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{label}</label>
                            <input
                                value={data[key]}
                                onChange={(e) => setData(key, e.target.value)}
                                placeholder={placeholder}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${errors[key] ? 'var(--destructive)' : 'var(--border)'}`, background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }}
                            />
                            {errors[key] && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors[key]}</p>}
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderDetail({ leader, members, meetings, contacts, logins }) {
    const [tab, setTab]         = useState('members');
    const [showEdit, setShowEdit] = useState(false);

    function resetPwd() {
        if (!confirm(`Reset ${leader.name}'s password to default?\n\nThey will be forced to change it on next login.`)) return;
        router.post(`/admin/leaders/${leader.id}/reset-password`, {}, { preserveScroll: true });
    }

    function toggleActive() {
        if (!confirm(leader.is_active ? `Deactivate ${leader.name}?` : `Reactivate ${leader.name}?`)) return;
        // reuse student toggle-active endpoint shape — leaders are also Users
        router.post(`/admin/leaders/${leader.id}/toggle-active`, {}, { preserveScroll: true });
    }

    const tabs = [
        { key: 'members',  label: `Members (${members?.length ?? 0})` },
        { key: 'meetings', label: `Meetings (${meetings?.length ?? 0})` },
        { key: 'contacts', label: `Contact Notes (${contacts?.length ?? 0})` },
        { key: 'logins',   label: `Login History (${logins?.length ?? 0})` },
    ];

    const initials = leader.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarHue = leader.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

    return (
        <AdminLayout title={leader.name}>
            <Head title={leader.name} />

            {/* Breadcrumb */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/admin/leaders" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}>← Leaders</Link>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{leader.name}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', alignItems: 'start' }} className="leader-grid">

                {/* ── Left panel ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Profile card */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                                background: `oklch(60% 0.10 ${(avatarHue % 120) + 100})`,
                                color: 'var(--warm-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.125rem', fontWeight: 700,
                            }}>
                                {initials}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{leader.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{leader.student_id}</p>
                            </div>
                        </div>

                        {[
                            ['Halqa',       leader.halqa],
                            ['Phone',       leader.phone ?? '—'],
                            ['Members',     leader.member_count],
                            ['Logins (30d)', leader.logins_30d],
                            ['Last login',  leader.last_login],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                                <span style={{ fontWeight: 500, color: label === 'Last login' && leader.never_logged_in ? 'var(--destructive)' : 'var(--foreground)' }}>{value}</span>
                            </div>
                        ))}

                        {!leader.is_active && (
                            <div style={{ marginTop: '10px', padding: '4px 8px', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Inactive</div>
                        )}
                        {leader.never_logged_in && (
                            <div style={{ marginTop: '8px', padding: '4px 8px', background: 'oklch(95% 0.05 20)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--destructive)', fontWeight: 600 }}>Never logged in</div>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        {[
                            { label: 'Edit name & phone',                      action: () => setShowEdit(true),  danger: false },
                            { label: 'Reset password to default',              action: resetPwd,                 danger: false },
                            { label: leader.is_active ? 'Deactivate account' : 'Reactivate account', action: toggleActive, danger: leader.is_active },
                        ].map(({ label, action, danger }) => (
                            <button key={label} onClick={action} style={{
                                display: 'block', width: '100%', padding: '10px 14px',
                                border: 'none', borderBottom: '1px solid var(--border)',
                                background: 'transparent', textAlign: 'left', cursor: 'pointer',
                                fontSize: '0.8125rem', color: danger ? 'var(--destructive)' : 'var(--foreground)',
                            }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Right panel (tabs) ── */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
                        {tabs.map((t) => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                flex: 1, padding: '10px 8px', border: 'none', whiteSpace: 'nowrap',
                                background: tab === t.key ? 'var(--secondary)' : 'transparent',
                                color: tab === t.key ? 'var(--primary)' : 'var(--muted-foreground)',
                                fontWeight: tab === t.key ? 600 : 400, fontSize: '0.8125rem', cursor: 'pointer',
                                borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                            }}>{t.label}</button>
                        ))}
                    </div>

                    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                        {/* Members */}
                        {tab === 'members' && (
                            <div>
                                {(members ?? []).length === 0
                                    ? <p style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No students assigned to this halqa yet.</p>
                                    : (members ?? []).map((s) => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                                            <div>
                                                <Link href={`/admin/students/${s.id}`} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)', textDecoration: 'none' }}>{s.name}</Link>
                                                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.student_id}</p>
                                            </div>
                                            {!s.is_active && <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>Inactive</span>}
                                        </div>
                                    ))
                                }
                            </div>
                        )}

                        {/* Meetings */}
                        {tab === 'meetings' && (
                            <div>
                                {(meetings ?? []).length === 0
                                    ? <p style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No meetings logged yet.</p>
                                    : (meetings ?? []).map((m) => (
                                        <div key={m.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.date}</span>
                                                <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{m.attendance_count} attended</span>
                                            </div>
                                            {m.highlights && <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--foreground)' }}><strong>Highlights:</strong> {m.highlights}</p>}
                                            {m.concerns   && <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--status-at-risk)' }}><strong>Concerns:</strong> {m.concerns}</p>}
                                            {m.notes      && <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{m.notes}</p>}
                                        </div>
                                    ))
                                }
                            </div>
                        )}

                        {/* Contact notes */}
                        {tab === 'contacts' && (
                            <div>
                                {(contacts ?? []).length === 0
                                    ? <p style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No contact notes filed yet.</p>
                                    : (contacts ?? []).map((c) => (
                                        <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                <Link href={`/admin/students/${c.student_db_id}`} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)', textDecoration: 'none' }}>{c.student_name}</Link>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{c.date} · {c.method}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{c.note}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        )}

                        {/* Login history */}
                        {tab === 'logins' && (
                            <div>
                                {(logins ?? []).length === 0
                                    ? <p style={{ padding: '32px', textAlign: 'center', color: 'var(--destructive)', fontSize: '0.875rem', margin: 0 }}>This leader has never logged in.</p>
                                    : (logins ?? []).map((l, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                                            <span style={{ color: 'var(--foreground)' }}>{l.date}</span>
                                            <span style={{ color: 'var(--muted-foreground)' }}>{l.ago}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showEdit && <EditForm leader={leader} onClose={() => setShowEdit(false)} />}

            <style>{`
                @media (max-width: 900px) {
                    .leader-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
