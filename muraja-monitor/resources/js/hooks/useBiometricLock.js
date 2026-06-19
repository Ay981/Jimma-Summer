import { useCallback, useEffect, useRef, useState } from 'react';

// Biometric "app lock": a local gate in front of the already-remembered session.
// It does NOT exchange credentials with the server — login still persists via the
// remember-me cookie. This just requires fingerprint / device credential to reveal
// the app after a cold start or after returning from the background.
//
// Only meaningful inside the Capacitor (Android) app — web browsers never see it.

const isNative =
    typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

const STORAGE_KEY = 'biometric-lock-enabled';

// Lazy-load the plugin so the web bundle never pulls in native-only code.
async function loadPlugin() {
    const mod = await import('@aparajita/capacitor-biometric-auth');
    return mod.BiometricAuth;
}

export function isBiometricLockEnabled() {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function setStoredEnabled(on) {
    try {
        localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {
        // ignore — storage unavailable
    }
}

// Checks whether the device actually has usable biometrics / a secure lock.
function useBiometryAvailable() {
    const [available, setAvailable] = useState(false);

    useEffect(() => {
        if (!isNative) return;
        let cancelled = false;
        loadPlugin()
            .then((Bio) => Bio.checkBiometry())
            .then((info) => {
                // Accept device-credential fallback too, so a device with a PIN but
                // no enrolled fingerprint can still use the lock.
                if (!cancelled) setAvailable(!!(info?.isAvailable || info?.deviceIsSecure));
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    return available;
}

const AUTH_OPTS = {
    reason: "Unlock Muraja'a Monitor",
    cancelTitle: 'Cancel',
    allowDeviceCredential: true,
    androidTitle: 'Unlock',
    androidSubtitle: 'Verify your identity to continue',
    androidConfirmationRequired: false,
};

// Drives the lock overlay. Owns the `locked` state. Mounted exactly once (in the
// gate) so navigations don't reset it. `authed` comes from the shared Inertia
// auth prop — we never lock the login screen.
export function useBiometricLock(authed) {
    const available = useBiometryAvailable();
    const [locked, setLocked] = useState(false);
    const [error, setError] = useState(null);
    const inFlight = useRef(false);

    const guarded = isNative && available && authed;

    // Lock on first mount and every time the app returns to the foreground.
    // `enabled` is read fresh from storage so toggling the setting takes effect
    // on the next foreground without any cross-component wiring.
    useEffect(() => {
        if (!guarded) {
            setLocked(false);
            return;
        }
        function relock() {
            if (isBiometricLockEnabled()) setLocked(true);
        }
        relock();
        function onVisibility() {
            if (document.visibilityState === 'visible') relock();
        }
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [guarded]);

    const authenticate = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setError(null);
        try {
            const Bio = await loadPlugin();
            await Bio.authenticate(AUTH_OPTS); // resolves on success, throws otherwise
            setLocked(false);
        } catch (e) {
            setError(e?.message || 'Authentication failed. Tap to try again.');
        } finally {
            inFlight.current = false;
        }
    }, []);

    // Auto-prompt as soon as we become locked.
    useEffect(() => {
        if (locked) authenticate();
    }, [locked, authenticate]);

    return { locked, error, authenticate };
}

// Powers the opt-in toggle in settings. Kept separate from useBiometricLock so it
// never touches the `locked` state — only the stored preference.
export function useBiometricSetting() {
    const available = useBiometryAvailable();
    const [enabled, setEnabled] = useState(isBiometricLockEnabled());
    const [busy, setBusy] = useState(false);

    const toggle = useCallback(async () => {
        if (busy) return;
        if (!enabled) {
            // Require a successful auth before turning the lock ON, so a broken or
            // unenrolled sensor can never lock the user out of their own app.
            setBusy(true);
            try {
                const Bio = await loadPlugin();
                await Bio.authenticate({ ...AUTH_OPTS, reason: 'Confirm to enable app lock' });
            } catch {
                setBusy(false);
                return;
            }
            setBusy(false);
        }
        const next = !enabled;
        setStoredEnabled(next);
        setEnabled(next);
    }, [enabled, busy]);

    return { available: isNative && available, enabled, busy, toggle };
}
