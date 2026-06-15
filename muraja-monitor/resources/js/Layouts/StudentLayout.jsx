import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/Components/UI/Logo';
import {
    Bell, BookOpen, ClockCounterClockwise, DotsThree, House,
    Medal, Megaphone, Mosque, SignOut, UsersThree,
} from '@phosphor-icons/react';

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast() {
    const { flash } = usePage().props;
    const [msg, setMsg] = useState(null);
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
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: type === 'success' ? 'var(--success)' : 'var(--destructive)',
            color: type === 'success' ? 'var(--success-foreground)' : 'var(--destructive-foreground)',
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            fontSize: '0.9rem', fontWeight: 500, maxWidth: '340px',
        }}>
            {msg}
        </div>
    );
}

// ── Notification Bell ─────────────────────────────────────────────────────────

function NotificationBell({ compact = false }) {
    const { notifications } = usePage().props;
    const [open, setOpen]   = useState(false);
    const ref               = useRef(null);

    useEffect(() => {
        function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    function markRead(id) {
        router.post(`/student/notifications/${id}/read`, {}, { preserveState: true, preserveScroll: true });
    }

    const count   = notifications?.unread_count ?? 0;
    const latest  = notifications?.latest ?? [];

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    position: 'relative', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '6px', borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)', display: 'flex', alignItems: 'center',
                }}
            >
                <Bell size={20} weight={count > 0 ? 'fill' : 'regular'} />
                {count > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2,
                        background: 'var(--destructive)', color: 'var(--destructive-foreground)',
                        borderRadius: '999px', fontSize: '0.625rem', fontWeight: 700,
                        minWidth: '16px', height: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px',
                    }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '110%', width: '300px',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,.12)',
                    zIndex: 200, overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', borderBottom: '1px solid var(--border)',
                    }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)' }}>
                            Notifications
                        </span>
                        {count > 0 && (
                            <button
                                onClick={() => router.post('/student/notifications/read-all', {}, { preserveState: true })}
                                style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    {latest.length === 0 ? (
                        <p style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
                            No new notifications
                        </p>
                    ) : (
                        latest.map((n) => (
                            <div
                                key={n.id}
                                style={{
                                    padding: '10px 14px', borderBottom: '1px solid var(--border)',
                                    background: 'var(--muted)',
                                }}
                            >
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--foreground)' }}>{n.data.message}</p>
                                {n.data.juz && (
                                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                        Juz {n.data.juz} · pp. {n.data.page_from}–{n.data.page_to} · {n.data.minutes_spent} min
                                    </p>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{n.time}</span>
                                    <button
                                        onClick={() => markRead(n.id)}
                                        style={{ fontSize: '0.6875rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── Nav link ─────────────────────────────────────────────────────────────────

function NavItem({ href, icon: Icon, label, active }) {
    return (
        <Link
            href={href}
            className={`sidebar-nav-item${active ? ' active' : ''}`}
        >
            <Icon size={18} weight={active ? 'fill' : 'regular'} style={{ opacity: active ? 1 : 0.8 }} />
            {label}
        </Link>
    );
}

function MobileNavItem({ href, icon: Icon, label, active }) {
    return (
        <Link
            href={href}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                flex: 1, minWidth: 0, padding: '6px 1px', textDecoration: 'none',
                color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                fontSize: '0.5rem', fontWeight: active ? 600 : 400,
            }}
        >
            <Icon size={18} weight={active ? 'fill' : 'regular'} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                {label}
            </span>
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

// ── Layout ────────────────────────────────────────────────────────────────────

export default function StudentLayout({ children, title }) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const [showMore, setShowMore] = useState(false);

    const navItems = [
        { href: '/student/dashboard',     icon: House,                  label: 'Dashboard' },
        { href: '/student/announcements', icon: Megaphone,              label: 'Announcements' },
        { href: '/student/history',       icon: ClockCounterClockwise,  label: 'History' },
        { href: '/student/pair',          icon: UsersThree,             label: 'My Partner' },
        { href: '/student/halqa',         icon: Mosque,                 label: 'My Halqa' },
        { href: '/student/badges',        icon: Medal,                  label: 'Badges' },
        { href: '/student/journal',       icon: BookOpen,               label: 'Journal' },
    ];

    function isActive(href) {
        return url.startsWith(href);
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>

            {/* ── Sidebar (desktop) ───────────────────────────────────────── */}
            <aside style={{
                width: '220px', flexShrink: 0,
                background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)',
                display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 0, height: '100vh',
                // Hide on mobile
                '@media (max-width: 768px)': { display: 'none' },
            }}
                className="sidebar-desktop"
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

                {/* Nav links */}
                <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {navItems.map((item) => (
                        <NavItem key={item.href} {...item} active={isActive(item.href)} />
                    ))}
                </nav>

                {/* User + Logout */}
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
                            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--gold-300)' }}>Student</p>
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

            {/* ── Main ────────────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Top bar (mobile header + desktop notification area) */}
                <header style={{
                    height: '52px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', background: 'var(--card)', position: 'sticky', top: 0, zIndex: 100,
                }}>
                    {/* Mobile: logo */}
                    <Logo height={28} className="mobile-only" />
                    {/* Desktop: page title */}
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)' }}
                        className="desktop-only"
                    >
                        {title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <NotificationBell />
                        <HeaderLogoutButton />
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: '20px 20px 80px' }}>
                    {children}
                </main>
            </div>

            {/* ── Mobile bottom nav ────────────────────────────────────────── */}
            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'var(--card)', borderTop: '1px solid var(--border)',
                display: 'flex', zIndex: 150,
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
                className="mobile-bottom-nav"
            >
                {['/student/dashboard', '/student/history', '/student/pair', '/student/announcements'].map((href) => {
                    const item = navItems.find((n) => n.href === href);
                    return item ? <MobileNavItem key={href} {...item} active={isActive(href)} /> : null;
                })}
                {/* More button */}
                <button
                    onClick={() => setShowMore(v => !v)}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        flex: 1, minWidth: 0, padding: '6px 1px', background: 'none', border: 'none',
                        color: showMore ? 'var(--primary)' : 'var(--muted-foreground)',
                        fontSize: '0.5rem', fontWeight: showMore ? 600 : 400, cursor: 'pointer',
                    }}
                >
                    <DotsThree size={18} weight={showMore ? 'fill' : 'regular'} />
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
                        zIndex: 149, minWidth: '160px', padding: '6px',
                        display: 'flex', flexDirection: 'column', gap: '2px',
                    }}
                        className="mobile-bottom-nav"
                    >
                        {['/student/halqa', '/student/badges', '/student/journal'].map((href) => {
                            const item = navItems.find((n) => n.href === href);
                            if (!item) return null;
                            return (
                                <Link key={href} href={href} onClick={() => setShowMore(false)} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 12px', borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    background: isActive(href) ? 'var(--secondary)' : 'transparent',
                                    color: isActive(href) ? 'var(--primary)' : 'var(--foreground)',
                                    fontSize: '0.875rem', fontWeight: isActive(href) ? 600 : 400,
                                }}>
                                    <item.icon size={18} weight={isActive(href) ? 'fill' : 'regular'} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}

            <Toast />

            {/* Inline styles for responsive classes */}
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
