import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';
import Heatmap from '@/Components/UI/Heatmap';

// ── History card (transaction aesthetic) ─────────────────────────────────────

function HistoryCard({ entry, pairId }) {
    const [verdict, setVerdict] = useState(entry.flag_verdict ?? null);

    function submitVerdict(v) {
        router.post(`/leader/members/${pairId}/submissions/${entry.id}/review`, { verdict: v }, {
            preserveScroll: true,
            onSuccess: () => setVerdict(v),
        });
    }

    function toggleFlag() {
        router.post(`/leader/members/${pairId}/submissions/${entry.id}/flag`, {}, {
            preserveScroll: true,
        });
    }

    const verdictColor = verdict === 'verified'
        ? 'var(--success)'
        : verdict === 'rejected'
        ? 'var(--destructive)'
        : null;

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
        }}>
            {/* Date column */}
            <div style={{ minWidth: '54px', textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(entry.submission_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>
                    {entry.submitted_at}
                </p>
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                    Juz {entry.juz} · pp. {entry.page_from}–{entry.page_to}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {entry.pages} pages · {entry.minutes_spent} min
                </p>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {entry.is_edited && (
                    <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        edited
                    </span>
                )}
                {entry.is_flagged && (
                    <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'oklch(83% 0.12 50 / 0.2)', color: 'oklch(50% 0.12 50)' }}>
                        flagged
                    </span>
                )}
                {verdict && (
                    <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: verdictColor + '22', color: verdictColor, fontWeight: 600 }}>
                        {verdict}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '4px' }}>
                <button
                    onClick={toggleFlag}
                    title={entry.is_flagged ? 'Remove flag' : 'Flag for review'}
                    style={{
                        padding: '4px 7px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)', background: 'transparent',
                        fontSize: '0.6875rem', cursor: 'pointer', color: 'var(--muted-foreground)',
                    }}
                >
                    {entry.is_flagged ? '⚑' : '⚐'}
                </button>
                {entry.is_flagged && !verdict && (
                    <>
                        <button
                            onClick={() => submitVerdict('verified')}
                            style={{
                                padding: '4px 7px', borderRadius: 'var(--radius-sm)',
                                border: 'none', background: 'var(--success)',
                                color: 'var(--success-foreground)', fontSize: '0.6875rem',
                                cursor: 'pointer', fontWeight: 600,
                            }}
                        >
                            Verify
                        </button>
                        <button
                            onClick={() => submitVerdict('rejected')}
                            style={{
                                padding: '4px 7px', borderRadius: 'var(--radius-sm)',
                                border: 'none', background: 'var(--destructive)',
                                color: 'var(--destructive-foreground)', fontSize: '0.6875rem',
                                cursor: 'pointer', fontWeight: 600,
                            }}
                        >
                            Reject
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Contact log entry ─────────────────────────────────────────────────────────

function ContactEntry({ entry }) {
    const METHOD_LABEL = { call: 'Call', message: 'Message', in_person: 'In Person' };
    return (
        <div style={{
            padding: '10px 12px', borderBottom: '1px solid var(--border)',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
            <div style={{ minWidth: '70px' }}>
                <span style={{
                    fontSize: '0.6875rem', padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)', background: 'var(--secondary)',
                    color: 'var(--secondary-foreground)', fontWeight: 600,
                }}>
                    {METHOD_LABEL[entry.method] ?? entry.method}
                </span>
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.8125rem' }}>{entry.note}</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                    {entry.contacted_at}
                    {entry.follow_up_required && ' · Follow-up needed'}
                </p>
            </div>
        </div>
    );
}

// ── Add contact note form ─────────────────────────────────────────────────────

function AddContactForm({ studentId, pairId, onEscalate }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        student_id:         studentId,
        method:             'call',
        note:               '',
        follow_up_required: false,
        contacted_at:       new Date().toISOString().slice(0, 16),
        snooze_days:        '',
        outcome:            'pending',
    });

    function submit(e) {
        e.preventDefault();
        post(`/leader/members/${pairId}/contact`, {
            preserveScroll: true,
            onSuccess: () => reset('note', 'snooze_days'),
        });
    }

    const s = { padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' };

    return (
        <form onSubmit={submit} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <select value={data.method} onChange={(e) => setData('method', e.target.value)} style={s}>
                    <option value="call">Call</option>
                    <option value="message">Message</option>
                    <option value="in_person">In Person</option>
                </select>
                <input type="datetime-local" value={data.contacted_at} onChange={(e) => setData('contacted_at', e.target.value)} style={{ ...s, flex: 1 }} />
                <select value={data.outcome} onChange={(e) => setData('outcome', e.target.value)} style={s}>
                    <option value="pending">Pending</option>
                    <option value="responded">Responded</option>
                    <option value="no_response">No Response</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                </select>
            </div>
            <textarea
                value={data.note}
                onChange={(e) => setData('note', e.target.value)}
                placeholder="Contact note..."
                rows={2}
                required
                style={{
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', background: 'var(--background)',
                    color: 'var(--foreground)', fontSize: '0.8125rem',
                    resize: 'vertical', fontFamily: 'inherit',
                }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.8125rem', display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={data.follow_up_required}
                        onChange={(e) => setData('follow_up_required', e.target.checked)}
                    />
                    Follow-up needed
                </label>
                <button
                    type="submit"
                    disabled={processing}
                    style={{
                        padding: '6px 16px', borderRadius: 'var(--radius-sm)',
                        border: 'none', background: 'var(--primary)',
                        color: 'var(--primary-foreground)', fontSize: '0.8125rem',
                        fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer',
                    }}
                >
                    Add note
                </button>
            </div>
            {errors.note && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.note}</p>}
        </form>
    );
}

// ── Private note editor ───────────────────────────────────────────────────────

function PrivateNoteEditor({ studentId, pairId, initialNote }) {
    const [note, setNote]     = useState(initialNote ?? '');
    const [saved, setSaved]   = useState(false);

    function save() {
        router.put(`/leader/members/${pairId}/note/${studentId}`, { note }, {
            preserveScroll: true,
            onSuccess: () => setSaved(true),
        });
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div style={{ padding: '12px' }}>
            <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); setSaved(false); }}
                placeholder="Private notes about this student (only visible to you)..."
                rows={4}
                style={{
                    width: '100%', padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--background)', color: 'var(--foreground)',
                    fontSize: '0.8125rem', resize: 'vertical', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                    onClick={save}
                    style={{
                        padding: '5px 14px', borderRadius: 'var(--radius-sm)',
                        border: 'none', background: saved ? 'var(--success)' : 'var(--primary)',
                        color: saved ? 'var(--success-foreground)' : 'var(--primary-foreground)',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                >
                    {saved ? 'Saved ✓' : 'Save'}
                </button>
            </div>
        </div>
    );
}

// ── Student panel ─────────────────────────────────────────────────────────────

function StudentPanel({ student, pairId }) {
    const [section, setSection] = useState('history');

    const sections = [
        { key: 'history',  label: 'History' },
        { key: 'contact',  label: 'Contact Log' },
        { key: 'notes',    label: 'Private Notes' },
    ];

    function toggleWatchlist() {
        router.post(`/leader/members/${pairId}/watchlist/${student.id}`, {}, {
            preserveScroll: true,
        });
    }

    function resetPassword() {
        if (!confirm(`Reset ${student.name}'s password to the default?`)) return;
        router.post(`/leader/students/${student.id}/reset-password`, {}, {
            preserveScroll: true,
        });
    }

    return (
        <div style={{
            background: 'var(--card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{student.name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        ID: {student.student_id}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={toggleWatchlist}
                        style={{
                            padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            background: student.on_watchlist ? 'oklch(83% 0.12 50 / 0.15)' : 'transparent',
                            color: student.on_watchlist ? 'oklch(50% 0.12 50)' : 'var(--foreground)',
                            fontSize: '0.75rem', cursor: 'pointer', fontWeight: student.on_watchlist ? 600 : 400,
                        }}
                    >
                        {student.on_watchlist ? '★ Watchlist' : '☆ Watchlist'}
                    </button>
                    <button
                        onClick={resetPassword}
                        style={{
                            padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--muted-foreground)', fontSize: '0.75rem', cursor: 'pointer',
                        }}
                    >
                        Reset password
                    </button>
                </div>
            </div>

            {/* Heatmap */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                    30-Day Activity
                </p>
                <Heatmap data={student.heatmap} />
            </div>

            {/* Section tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {sections.map((s) => (
                    <button
                        key={s.key}
                        onClick={() => setSection(s.key)}
                        style={{
                            flex: 1, padding: '9px 8px', border: 'none',
                            background: section === s.key ? 'var(--secondary)' : 'transparent',
                            color: section === s.key ? 'var(--primary)' : 'var(--muted-foreground)',
                            fontWeight: section === s.key ? 600 : 400, fontSize: '0.8125rem',
                            cursor: 'pointer', borderBottom: section === s.key ? '2px solid var(--primary)' : '2px solid transparent',
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Section content */}
            {section === 'history' && (
                <div>
                    {student.history.length === 0 ? (
                        <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
                            No submissions yet.
                        </p>
                    ) : (
                        student.history.map((entry) => (
                            <HistoryCard key={entry.id} entry={entry} pairId={pairId} />
                        ))
                    )}
                </div>
            )}

            {section === 'contact' && (
                <div>
                    <AddContactForm studentId={student.id} pairId={pairId} />
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                        {student.contact_logs.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
                                No contact logs yet.
                            </p>
                        ) : (
                            student.contact_logs.map((entry) => (
                                <ContactEntry key={entry.id} entry={entry} />
                            ))
                        )}
                    </div>
                </div>
            )}

            {section === 'notes' && (
                <PrivateNoteEditor
                    studentId={student.id}
                    pairId={pairId}
                    initialNote={student.private_note}
                />
            )}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PairDetail({ pair, halqa }) {
    const students = pair?.students ?? [];

    return (
        <LeaderLayout title={`Pair · ${students.map((s) => s.name.split(' ')[0]).join(' & ')}`}>
            <Head title="Pair Detail" />

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                    href="/leader/dashboard"
                    style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}
                >
                    ← Dashboard
                </Link>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--foreground)', fontWeight: 500 }}>
                    {students.map((s) => s.name).join(' & ')}
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '16px',
            }}>
                {students.map((student) => (
                    <StudentPanel key={student.id} student={student} pairId={pair.id} />
                ))}
            </div>
        </LeaderLayout>
    );
}
