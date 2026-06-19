import { useCallback, useEffect, useState } from 'react';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window &&
    !!firebaseConfig.apiKey &&
    !!vapidKey;

// Capacitor (Android app) handles push natively — skip web push there.
const isNativeApp =
    typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

function swUrl() {
    const p = new URLSearchParams({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
    });
    return `/firebase-messaging-sw.js?${p.toString()}`;
}

function csrf() {
    const m = (document.cookie.split(';').map((c) => c.trim())
        .find((c) => c.startsWith('XSRF-TOKEN=')) || '').split('=')[1];
    return m ? decodeURIComponent(m) : '';
}

async function fetchToken() {
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    await navigator.serviceWorker.register(swUrl());
    // getToken's PushManager.subscribe needs an *active* worker, not just a
    // registered one — serviceWorker.ready resolves once it's activated.
    const registration = await navigator.serviceWorker.ready;

    return getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
}

async function registerToken(token) {
    const res = await fetch('/push/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': csrf(),
        },
        credentials: 'include',
        body: JSON.stringify({ token, platform: 'web' }),
    });
    return res.ok;
}

export function useWebPush() {
    const available = isSupported && !isNativeApp;
    const [permission, setPermission] = useState(
        available ? Notification.permission : 'unsupported',
    );
    const [busy, setBusy] = useState(false);

    // If already granted, silently refresh the token on load so it stays current.
    useEffect(() => {
        if (!available || Notification.permission !== 'granted') return;
        if (window.__webPushSynced) return;
        window.__webPushSynced = true;
        fetchToken()
            .then((t) => t && registerToken(t))
            .catch((e) => { window.__webPushSynced = false; console.error('[webpush] sync failed:', e?.message || e); });
    }, [available]);

    const enable = useCallback(async () => {
        if (!available || busy) return;
        setBusy(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result !== 'granted') return;
            const token = await fetchToken();
            if (token) await registerToken(token);
        } catch {
            // swallow — user can retry via the button
        } finally {
            setBusy(false);
        }
    }, [available, busy]);

    return { available, permission, busy, enable };
}
