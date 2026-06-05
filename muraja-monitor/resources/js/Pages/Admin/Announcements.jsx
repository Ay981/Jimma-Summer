import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function AnnouncementCard({ a, halqas }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing } = useForm({ title: a.title, body: a.body, halqa_id: '' });

    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={data.title} onChange={(e) => setData('title', e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} />
                    <textarea value={data.body} onChange={(e) => setData('body', e.target.value)} rows={3} style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditing(false)} style={{ padding: '5px 12px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={() => put(`/admin/announcements/${a.id}`, { onSuccess: () => setEditing(false) })} disabled={processing} style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{a.title}</h3>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setEditing(true)} style={{ padding: '3px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => { if (confirm('Delete this announcement?')) router.delete(`/admin/announcements/${a.id}`, { preserveScroll: true }); }} style={{ padding: '3px 10px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{a.body}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Posted by {a.posted_by} · {a.halqa} · {a.created_at}
                    </p>
                </>
            )}
        </div>
    );
}

export default function Announcements({ announcements, halqas }) {
    const { data, setData, post, processing, reset, errors } = useForm({ title: '', body: '', halqa_id: '' });

    function submit(e) { e.preventDefault(); post('/admin/announcements', { onSuccess: () => reset() }); }

    return (
        <AdminLayout title="Announcements">
            <Head title="Announcements" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }} className="ann-grid">
                {/* List */}
                <div>
                    <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>All Announcements ({announcements.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {announcements.length === 0
                            ? <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>No announcements yet.</p>
                            : announcements.map((a) => <AnnouncementCard key={a.id} a={a} halqas={halqas} />)
                        }
                    </div>
                </div>
                {/* Form */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'sticky', top: '70px' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Post Announcement</h3>
                    </div>
                    <form onSubmit={submit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Title</label>
                            <input value={data.title} onChange={(e) => setData('title', e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Message</label>
                            <textarea value={data.body} onChange={(e) => setData('body', e.target.value)} rows={4} required style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Halqa (leave blank = all)</label>
                            <select value={data.halqa_id} onChange={(e) => setData('halqa_id', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }}>
                                <option value="">All halqas</option>
                                {halqas.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" disabled={processing} style={{ padding: '8px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem', cursor: processing ? 'not-allowed' : 'pointer' }}>Post</button>
                    </form>
                </div>
            </div>
            <style>{`@media (max-width: 768px) { .ann-grid { grid-template-columns: 1fr !important; } }`}</style>
        </AdminLayout>
    );
}
