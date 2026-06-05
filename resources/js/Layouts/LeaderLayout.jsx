import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    ChartBar, ClipboardText, FilePdf, House, SignOut,
} from '@phosphor-icons/react';

function Toast() {
    const { flash } = usePage().props;
    const [msg, setMsg]   = useState(null);
    const [type, setType] = useState('success');

    useEffect(() => {
        if (flash?.success) { setMsg(flash.success); setType('success'); }
        else if (flash?.error) { setMsg(flash.error); setType('error'); }
        else { setMsg(null); return; }
        const t = setTimeout(() => setMsg(null), 3500);
        return () => clearTimeout(t);
    }, [flash?.success, flash?.error]);

    if (!msg) return null;
    return (
        <div style={{
            position: 'fixed', bottom: '80px', right: '20px', zIndex: 9999,
            padding: '12px 20px', borderRadius: 'var(--radius-md)',
            background: type === 'success' ? 'var(--success)' : 'var(--destructive)',
            color: type === 'success' ? 'var(--success-foreground)' : 'var(--destructive-foreground)',
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            fontSize: '0.9rem', fontWeight: 500, maxWidth: '340px',
        }}>
            {msg}
        </div>
    );
}

function NavItem({ href, icon: Icon, label, active, external }) {
    const sharedStyle = {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: active ? 'var(--primary)' : 'var(--foreground)',
        background: active ? 'var(--secondary)' : 'transparent',
        fontWeight: active ? 600 : 400,
        fontSize: '0.9rem',
        transition: 'background 0.1s',
    };
    if (external) {
        return (
            <a href={href} target="_blank" rel="noreferrer" style={sharedStyle}>
                <Icon size={18} weight="regular" />
                {label}
            </a>
        );
    }
    return (
        <Link href={href} style={sharedStyle}>
            <Icon size={18} weight={active ? 'fill' : 'regular'} />
            {label}
        </Link>
    );
}

function MobileNavItem({ href, icon: Icon, label, active, external }) {
    const sharedStyle = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        flex: 1, padding: '6px 4px', textDecoration: 'none',
        color: active ? 'var(--primary)' : 'var(--muted-foreground)',
        fontSize: '0.625rem', fontWeight: active ? 600 : 400,
    };
    if (external) {
        return (
            <a href={href} target="_blank" rel="noreferrer" style={sharedStyle}>
                <Icon size={20} weight="regular" />
                {label}
            </a>
        );
    }
    return (
        <Link href={href} style={sharedStyle}>
            <Icon size={20} weight={active ? 'fill' : 'regular'} />
            {label}
        </Link>
    );
}

function HeaderLogoutButton() {
    return (
        <Link
            href="/logout"
            method="post"
            as="button"
            aria-label="Log out"
            className="mobile-header-action"
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
                padding: '6px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <SignOut size={20} />
        </Link>
    );
}

export default function LeaderLayout({ children, title }) {
    const { url } = usePage();
    const { auth } = usePage().props;

    const navItems = [
        { href: '/leader/dashboard',  icon: House,         label: 'Dashboard' },
        { href: '/leader/meetings',   icon: ClipboardText, label: 'Meetings' },
        { href: '/leader/export/pdf', icon: FilePdf,       label: 'Export PDF', external: true },
    ];

    function isActive(href) {
        return url.startsWith(href);
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            <aside
                className="sidebar-desktop"
                style={{
                    width: '220px', flexShrink: 0,
                    background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)',
                    display: 'flex', flexDirection: 'column',
                    position: 'sticky', top: 0, height: '100vh',
                }}
            >
                <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--sidebar-border)' }}>
                    <img src="/images/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
                </div>

                <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {navItems.map((item) => (
                        <NavItem key={item.href} {...item} active={isActive(item.href)} />
                    ))}
                </nav>

                <div style={{ padding: '10px 8px', borderTop: '1px solid var(--sidebar-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sidebar-foreground)' }}>
                                {auth?.user?.name}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Leader</p>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}
                        >
                            <SignOut size={16} />
                        </Link>
                    </div>
                </div>
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <header style={{
                    height: '52px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', background: 'var(--card)',
                    position: 'sticky', top: 0, zIndex: 100,
                }}>
                    <img src="/images/logo.png" alt="Logo" style={{ height: '28px', objectFit: 'contain' }}
                        className="mobile-only"
                    />
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)' }}
                        className="desktop-only"
                    >
                        {title}
                    </span>
                    <HeaderLogoutButton />
                </header>

                <main style={{ flex: 1, padding: '20px 20px 80px' }}>
                    {children}
                </main>
            </div>

            <nav
                className="mobile-bottom-nav"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: 'var(--card)', borderTop: '1px solid var(--border)',
                    display: 'flex', zIndex: 150,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {navItems.map((item) => (
                    <MobileNavItem key={item.href} {...item} active={isActive(item.href)} />
                ))}
            </nav>

            <Toast />

            <style>{`
                .sidebar-desktop { display: flex !important; }
                .mobile-only { display: none !important; }
                .mobile-header-action { display: none !important; }
                .desktop-only { display: block !important; }
                .mobile-bottom-nav { display: none !important; }
                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .mobile-only { display: block !important; }
                    .mobile-header-action { display: flex !important; }
                    .desktop-only { display: none !important; }
                    .mobile-bottom-nav { display: flex !important; }
                }
            `}</style>
        </div>
    );
}
