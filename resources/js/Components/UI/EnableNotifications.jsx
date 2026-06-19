import { useWebPush } from '@/hooks/useWebPush';

// Opt-in row shown inside the notification bell dropdown. Renders nothing when
// web push is unsupported, already granted, or blocked by the browser.
export default function EnableNotifications() {
    const { available, permission, busy, enable } = useWebPush();

    if (!available || permission === 'granted') return null;

    const denied = permission === 'denied';

    return (
        <div style={{
            padding: '10px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
        }}>
            {denied ? (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Notifications are blocked. Enable them in your browser’s site settings to get reminders.
                </p>
            ) : (
                <button
                    onClick={enable}
                    disabled={busy}
                    style={{
                        width: '100%', padding: '8px 10px',
                        fontSize: '0.8125rem', fontWeight: 600,
                        color: 'var(--primary-foreground)', background: 'var(--primary)',
                        border: 'none', borderRadius: 'var(--radius-md)',
                        cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
                    }}
                >
                    {busy ? 'Enabling…' : 'Enable browser notifications'}
                </button>
            )}
        </div>
    );
}
