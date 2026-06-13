import { useState, useEffect } from 'react';

function getStorageKey(id) {
    return `announcement_dismissed_${id}`;
}

function isDismissed(id) {
    try { return localStorage.getItem(getStorageKey(id)) === '1'; } catch { return false; }
}

function dismiss(id) {
    try { localStorage.setItem(getStorageKey(id), '1'); } catch {}
}

export default function AnnouncementBanner({ announcements = [] }) {
    const [visible, setVisible] = useState([]);

    useEffect(() => {
        setVisible((announcements ?? []).filter((a) => !isDismissed(a.id)));
    }, [announcements]);

    function handleDismiss(id) {
        dismiss(id);
        setVisible((prev) => prev.filter((a) => a.id !== id));
    }

    if (!visible.length) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {visible.map((a) => (
                <div key={a.id} style={{
                    background: 'var(--secondary)',
                    border: '1px solid var(--border)',
                    borderLeft: '4px solid var(--primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary-foreground)' }}>
                            📢 {a.title}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--foreground)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {a.body}
                        </p>
                    </div>
                    <button
                        onClick={() => handleDismiss(a.id)}
                        aria-label="Dismiss"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--muted-foreground)', fontSize: '1rem',
                            padding: '0 2px', lineHeight: 1, flexShrink: 0,
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
