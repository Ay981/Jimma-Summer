import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Heatmap from '@/Components/UI/Heatmap';
import StatusTag from '@/Components/UI/StatusTag';

const SLOTS = { after_subhi: 'Fajr', after_zuhr: 'Dhuhr', after_asr: 'Asr', after_maghrib: 'Maghrib', after_isha: 'Isha' };
const SLOT_KEYS = Object.keys(SLOTS);
const DAYS = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
const DAY_KEYS = Object.keys(DAYS);

// ── Timeline event ────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    submission: { color: 'var(--success)', dot: '●' },
    contact:    { color: 'var(--accent)',  dot: '◆' },
    badge:      { color: 'oklch(70% 0.15 50)', dot: '★' },
    audit:      { color: 'var(--muted-foreground)', dot: '○' },
};

function TimelineEvent({ event }) {
    const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.audit;
    const date = new Date(event.date);
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', color: cfg.color }}>{cfg.dot}</span>
                <div style={{ flex: 1, width: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ flex: 1, paddingTop: '1px' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--foreground)' }}>
                    {event.label}
                    {event.meta?.flagged && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'var(--destructive)', fontWeight: 600 }}>FLAGGED</span>}
                    {event.meta?.edited  && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>edited</span>}
                </p>
                {event.meta?.filed_by && (
                    <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Filed by {event.meta.filed_by}</p>
                )}
                {event.meta?.by && (
                    <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>By {event.meta.by}</p>
                )}
                <p style={{ margin: '2px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{dateStr} {timeStr}</p>
            </div>
        </div>
    );
}

// ── Submission card ───────────────────────────────────────────────────────────

function SubmissionCard({ s }) {
    return (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ minWidth: '54px', textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(s.submission_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>{s.submitted_at}</p>
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>Juz {s.juz} · pp. {s.page_from}–{s.page_to}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.pages} pages · {s.minutes_spent} min · filed by {s.filed_by}</p>
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {s.is_edited  && <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>edited</span>}
                {s.is_flagged && <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'oklch(95% 0.05 20)', color: 'var(--destructive)', fontWeight: 600 }}>flagged{s.flag_verdict ? ` · ${s.flag_verdict}` : ''}</span>}
            </div>
        </div>
    );
}

// ── Edit inline form ──────────────────────────────────────────────────────────

