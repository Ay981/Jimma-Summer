import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/Components/UI/Logo';
import {
    Bell, ClipboardText, CalendarBlank, DotsThree, FilePdf, GitBranch, House, Megaphone, SignOut, UsersThree,
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
    const style = {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px 10px 13px', borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: active ? 'var(--sidebar-active-fg)' : 'var(--sidebar-foreground)',
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        fontWeight: active ? 500 : 400,
        fontSize: '0.9rem',
        transition: 'background var(--transition-base), color var(--transition-base)',
        borderLeft: `3px solid ${active ? 'var(--gold-500)' : 'transparent'}`,
    };

    if (external) {
        return (
            <a href={href} target="_blank" rel="noreferrer" style={style}>
                <Icon size={18} weight="regular" />
                {label}
            </a>
        );
    }
    return (
        <Link href={href} style={style}>
            <Icon size={18} weight={active ? 'fill' : 'regular'} />
            {label}
        </Link>
    );
}

function MobileNavItem({ href, icon: Icon, label, active, external }) {
    const style = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        flex: 1, padding: '6px 4px', textDecoration: 'none',
        color: active ? 'var(--primary)' : 'var(--muted-foreground)',
        fontSize: '0.625rem', fontWeight: active ? 600 : 400,
    };
    if (external) {
        return (
            <a href={href} target="_blank" rel="noreferrer" style={style}>
                <Icon size={20} weight="regular" />
                {label}
            </a>
        );
    }
    return (
        <Link href={href} style={style}>
            <Icon size={20} weight={active ? 'fill' : 'regular'} />
            {label}
        </Link>
    );
}

