import '../css/global.css';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BiometricLock from '@/Components/UI/BiometricLock';
import { useBiometricLock } from '@/hooks/useBiometricLock';

// Wraps the whole app so the biometric lock survives Inertia navigations (it
// mounts once here instead of inside a layout). Tracks the shared `auth` prop
// across navigations so the lock only applies while a user is logged in.
function BiometricGate({ initialAuth, children }) {
    const [authed, setAuthed] = useState(!!initialAuth?.user);

    useEffect(() => {
        return router.on('navigate', (event) => {
            setAuthed(!!event.detail.page.props.auth?.user);
        });
    }, []);

    const { locked, error, authenticate } = useBiometricLock(authed);

    return (
        <>
            {children}
            {locked && <BiometricLock error={error} onUnlock={authenticate} />}
        </>
    );
}

createInertiaApp({
    title: title => `${title} — Muraja'a Monitor`,
    resolve: name =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <BiometricGate initialAuth={props.initialPage.props.auth}>
                <App {...props} />
            </BiometricGate>,
        );
    },
    progress: {
        color: 'var(--primary)',
    },
});
