import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';

function getKey(id) { return `announcement_dismissed_${id}`; }
function isDismissed(id) { try { return localStorage.getItem(getKey(id)) === '1'; } catch { return false; } }
function dismiss(id)     { try { localStorage.setItem(getKey(id), '1'); } catch {} }

function PostForm() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ title: '', body: '' });

    function submit(e) {
        e.preventDefault();
        post('/leader/announcements', {
            onSuccess: () => { reset(); setOpen(false); },
        });
    }

    const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' };

    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <button onClick={() => setOpen(v => !v)} aria-label={open ? 'Collapse post form' : 'Expand post form'} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)' }}>
                <span>📢 Post to my halqa</span>
                <span style={{ fontSize: '1rem', color: 'var(--muted-foreground)' }}>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <form onSubmit={submit} style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: '12px' }}>
                        <input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="Title…" required style={inp} />
                        {errors.title && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.title}</p>}
                    </div>
                    <div>
                        <textarea value={data.body} onChange={e => setData('body', e.target.value)} placeholder="Write your announcement…" rows={4} required style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
                        <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'right' }}>{data.body.length} / 5000</p>
                        {errors.body && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.body}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setOpen(false)} style={{ padding: '7px 14px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '7px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                            {processing ? 'Posting…' : 'Post & Notify Students'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function Announcements({ announcements = [] }) {
    const [dismissed, setDismissed] = useState(() =>
        new Set((announcements).filter((a) => isDismissed(a.id)).map((a) => a.id))
    );

    function handleDismiss(id) {
        dismiss(id);
        setDismissed((prev) => new Set([...prev, id]));
    }

    function handleDelete(id) {
        if (!confirm('Delete this announcement?')) return;
        router.delete(`/leader/announcements/${id}`, { preserveScroll: true });
    }

    function handleClearDismissed() {
        dismissed.forEach(id => {
            try { localStorage.removeItem(getKey(id)); } catch {}
        });
        setDismissed(new Set());
    }

    const hasDismissed = dismissed.size > 0;

    return (
        <LeaderLayout title="Announcements">
            <Head title="Announcements" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>Announcements</h1>
                        <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            Post to your halqa or read messages from admin.
                        </p>
                    </div>
                    {hasDismissed && (
                        <button onClick={handleClearDismissed} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--muted-foreground)', textDecoration: 'underline', padding: '2px 0', flexShrink: 0 }}>
                            Clear all dismissed
                        </button>
                    )}
                </div>

                <PostForm />

                {announcements.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                        No announcements yet.
                    </div>
                )}

                {announcements.map((a) => {
                    const isDone = dismissed.has(a.id);
                    const accentColor = isDone ? 'var(--muted-foreground)' : a.mine ? 'var(--success)' : 'var(--primary)';
                    return (
                        <div key={a.id} style={{
                            background: isDone ? 'var(--muted)' : 'var(--card)',
                            border: '1px solid var(--border)',
                            borderLeft: `4px solid ${accentColor}`,
                            borderRadius: 'var(--radius-lg)',
                            padding: '16px 18px',
                            opacity: isDone ? 0.65 : 1,
                            transition: 'opacity 0.2s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--foreground)' }}>
                                            📢 {a.title}
                                        </p>
                                        {a.mine && !isDone && (
                                            <span style={{ fontSize: '0.6875rem', padding: '1px 6px', background: 'var(--success)', color: 'var(--success-foreground, #fff)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                                                Your post
                                            </span>
                                        )}
                                        {isDone && (
                                            <span style={{ fontSize: '0.6875rem', padding: '1px 6px', background: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                                                Dismissed
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', color: 'var(--foreground)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {a.body}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                        {a.created_at} · by {a.posted_by}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    {a.mine && (
                                        <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: '1px solid var(--destructive)', cursor: 'pointer', color: 'var(--destructive)', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                                            Delete
                                        </button>
                                    )}
                                    {!isDone && (
                                        <button onClick={() => handleDismiss(a.id)} style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </LeaderLayout>
    );
}
