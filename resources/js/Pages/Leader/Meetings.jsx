import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';

const OUTCOME_LABEL = { present: 'Present', absent: 'Absent', excused: 'Excused' };

// ── Open action items ────────────────────────────────────────────────────────

function ActionItemRow({ item }) {
    function resolve() {
        router.post(`/leader/meetings/actions/${item.id}/resolve`, {}, { preserveScroll: true });
    }
    return (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{item.student}: {item.description}</p>
                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: item.overdue ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
                    Due {item.due_date ?? '—'} · from meeting {item.meeting_date}
                    {item.overdue && ' · OVERDUE'}
                </p>
            </div>
            <button onClick={resolve} style={{ padding: '4px 10px', border: 'none', background: 'var(--success)', color: 'var(--success-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                Resolve
            </button>
        </div>
    );
}

// ── Meeting card ─────────────────────────────────────────────────────────────

function MeetingCard({ meeting, allStudents }) {
    const [expanded, setExpanded] = useState(false);
    const isDraft = meeting.state === 'draft';

    function del() {
        if (!confirm('Delete this meeting?')) return;
        router.delete(`/leader/meetings/${meeting.id}`, { preserveScroll: true });
    }
    function finalise() {
        router.put(`/leader/meetings/${meeting.id}`, { state: 'final', notes: meeting.notes, highlights: meeting.highlights, concerns: meeting.concerns, attendance: meeting.attendance }, { preserveScroll: true });
    }

    const dateStr = new Date(meeting.meeting_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const attended = Object.values(meeting.attendance ?? {}).filter((v) => v === 'present').length;

    return (
        <div style={{ background: 'var(--card)', border: `1px solid ${isDraft ? 'oklch(80% 0.1 84)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                        {dateStr}
                        {meeting.meeting_time && <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginLeft: '8px' }}>{meeting.meeting_time}</span>}
                        {isDraft && <span style={{ marginLeft: '8px', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'oklch(95% 0.08 84)', color: 'oklch(45% 0.12 84)', fontWeight: 700 }}>DRAFT</span>}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{attended} attended</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {isDraft && <button onClick={finalise} style={{ padding: '4px 10px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Finalise</button>}
                    <button onClick={() => setExpanded(!expanded)} style={{ padding: '4px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>{expanded ? 'Collapse' : 'Details'}</button>
                    <button onClick={del} style={{ padding: '4px 10px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                </div>
            </div>

            {expanded && (
                <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {meeting.notes && (
                        <div>
                            <p style={{ margin: '0 0 3px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Notes</p>
                            <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{meeting.notes}</p>
                        </div>
                    )}
                    {meeting.highlights && (
                        <div>
                            <p style={{ margin: '0 0 3px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>Highlights</p>
                            <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{meeting.highlights}</p>
                        </div>
                    )}
                    {meeting.concerns && (
                        <div>
                            <p style={{ margin: '0 0 3px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--destructive)', textTransform: 'uppercase' }}>Concerns</p>
                            <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{meeting.concerns}</p>
                        </div>
                    )}
                    {meeting.agenda_items?.length > 0 && (
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Agenda</p>
                            <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                {meeting.agenda_items.map((item, i) => <li key={i} style={{ fontSize: '0.875rem' }}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                    {Object.keys(meeting.attendance ?? {}).length > 0 && (
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Attendance</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {Object.entries(meeting.attendance).map(([id, status]) => {
                                    const student = allStudents.find((s) => String(s.id) === id);
                                    const color = status === 'present' ? 'var(--success)' : status === 'excused' ? 'oklch(70% 0.12 84)' : 'var(--destructive)';
                                    return (
                                        <span key={id} style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: color + '22', color }}>
                                            {student?.name ?? id}: {OUTCOME_LABEL[status] ?? status}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── New meeting form ─────────────────────────────────────────────────────────

function NewMeetingForm({ suggestedStudents, allStudents, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        meeting_date:     new Date().toISOString().split('T')[0],
        meeting_time:     '',
        notes:            '',
        highlights:       '',
        concerns:         '',
        agenda_items:     [],
        attendance:       {},
        action_items:     [],
        state:            'draft',
    });

    const [newAgendaItem, setNewAgendaItem] = useState('');
    const [newAction, setNewAction]         = useState({ student_id: '', description: '', due_date: '' });

    // Pre-populate attendance from allStudents
    useState(() => {
        const a = {};
        allStudents.forEach((s) => { a[s.id] = 'present'; });
        setData('attendance', a);
    }, []);

    function addAgendaItem() {
        if (!newAgendaItem.trim()) return;
        setData('agenda_items', [...data.agenda_items, newAgendaItem.trim()]);
        setNewAgendaItem('');
    }

    function removeAgendaItem(i) {
        setData('agenda_items', data.agenda_items.filter((_, idx) => idx !== i));
    }

    function addAction() {
        if (!newAction.description || !newAction.student_id) return;
        setData('action_items', [...data.action_items, { ...newAction }]);
        setNewAction({ student_id: '', description: '', due_date: '' });
    }

    function setAttendance(studentId, value) {
        setData('attendance', { ...data.attendance, [studentId]: value });
    }

    function submit(e, state) {
        e.preventDefault();
        setData('state', state);
        post('/leader/meetings', { onSuccess: onClose });
    }

    const inp = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', width: '620px', maxWidth: '96vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Log Meeting</h3>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Date + time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Date</label>
                            <input type="date" value={data.meeting_date} onChange={(e) => setData('meeting_date', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Time (optional)</label>
                            <input type="time" value={data.meeting_time} onChange={(e) => setData('meeting_time', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                    </div>

                    {/* Agenda builder */}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                            Agenda Items
                            {suggestedStudents.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--destructive)', marginLeft: '8px' }}>⚠ {suggestedStudents.length} students need attention</span>}
                        </label>
                        {suggestedStudents.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                                {suggestedStudents.map((s) => (
                                    <button key={s.id} type="button" onClick={() => { setData('agenda_items', [...data.agenda_items, `Follow up: ${s.name}`]); }} style={{ ...inp, fontSize: '0.75rem', cursor: 'pointer', padding: '3px 8px', background: 'oklch(95% 0.04 20)' }}>
                                        + {s.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input value={newAgendaItem} onChange={(e) => setNewAgendaItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAgendaItem())} placeholder="Add agenda item…" style={{ ...inp, flex: 1 }} />
                            <button type="button" onClick={addAgendaItem} style={{ padding: '6px 12px', border: 'none', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Add</button>
                        </div>
                        {data.agenda_items.length > 0 && (
                            <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                                {data.agenda_items.map((item, i) => (
                                    <li key={i} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {item}
                                        <button type="button" onClick={() => removeAgendaItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontSize: '0.875rem' }}>×</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Attendance */}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Attendance</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                            {allStudents.map((s) => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                                    <span style={{ flex: 1, fontSize: '0.875rem' }}>{s.name}</span>
                                    {['present', 'absent', 'excused'].map((v) => (
                                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                                            <input type="radio" name={`att-${s.id}`} value={v} checked={data.attendance[s.id] === v} onChange={() => setAttendance(s.id, v)} />
                                            {OUTCOME_LABEL[v]}
                                        </label>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action items */}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Action Items</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                            <select value={newAction.student_id} onChange={(e) => setNewAction({ ...newAction, student_id: e.target.value })} style={{ ...inp }}>
                                <option value="">Student…</option>
                                {allStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <input type="date" value={newAction.due_date} onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })} style={{ ...inp }} />
                            <input value={newAction.description} onChange={(e) => setNewAction({ ...newAction, description: e.target.value })} placeholder="Action description…" style={{ ...inp }} />
                            <button type="button" onClick={addAction} style={{ padding: '6px 12px', border: 'none', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Add</button>
                        </div>
                        {data.action_items.map((item, i) => (
                            <div key={i} style={{ fontSize: '0.8125rem', padding: '3px 0', color: 'var(--foreground)' }}>
                                {allStudents.find((s) => String(s.id) === String(item.student_id))?.name ?? '?'}: {item.description} {item.due_date && `(by ${item.due_date})`}
                            </div>
                        ))}
                    </div>

                    {/* Notes + Highlights + Concerns */}
                    {[['notes', 'General Notes'], ['highlights', 'Highlights'], ['concerns', 'Concerns']].map(([key, label]) => (
                        <div key={key}>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{label}</label>
                            <textarea value={data[key]} onChange={(e) => setData(key, e.target.value)} rows={2} style={{ ...inp, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="button" onClick={(e) => submit(e, 'draft')} disabled={processing} style={{ padding: '7px 16px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Save Draft</button>
                        <button type="button" onClick={(e) => submit(e, 'final')} disabled={processing} style={{ padding: '7px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Finalise</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Meetings({ meetings, open_actions, halqa, suggested_students, all_students }) {
    const [showNew, setShowNew] = useState(false);

    return (
        <LeaderLayout title={`Meetings · ${halqa?.name ?? ''}`}>
            <Head title="Meeting Log" />

            {/* Open action items */}
            {open_actions?.length > 0 && (
                <div style={{ marginBottom: '16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Open Action Items ({open_actions.length})</span>
                        <span style={{ fontSize: '0.75rem', color: open_actions.some((a) => a.overdue) ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
                            {open_actions.filter((a) => a.overdue).length} overdue
                        </span>
                    </div>
                    {open_actions.map((a) => <ActionItemRow key={a.id} item={a} />)}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Meeting Log ({meetings.length})</h2>
                <button onClick={() => setShowNew(true)} style={{ padding: '7px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                    + Log Meeting
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {meetings.length === 0
                    ? <div style={{ padding: '40px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>No meetings logged yet.</div>
                    : meetings.map((m) => <MeetingCard key={m.id} meeting={m} allStudents={all_students} />)
                }
            </div>

            {showNew && <NewMeetingForm suggestedStudents={suggested_students} allStudents={all_students} onClose={() => setShowNew(false)} />}
        </LeaderLayout>
    );
}