function EditForm({ student, halqas, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name: student.name,
        phone: student.phone ?? '',
        current_juz: student.current_juz,
        available_times: student.available_times ?? [],
        available_days: student.available_days ?? [],
        halqa_id: student.halqa_id ?? '',
    });

    function toggleSlot(slot) {
        setData('available_times', data.available_times.includes(slot)
            ? data.available_times.filter((s) => s !== slot)
            : [...data.available_times, slot]);
    }

    function toggleDay(day) {
        setData('available_days', data.available_days.includes(day)
            ? data.available_days.filter((d) => d !== day)
            : [...data.available_days, day]);
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '420px', maxWidth: '95vw' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Edit {student.name}</h3>
                <form onSubmit={(e) => { e.preventDefault(); put(`/admin/students/${student.id}`, { onSuccess: onClose }); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[{ label: 'Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Juz', key: 'current_juz', type: 'number' }].map(({ label, key, type = 'text' }) => (
                        <div key={key}>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{label}</label>
                            <input type={type} value={data[key]} onChange={(e) => setData(key, e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                            {errors[key] && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors[key]}</p>}
                        </div>
                    ))}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Available Times</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {SLOT_KEYS.map((slot) => (
                                <button key={slot} type="button" onClick={() => toggleSlot(slot)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer', border: '1px solid var(--border)', background: data.available_times.includes(slot) ? 'var(--primary)' : 'var(--card)', color: data.available_times.includes(slot) ? 'var(--primary-foreground)' : 'var(--foreground)' }}>
                                    {SLOTS[slot]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Available Days</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {DAY_KEYS.map((day) => (
                                <button key={day} type="button" onClick={() => toggleDay(day)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer', border: '1px solid var(--border)', background: data.available_days.includes(day) ? 'var(--primary)' : 'var(--card)', color: data.available_days.includes(day) ? 'var(--primary-foreground)' : 'var(--foreground)' }}>
                                    {DAYS[day]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Halqa</label>
                        <select value={data.halqa_id} onChange={(e) => setData('halqa_id', e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }}>
                            <option value="">— Unassigned —</option>
                            {halqas.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Admin note editor ─────────────────────────────────────────────────────────

function AdminNoteEditor({ studentId, initialNote }) {
    const [note, setNote] = useState(initialNote ?? '');

    function save() {
        router.post(`/admin/students/${studentId}/note`, { note }, {
            preserveScroll: true,
        });
    }

    return (
        <div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private admin note (not visible to student or leader)…" rows={4}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem', resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button onClick={save} style={{ padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                    Save note
                </button>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDetail({ student, heatmap, submissions, timeline, halqas }) {
    const [section, setSection] = useState('timeline');
    const [showEdit, setShowEdit] = useState(false);

    function toggleActive() {
        if (!confirm(student.is_active ? `Deactivate ${student.name}?` : `Reactivate ${student.name}?`)) return;
        router.post(`/admin/students/${student.id}/toggle-active`, {}, { preserveScroll: true });
    }
    function resetPwd() {
        if (!confirm(`Reset ${student.name}'s password to default?`)) return;
        router.post(`/admin/students/${student.id}/reset-password`, {}, { preserveScroll: true });
    }
    function toggleMonitor() {
        router.post(`/admin/students/${student.id}/toggle-monitor`, {}, { preserveScroll: true });
    }
    function toggleWatchlist() {
        router.post(`/admin/students/${student.id}/toggle-watchlist`, {}, { preserveScroll: true });
    }

    const sections = [
        { key: 'timeline',    label: `Timeline (${timeline.length})` },
        { key: 'submissions', label: `Submissions (${submissions.length})` },
        { key: 'note',        label: 'Admin Note' },
    ];

    const availSlotLabels = (student.available_times ?? []).map((s) => SLOTS[s] ?? s).join(', ') || '—';
    const availDayLabels  = (student.available_days  ?? []).map((d) => DAYS[d]  ?? d).join(', ') || '—';

    return (
        <AdminLayout title={student.name}>
            <Head title={student.name} />

            {/* Breadcrumb */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/admin/students" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}>← Students</Link>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{student.name}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', alignItems: 'start' }} className="student-grid">

                {/* Left panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Profile card */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                                background: `oklch(60% 0.10 ${(student.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 120) + 100})`,
                                color: 'var(--warm-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.125rem', fontWeight: 700,
                            }}>
                                {student.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{student.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{student.student_id}</p>
                            </div>
                        </div>

                        {[
                            ['Halqa',       student.halqa],
                            ['Partner',     student.partner?.name ?? 'No pair'],
                            ['Phone',       student.phone ?? '—'],
                            ['Juz',         `Juz ${student.current_juz}`],
                            ['Times',       availSlotLabels],
                            ['Days',        availDayLabels],
                            ['Pages total', student.pages_total],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                                <span style={{ fontWeight: 500 }}>{value}</span>
                            </div>
                        ))}

                        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {student.badges?.map((b) => (
                                <span key={b.type} style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                                    {b.type.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Status badges */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        {!student.is_active    && <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', color: 'var(--muted-foreground)', fontWeight: 600 }}>Inactive</span>}
                        {student.is_monitored  && <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'oklch(95% 0.06 50)', color: 'oklch(40% 0.1 50)', fontWeight: 600 }}>⚑ Monitored</span>}
                        {student.on_watchlist  && <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--status-slipping-bg)', color: 'var(--status-slipping)', fontWeight: 600 }}>★ Watchlist</span>}
                        {!student.is_monitored && !student.on_watchlist && student.is_active && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Active · no flags</span>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        {[
                            { label: 'Edit student',                action: () => setShowEdit(true) },
                            { label: student.is_active ? 'Deactivate account' : 'Reactivate account', action: toggleActive, danger: student.is_active },
                            { label: 'Reset password to default',   action: resetPwd },
                            { label: student.is_monitored ? 'Remove monitoring flag' : 'Add monitoring flag', action: toggleMonitor },
                            { label: student.on_watchlist ? 'Remove from watchlist' : 'Add to watchlist', action: toggleWatchlist },
                            { label: 'Compare with another student', action: () => window.open(`/admin/students/compare?a=${student.id}`, '_blank') },
                        ].map(({ label, action, danger }) => (
                            <button key={label} onClick={action} style={{
                                display: 'block', width: '100%', padding: '10px 14px',
                                border: 'none', borderBottom: '1px solid var(--border)',
                                background: 'transparent', textAlign: 'left', cursor: 'pointer',
                                fontSize: '0.8125rem', color: danger ? 'var(--destructive)' : 'var(--foreground)',
                            }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Heatmap */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>30-Day Activity</p>
                        <Heatmap data={heatmap} />
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                        {sections.map((s) => (
                            <button key={s.key} onClick={() => setSection(s.key)} style={{
                                flex: 1, padding: '10px 8px', border: 'none',
                                background: section === s.key ? 'var(--secondary)' : 'transparent',
                                color: section === s.key ? 'var(--primary)' : 'var(--muted-foreground)',
                                fontWeight: section === s.key ? 600 : 400, fontSize: '0.8125rem', cursor: 'pointer',
                                borderBottom: section === s.key ? '2px solid var(--primary)' : '2px solid transparent',
                            }}>{s.label}</button>
                        ))}
                    </div>

                    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {section === 'timeline' && (
                            <div style={{ padding: '16px 20px' }}>
                                {timeline.length === 0
                                    ? <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No activity yet.</p>
                                    : timeline.map((e, i) => <TimelineEvent key={i} event={e} />)
                                }
                            </div>
                        )}

                        {section === 'submissions' && (
                            <div>
                                {submissions.length === 0
                                    ? <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>No submissions yet.</p>
                                    : submissions.map((s) => <SubmissionCard key={s.id} s={s} />)
                                }
                            </div>
                        )}

                        {section === 'note' && (
                            <div style={{ padding: '16px' }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                    Only visible to admins. Leaders and students cannot see this note.
                                </p>
                                <AdminNoteEditor studentId={student.id} initialNote={student.admin_note} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showEdit && <EditForm student={student} halqas={halqas} onClose={() => setShowEdit(false)} />}

            <style>{`
                @media (max-width: 900px) {
                    .student-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
