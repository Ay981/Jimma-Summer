import { Fingerprint } from '@phosphor-icons/react';
import { useBiometricSetting } from '@/hooks/useBiometricLock';

// Opt-in row for the fingerprint app lock, shown inside the notification bell
// dropdown. Renders nothing on the web or on devices without biometrics.
export default function EnableBiometricLock() {
    const { available, enabled, busy, toggle } = useBiometricSetting();

    if (!available) return null;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
        }}>
            <Fingerprint size={18} weight="duotone" style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    App lock
                </p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                    Require fingerprint to open the app
                </p>
            </div>
            <button
                onClick={toggle}
                disabled={busy}
                role="switch"
                aria-checked={enabled}
                aria-label="Toggle fingerprint app lock"
                style={{
                    position: 'relative', flexShrink: 0,
                    width: '40px', height: '22px', borderRadius: '999px',
                    border: 'none', cursor: busy ? 'default' : 'pointer',
                    background: enabled ? 'var(--primary)' : 'var(--border)',
                    opacity: busy ? 0.7 : 1, transition: 'background .15s',
                }}
            >
                <span style={{
                    position: 'absolute', top: '2px', left: enabled ? '20px' : '2px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: 'var(--card)', transition: 'left .15s',
                }} />
            </button>
        </div>
    );
}
