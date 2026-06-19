import { Fingerprint } from '@phosphor-icons/react';
import Logo from '@/Components/UI/Logo';

// Full-screen overlay shown while the app is biometrically locked. Blocks all
// interaction beneath it until authenticate() succeeds. Rendered by BiometricGate.
export default function BiometricLock({ error, onUnlock }) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed', inset: 0, zIndex: 100000,
                background: 'var(--background)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '24px', padding: '32px',
                paddingTop: 'calc(32px + env(safe-area-inset-top))',
                paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
                textAlign: 'center',
            }}
        >
            <Logo height={40} />

            <button
                onClick={onUnlock}
                aria-label="Unlock with fingerprint"
                style={{
                    width: '96px', height: '96px', borderRadius: '50%',
                    background: 'var(--secondary)', border: '1px solid var(--border)',
                    color: 'var(--primary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <Fingerprint size={48} weight="duotone" />
            </button>

            <div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    {error ? 'Locked' : 'Unlocking…'}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', maxWidth: '260px' }}>
                    {error || 'Verify your identity to continue.'}
                </p>
            </div>

            {error && (
                <button
                    onClick={onUnlock}
                    style={{
                        padding: '10px 24px', fontSize: '0.875rem', fontWeight: 600,
                        color: 'var(--primary-foreground)', background: 'var(--primary)',
                        border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    }}
                >
                    Try again
                </button>
            )}
        </div>
    );
}
