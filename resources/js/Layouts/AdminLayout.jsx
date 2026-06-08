import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Broadcast, ChartBar, ChartLine, ClipboardText, CalendarBlank, Gear,
    GitBranch, House, List, MagnifyingGlass, Medal, Megaphone,
    ShieldCheck, SignOut, X, UserCircle, UsersThree,
} from '@phosphor-icons/react';

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast() {
    const { flash } = usePage().props;
    const [msg, setMsg]   = useState(null);
    const [type, setType] = useState('success');

    useEffect(() => {
        if (flash?.success) { setMsg(flash.success); setType('success'); }
        else if (flash?.error) { setMsg(flash.error); setType('error'); }
        else { setMsg(null); return; }
        const t = setTimeout(() => setMsg(null), 4000);
        return () => clearTimeout(t);
    }, [flash?.success, flash?.error]);

    if (!msg) return null;
    return (
        <div style={{
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
            padding: '12px 20px', borderRadius: 'var(--radius-md)',
            background: type === 'success' ? 'var(--success)' : 'var(--destructive)',
            color: type === 'success' ? 'var(--success-foreground)' : 'var(--destructive-foreground)',
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            fontSize: '0.9rem', fontWeight: 500, maxWidth: '380px',
        }}>
            {msg}
        </div>
    );
}

// ── Desktop nav item ──────────────────────────────────────────────────────────

function NavItem({ href, icon: Icon, label, active, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: active ? 'var(--primary)' : 'var(--foreground)',
                background: active ? 'var(--secondary)' : 'transparent',
                fontWeight: active ? 600 : 400, fontSize: '0.9rem',
                transition: 'background 0.1s',
            }}
        >
            <Icon size={18} weight={active ? 'fill' : 'regular'} />
            {label}
        </Link>
    );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

function Drawer({ open, onClose, navItems, isActive, userName }) {
    // Prevent body scroll while drawer is open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.45)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: 'opacity 0.2s',
                }}
            />

            {/* Drawer panel */}
            <div style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
                width: '260px', maxWidth: '80vw',
                background: 'var(--sidebar)',
                borderRight: '1px solid var(--sidebar-border)',
                display: 'flex', flexDirection: 'column',
                transform: open ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: open ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
            }}>
                {/* Drawer header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 14px 12px',
                    borderBottom: '1px solid var(--sidebar-border)',
                }}>
                    <img src="/images/logo.png" alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px', display: 'flex' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Nav links */}
                <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                    {navItems.map((item) => (
                        <NavItem
                            key={item.href}
                            {...item}
                            active={isActive(item.href)}
                            onClick={onClose}
                        />
                    ))}
                </nav>

                {/* User + logout */}
                <div style={{ padding: '10px 8px', borderTop: '1px solid var(--sidebar-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sidebar-foreground)' }}>{userName}</p>
                            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Admin</p>
                        </div>
                        <Link href="/logout" method="post" as="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}>
                            <SignOut size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children, title }) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const [drawerOpen, setDrawerOpen] = useState(false);

    const navItems = [
        { href: '/admin/dashboard',     icon: House,           label: 'Dashboard' },
        { href: '/admin/students',      icon: UsersThree,      label: 'Students' },
        { href: '/admin/halqas',        icon: ChartBar,        label: 'Halqas' },
        { href: '/admin/pairs',         icon: GitBranch,       label: 'Pairs' },
        { href: '/admin/pairing',       icon: ClipboardText,   label: 'Pairing' },
        { href: '/admin/leaderboard',   icon: Medal,           label: 'Leaderboard' },
        { href: '/admin/outreach',      icon: Broadcast,       label: 'Outreach' },
        { href: '/admin/leaders',       icon: UserCircle,      label: 'Leaders' },
        { href: '/admin/announcements', icon: Megaphone,       label: 'Announcements' },
        { href: '/admin/integrity',     icon: ShieldCheck,     label: 'Integrity' },
        { href: '/admin/reports',       icon: ChartLine,       label: 'Reports' },
        { href: '/admin/reports/weekly',icon: CalendarBlank,   label: 'Weekly Report' },
        { href: '/admin/settings',      icon: Gear,            label: 'Settings' },
        { href: '/admin/audit',         icon: MagnifyingGlass, label: 'Audit' },
    ];

    const isActive = (href) => url.startsWith(href);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>

            {/* ── Desktop sidebar ───────────────────────────────────────── */}
            <aside className="sidebar-desktop" style={{
                width: '220px', flexShrink: 0,
                background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)',
                display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 0, height: '100vh',
            }}>
                <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--sidebar-border)' }}>
                    <img src="/images/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
                </div>

                <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
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
                            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Admin</p>
                        </div>
                        <Link href="/logout" method="post" as="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}>
                            <SignOut size={16} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ── Main content ──────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Top bar */}
                <header style={{
                    height: '52px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', background: 'var(--card)',
                    position: 'sticky', top: 0, zIndex: 100,
                }}>
                    {/* Mobile: hamburger + logo */}
                    <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', padding: '4px', display: 'flex', alignItems: 'center' }}
                            aria-label="Open menu"
                        >
                            <List size={22} />
                        </button>
                        <img src="/images/logo.png" alt="Logo" style={{ height: '26px', objectFit: 'contain' }} />
                    </div>

                    {/* Desktop: page title */}
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600 }} className="desktop-only">{title}</span>

                    {/* Desktop: logout */}
                    <Link
                        href="/logout" method="post" as="button"
                        className="desktop-only"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '6px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center' }}
                    >
                        <SignOut size={18} />
                    </Link>

                    {/* Mobile: current page title centered */}
                    <span className="mobile-only" style={{
                        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                        fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none',
                        color: 'var(--foreground)',
                    }}>
                        {title}
                    </span>
                </header>

                <main style={{ flex: 1, padding: '20px 16px 40px' }}>
                    {children}
                </main>
            </div>

            {/* ── Mobile drawer ─────────────────────────────────────────── */}
            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                navItems={navItems}
                isActive={isActive}
                userName={auth?.user?.name}
            />

            <Toast />

            <style>{`
                .sidebar-desktop { display: flex !important; }
                .mobile-only { display: none !important; }
                .desktop-only { display: flex !important; }
                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .mobile-only { display: flex !important; }
                    .desktop-only { display: none !important; }
                }
            `}</style>
        </div>
    );
}