function NotificationBell() {
    const { notifications } = usePage().props;
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const count  = notifications?.unread_count ?? 0;
    const latest = notifications?.latest ?? [];

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button onClick={() => setOpen(v => !v)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 'var(--radius-md)', color: 'var(--foreground)', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} weight={count > 0 ? 'fill' : 'regular'} />
                {count > 0 && (
                    <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 700, minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>
            {open && (
                <div style={{ position: 'absolute', right: 0, top: '110%', width: '300px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Notifications</span>
                        {count > 0 && (
                            <button onClick={() => router.post('/student/notifications/read-all', {}, { preserveState: true })} style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Mark all read
                            </button>
                        )}
                    </div>
                    {latest.length === 0
                        ? <p style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No new notifications</p>
                        : latest.map(n => (
                            <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>{n.data?.message}</p>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{n.time}</span>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
}

export default function LeaderLayout({ children, title }) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const [showMore, setShowMore] = useState(false);

    const navItems = [
        { href: '/leader/dashboard',               icon: House,         label: 'Dashboard' },
        { href: '/leader/dashboard?view=pairs',    icon: GitBranch,     label: 'Pairs',         viewKey: 'pairs' },
        { href: '/leader/dashboard?view=students', icon: UsersThree,    label: 'Students',      viewKey: 'students' },
        { href: '/leader/announcements',           icon: Megaphone,     label: 'Announcements' },
        { href: '/leader/meetings',                icon: ClipboardText, label: 'Meetings' },
        { href: '/leader/weekly-report',           icon: CalendarBlank, label: 'Weekly Report' },
        { href: '/leader/export/pdf',              icon: FilePdf,       label: 'Export PDF',    external: true },
    ];

    function isActive(item) {
        if (item.href === '/leader/export/pdf') return false;
        // For view-parameterised links, match path + param
        if (item.viewKey) {
            const param = typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('view')
                : null;
            return url.startsWith('/leader/dashboard') && (param === item.viewKey);
        }
        // For plain Dashboard link — active only when no ?view= param
        if (item.href === '/leader/dashboard') {
            const param = typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('view')
                : null;
            return url.startsWith('/leader/dashboard') && !param;
        }
        return url.startsWith(item.href);
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <aside
                className="sidebar-desktop"
                style={{
                    width: '220px', flexShrink: 0,
                    background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)',
                    display: 'flex', flexDirection: 'column',
                    position: 'sticky', top: 0, height: '100vh',
                }}
            >
                {/* Logo + app name */}
                <div style={{ padding: '16px 14px 14px', borderBottom: '1px solid var(--sidebar-border)' }}>
                    <Logo height={36} />
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--warm-50)' }}>
                        Muraja'a Monitor
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '0.6875rem', color: 'var(--gold-400)' }}>
                        Summer 1446H
                    </p>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {navItems.map((item) => (
                        <NavItem key={item.href} {...item} active={isActive(item)} />
                    ))}
                </nav>

                {/* User + logout */}
                <div style={{ padding: '10px 10px', borderTop: '1px solid var(--sidebar-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px' }}>
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: 'var(--green-600)', color: 'var(--warm-50)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700,
                        }}>
                            {auth?.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--warm-50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {auth?.user?.name}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--gold-300)' }}>Leader</p>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-accent-foreground)', padding: '4px', flexShrink: 0 }}
                        >
                            <SignOut size={16} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ── Main ─────────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Top bar */}
                <header style={{
                    height: '52px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', background: 'var(--card)',
                    position: 'sticky', top: 0, zIndex: 100,
                }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <NotificationBell />
                        <Link href="/logout" method="post" as="button" aria-label="Log out" className="mobile-header-action" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '6px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center' }}>
                            <SignOut size={20} />
                        </Link>
                    </div>
                </header>

                <main style={{ flex: 1, padding: '20px 20px 80px' }}>
                    {children}
                </main>
            </div>

            {/* ── Mobile bottom nav ─────────────────────────────────────── */}
            <nav
                className="mobile-bottom-nav"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: 'var(--card)', borderTop: '1px solid var(--border)',
                    display: 'flex', zIndex: 150,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {/* 4 primary items */}
                {['/leader/dashboard', '/leader/dashboard?view=pairs', '/leader/announcements', '/leader/meetings'].map((href) => {
                    const item = navItems.find(n => n.href === href);
                    return item ? <MobileNavItem key={href} {...item} active={isActive(item)} /> : null;
                })}
                {/* More */}
                <button
                    onClick={() => setShowMore(v => !v)}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        flex: 1, padding: '6px 4px', background: 'none', border: 'none', cursor: 'pointer',
                        color: showMore ? 'var(--primary)' : 'var(--muted-foreground)',
                        fontSize: '0.625rem', fontWeight: showMore ? 600 : 400,
                    }}
                >
                    <DotsThree size={20} weight={showMore ? 'fill' : 'regular'} />
                    <span>More</span>
                </button>
            </nav>

            {/* More sheet */}
            {showMore && (
                <>
                    <div onClick={() => setShowMore(false)} style={{ position: 'fixed', inset: 0, zIndex: 148 }} />
                    <div style={{
                        position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom))',
                        right: '12px', background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)', boxShadow: '0 -4px 20px rgba(0,0,0,.12)',
                        zIndex: 149, minWidth: '180px', padding: '6px',
                        display: 'flex', flexDirection: 'column', gap: '2px',
                    }} className="mobile-bottom-nav">
                        {[
                            { href: '/leader/dashboard?view=students', icon: UsersThree, label: 'Students' },
                            { href: '/leader/weekly-report',           icon: CalendarBlank, label: 'Weekly Report' },
                            { href: '/leader/export/pdf',              icon: FilePdf, label: 'Export PDF', external: true },
                        ].map(item => (
                            item.external
                                ? <a key={item.href} href={item.href} target="_blank" rel="noreferrer" onClick={() => setShowMore(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--foreground)', fontSize: '0.875rem' }}>
                                    <item.icon size={18} />{item.label}
                                  </a>
                                : <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: 'var(--radius-md)', textDecoration: 'none', background: isActive(item) ? 'var(--secondary)' : 'transparent', color: isActive(item) ? 'var(--primary)' : 'var(--foreground)', fontSize: '0.875rem', fontWeight: isActive(item) ? 600 : 400 }}>
                                    <item.icon size={18} weight={isActive(item) ? 'fill' : 'regular'} />{item.label}
                                  </Link>
                        ))}
                    </div>
                </>
            )}

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
