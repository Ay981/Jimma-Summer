import { Head } from '@inertiajs/react';
import { useState } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';

function getKey(id) { return `announcement_dismissed_${id}`; }
function isDismissed(id) { try { return localStorage.getItem(getKey(id)) === '1'; } catch { return false; } }
function dismiss(id)     { try { localStorage.setItem(getKey(id), '1'); } catch {} }

export default function Announcements({ announcements = [] }) {
    const [dismissed, setDismissed] = useState(() =>
        new Set((announcements).filter((a) => isDismissed(a.id)).map((a) => a.id))
    );

    function handleDismiss(id) {
        dismiss(id);
        setDismissed((prev) => new Set([...prev, id]));
    }

    return (
        <LeaderLayout title="Announcements">
            <Head title="Announcements" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h1 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>Announcements</h1>
                <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    Messages from admin. Dismissed announcements are still shown here.
                </p>

                {announcements.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                        No announcements yet.
                    </div>
                )}

                {announcements.map((a) => {
                    const isDone = dismissed.has(a.id);
                    return (
                        <div key={a.id} style={{
                            background: isDone ? 'var(--muted)' : 'var(--card)',
                            border: '1px solid var(--border)',
                            borderLeft: `4px solid ${isDone ? 'var(--muted-foreground)' : 'var(--primary)'}`,
                            borderRadius: 'var(--radius-lg)',
                            padding: '16px 18px',
                            opacity: isDone ? 0.65 : 1,
                            transition: 'opacity 0.2s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--foreground)' }}>
                                            📢 {a.title}
                                        </p>
                                        {isDone && (
                                            <span style={{ fontSize: '0.6875rem', padding: '1px 6px', background: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                                                Dismissed
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', color: 'var(--foreground)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {a.body}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{a.created_at}</p>
                                </div>
                                {!isDone && (
                                    <button
                                        onClick={() => handleDismiss(a.id)}
                                        style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </LeaderLayout>
    );
}
