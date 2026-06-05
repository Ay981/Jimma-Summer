import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const METHOD_LABEL = { call: 'Call', message: 'Message', in_person: 'In Person' };

export default function Outreach({ logs, notToday }) {
    const [filterMethod, setFilterMethod] = useState('');
    const [search, setSearch]             = useState('');
    const [selected, setSelected]         = useState([]);
    const [showAdd, setShowAdd]           = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        student_id: '', method: 'call', note: '', follow_up_required: false,
    });

    const filtered = useMemo(() => {
        let list = logs ?? [];
        if (filterMethod) list = list.filter((l) => l.method === filterMethod);
        if (search.trim()) { const q = search.toLowerCase(); list = list.filter((l) => l.student.name.toLowerCase().includes(q)); }
        return list;
    }, [logs, filterMethod, search]);

    function toggleSelect(id) {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    }
    function selectAll() { setSelected(notToday.map((s) => s.id)); }
    function clearAll()  { setSelected([]); }

    function bulkNotify() {
        router.post('/admin/outreach/bulk-notify', { student_ids: selected }, { preserveScroll: true, onSuccess: () => setSelected([]) });
    }
    function bulkWatchlist() {
        router.post('/admin/outreach/bulk-watchlist', { student_ids: selected }, { preserveScroll: true, onSuccess: () => setSelected([]) });
    }

    function submitNote(e) {
        e.preventDefault();
        post('/admin/outreach/note', { onSuccess: () => { reset(); setShowAdd(false); } });
    }

    const inp = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' };

    return (
        <AdminLayout title="Outreach">
            <Head title="Outreach" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }} className="outreach-grid">

                {/* Left: contact log */}
                <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Contact Log ({filtered.length})</h2>
                        <div style={{ flex: 1 }} />
                        <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} style={inp}>
                            <option value="">All methods</option>
                            <option value="call">Call</option>
                            <option value="message">Message</option>
                            <option value="in_person">In Person</option>
                        </select>
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student…" style={{ ...inp, width: '160px' }} />
                        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                            + Add Note
                        </button>
                    </div>

                    {showAdd && (
                        <form onSubmit={submitNote} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Student</label>
                                    <input type="number" value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} placeholder="Student user ID" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Method</label>
                                    <select value={data.method} onChange={(e) => setData('method', e.target.value)} style={{ ...inp, width: '100%' }}>
                                        <option value="call">Call</option>
                                        <option value="message">Message</option>
                                        <option value="in_person">In Person</option>
                                    </select>
                                </div>
                            </div>
                            <textarea value={data.note} onChange={(e) => setData('note', e.target.value)} placeholder="Contact note…" rows={2} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '0.8125rem', display: 'flex', gap: '5px', cursor: 'pointer', alignItems: 'center' }}>
                                    <input type="checkbox" checked={data.follow_up_required} onChange={(e) => setData('follow_up_required', e.target.checked)} />
                                    Follow-up needed
                                </label>
                                <button type="submit" disabled={processing} style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                            </div>
                        </form>
                    )}

                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        {filtered.length === 0
                            ? <p style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No contact logs yet.</p>
                            : filtered.map((l) => (
                                <div key={l.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 80px 100px auto', gap: '10px', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{l.student.name}</p>
                                        <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{l.note.slice(0, 80)}{l.note.length > 80 ? '…' : ''}</p>
                                        <p style={{ margin: '1px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>by {l.by} · {l.contacted_at}</p>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--secondary)', color: 'var(--secondary-foreground)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {METHOD_LABEL[l.method]}
                                    </span>
                                    {l.follow_up_required && <span style={{ fontSize: '0.6875rem', color: 'oklch(55% 0.12 50)', fontWeight: 600 }}>Follow-up needed</span>}
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Right: not-submitted-today */}
                <div style={{ position: 'sticky', top: '70px' }}>
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Not submitted today ({notToday.length})</span>
                        </div>
                        <div style={{ padding: '6px 0', maxHeight: '360px', overflowY: 'auto' }}>
                            {notToday.map((s) => (
                                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</span>
                                </label>
                            ))}
                            {notToday.length === 0 && <p style={{ padding: '16px', textAlign: 'center', color: 'var(--success)', fontSize: '0.875rem', margin: 0 }}>All students submitted today!</p>}
                        </div>
                        {notToday.length > 0 && (
                            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={selectAll} style={{ flex: 1, padding: '5px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>All</button>
                                    <button onClick={clearAll}  style={{ flex: 1, padding: '5px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>Clear</button>
                                </div>
                                <button onClick={bulkNotify} disabled={!selected.length} style={{ padding: '7px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: selected.length ? 'pointer' : 'not-allowed', opacity: selected.length ? 1 : 0.5 }}>
                                    Notify selected ({selected.length})
                                </button>
                                <button onClick={bulkWatchlist} disabled={!selected.length} style={{ padding: '7px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: selected.length ? 'pointer' : 'not-allowed', opacity: selected.length ? 1 : 0.5 }}>
                                    Add to watchlist
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`@media (max-width: 768px) { .outreach-grid { grid-template-columns: 1fr !important; } }`}</style>
        </AdminLayout>
    );
}
