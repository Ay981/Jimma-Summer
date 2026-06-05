import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const ACTION_COLOR = {
    login:                  'var(--success)',
    logout:                 'var(--muted-foreground)',
    submission_filed:       'var(--primary)',
    submission_edited:      'oklch(70% 0.15 84)',
    admin_password_reset:   'var(--destructive)',
    password_changed:       'oklch(60% 0.12 260)',
};

export default function Audit({ logs, actions }) {
    const [filterAction, setFilterAction] = useState('');
    const [filterRole,   setFilterRole]   = useState('');
    const [search,       setSearch]       = useState('');
    const [dateFrom,     setDateFrom]     = useState('');
    const [dateTo,       setDateTo]       = useState('');

    const filtered = useMemo(() => {
        let list = logs ?? [];
        if (filterAction) list = list.filter((l) => l.action === filterAction);
        if (filterRole)   list = list.filter((l) => l.user?.role === filterRole);
        if (dateFrom)     list = list.filter((l) => l.created_at >= dateFrom);
        if (dateTo)       list = list.filter((l) => l.created_at <= dateTo + ' 23:59');
        if (search.trim()) { const q = search.toLowerCase(); list = list.filter((l) => l.user?.name?.toLowerCase().includes(q) || l.action.toLowerCase().includes(q)); }
        return list;
    }, [logs, filterAction, filterRole, dateFrom, dateTo, search]);

    const inp = { padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.8125rem' };

    return (
        <AdminLayout title="Audit Log">
            <Head title="Audit" />

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user / action…" style={{ ...inp, width: '180px' }} />
                <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={inp}>
                    <option value="">All actions</option>
                    {(actions ?? []).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={inp}>
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="leader">Leader</option>
                    <option value="student">Student</option>
                </select>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inp} title="From date" />
                <input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   style={inp} title="To date" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', alignSelf: 'center' }}>{filtered.length} entries</span>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 120px 140px 1fr 80px', gap: '10px', padding: '6px 14px', borderBottom: '1px solid var(--border)' }}>
                    {['Timestamp', 'User', 'Role', 'Action / Meta', 'Target'].map((h) => (
                        <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</span>
                    ))}
                </div>
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {filtered.length === 0
                        ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No audit logs match the filters.</p>
                        : filtered.map((l) => (
                            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '160px 120px 140px 1fr 80px', gap: '10px', padding: '7px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>{l.created_at}</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: l.user ? 500 : 400 }}>{l.user?.name ?? '—'}</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', color: 'var(--muted-foreground)', alignSelf: 'start', justifySelf: 'start', textTransform: 'capitalize' }}>{l.user?.role ?? '—'}</span>
                                <div>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: ACTION_COLOR[l.action] ?? 'var(--foreground)' }}>{l.action.replace(/_/g, ' ')}</span>
                                    {l.meta && Object.keys(l.meta).length > 0 && (
                                        <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            {Object.entries(l.meta).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                    {l.target_type ? `${l.target_type} #${l.target_id}` : '—'}
                                </span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </AdminLayout>
    );
}
