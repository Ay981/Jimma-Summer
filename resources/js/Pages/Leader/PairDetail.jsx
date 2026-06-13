import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import LeaderLayout from '@/Layouts/LeaderLayout';
import Heatmap from '@/Components/UI/Heatmap';

// ── Escalate modal ────────────────────────────────────────────────────────────

function EscalateModal({ studentId, pairId, onClose }) {
    const { data, setData, post, processing } = useForm({ note_summary: '' });

    function submit(e) {
        e.preventDefault();
        if (!data.note_summary.trim()) return;
        post(`/leader/escalate/${studentId}`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600 }}
            onClick={onClose}
        >
            <div
                style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', width: '380px', maxWidth: '95vw' }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>Escalate to Admin</h3>
                <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    A flag will appear in admin outreach with your summary. The contact log will not be duplicated.
                </p>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                        value={data.note_summary}
                        onChange={(e) => setData('note_summary', e.target.value)}
                        placeholder="Brief summary for admin..."
                        rows={3}
                        required
                        style={{
                            padding: '7px 10px', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', background: 'var(--background)',
                            color: 'var(--foreground)', fontSize: '0.8125rem',
                            resize: 'vertical', fontFamily: 'inherit',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '6px 14px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '6px 14px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer' }}>
                            Escalate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
                    data-onboard="flag-btn"
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

function AddContactForm({ studentId, pairId }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        student_id:         studentId,
        method:             'call',
        note:               '',
        follow_up_required: false,
        contacted_at:       new Date().toISOString().slice(0, 16),
        snooze_days:        '',
        outcome:            'pending',
    });
    const [showEscalate, setShowEscalate] = useState(false);

    function submit(e) {
        e.preventDefault();
        post(`/leader/members/${pairId}/contact`, {
            preserveScroll: true,
            onSuccess: () => reset('note', 'snooze_days'),
        });
    }

    const s = { padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' };

    return (
        <>
        <form onSubmit={submit} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Row 1: method / datetime / outcome */}
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

            {/* Note textarea */}
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

            {/* Row 3: follow-up checkbox + snooze + buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.8125rem', display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <input
                        type="checkbox"
                        checked={data.follow_up_required}
                        onChange={(e) => setData('follow_up_required', e.target.checked)}
                    />
                    Follow-up needed
                </label>

                {/* Snooze input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', flexShrink: 0 }}>
                        Snooze
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="90"
                        value={data.snooze_days}
                        onChange={(e) => setData('snooze_days', e.target.value)}
                        placeholder="days"
                        style={{
                            width: '60px', padding: '4px 6px',
                            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                            background: 'var(--background)', color: 'var(--foreground)',
                            fontSize: '0.8125rem',
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>days</span>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                    {/* Escalate button */}
                    <button
                        type="button"
                        onClick={() => setShowEscalate(true)}
                        style={{
                            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--destructive)', background: 'transparent',
                            color: 'var(--destructive)', fontSize: '0.8125rem',
                            fontWeight: 500, cursor: 'pointer',
                        }}
                    >
                        ⚑ Escalate
                    </button>

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
            </div>

            {errors.note && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.note}</p>}
        </form>

        {showEscalate && (
            <EscalateModal
                studentId={studentId}
                pairId={pairId}
                onClose={() => setShowEscalate(false)}
            />
        )}
        </>
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

// ── Pair Change Request modal ─────────────────────────────────────────────────

function PairChangeModal({ student, partnerName, pairId, allStudents, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        student_id:           student.id,
        reason:               '',
        requested_partner_id: '',
    });
    const [search, setSearch] = useState('');

    function submit(e) {
        e.preventDefault();
        post(`/leader/members/${pairId}/pair-change`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    const filtered = allStudents.filter(s =>
        s.id !== student.id &&
        (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase()))
    );

    const selected = allStudents.find(s => s.id === Number(data.requested_partner_id));
    const halqaMatch = selected ? selected.halqa_id === student.halqa_id : null;
    const typeLabel  = selected
        ? (halqaMatch ? 'Same halqa' : '⚠ Cross-halqa')
        : 'No preference — admin will find a match';

    const inp = {
        padding: '7px 10px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', background: 'var(--background)',
        color: 'var(--foreground)', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box',
    };

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: '16px' }}
            onClick={onClose}
        >
            <div
                style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>Request Pair Change</p>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--muted-foreground)' }}>✕</button>
                </div>

                <form onSubmit={submit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Pre-filled info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Student</label>
                            <div style={{ ...inp, background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{student.name}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Current partner</label>
                            <div style={{ ...inp, background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{partnerName ?? '— solo —'}</div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Reason *</label>
                        <textarea
                            value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                            rows={3} required
                            placeholder="Describe why a pair change is needed…"
                            style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                        />
                        {errors.reason && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.reason}</p>}
                    </div>

                    {/* Requested partner search */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                            Requested partner <span style={{ fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Search by name or student ID…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ ...inp, marginBottom: '6px' }}
                        />
                        {search && (
                            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxHeight: '160px', overflowY: 'auto' }}>
                                {filtered.length === 0 ? (
                                    <p style={{ padding: '10px', margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>No students found.</p>
                                ) : filtered.slice(0, 20).map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => { setData('requested_partner_id', s.id); setSearch(s.name); }}
                                        style={{
                                            display: 'block', width: '100%', padding: '8px 12px', border: 'none',
                                            background: Number(data.requested_partner_id) === s.id ? 'var(--muted)' : 'transparent',
                                            textAlign: 'left', cursor: 'pointer', fontSize: '0.8125rem',
                                            borderBottom: '1px solid var(--border)',
                                        }}
                                    >
                                        {s.name} <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>· {s.student_id}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selected && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: halqaMatch ? 'oklch(38% 0.14 145)' : 'var(--destructive)' }}>
                                    Type: {typeLabel}
                                </span>
                                <button type="button" onClick={() => { setData('requested_partner_id', ''); setSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Clear</button>
                            </div>
                        )}
                        {!selected && (
                            <p style={{ margin: '4px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                                Leave blank — admin will find a suitable match.
                            </p>
                        )}
                    </div>

                    {errors.error && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--destructive)' }}>{errors.error}</p>}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 14px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '7px 16px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                            {processing ? 'Escalating…' : 'Escalate to Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Student panel ─────────────────────────────────────────────────────────────

function StudentPanel({ student, pairId, partnerName, allStudents }) {
    const [section, setSection]           = useState('history');
    const [showPairChange, setShowPairChange] = useState(false);

    const sections = [
        { key: 'history',  label: 'History' },
        { key: 'contact',  label: 'Contact Log' },
        { key: 'excuses',  label: `Excuses${student.excuses?.length ? ` (${student.excuses.length})` : ''}` },
        { key: 'notes',    label: 'Private Notes' },
        { key: 'info',     label: 'Info' },
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
                            background: student.on_watchlist ? 'var(--status-slipping-bg)' : 'transparent',
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
            <div data-onboard="student-heatmap" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
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
                <div data-onboard="contact-log">
                    {/* Pair change request trigger */}
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowPairChange(true)}
                            style={{ padding: '5px 12px', border: '1px solid var(--status-slipping-border)', background: 'var(--status-slipping-bg)', color: 'var(--status-slipping)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                            ⇄ Request Pair Change
                        </button>
                    </div>
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

            {section === 'excuses' && (
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(student.excuses ?? []).length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)', textAlign: 'center', padding: '20px 0' }}>No excuses filed.</p>
                    ) : (student.excuses ?? []).map((e, i) => (
                        <div key={i} style={{
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            background: e.fulfilled ? 'var(--muted)' : 'oklch(96% 0.05 50)',
                            border: `1px solid ${e.fulfilled ? 'var(--border)' : 'oklch(82% 0.1 50)'}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                    Missed {new Date(e.missed_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span style={{
                                    fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
                                    background: e.fulfilled ? 'var(--success)' : 'oklch(88% 0.1 50)',
                                    color: e.fulfilled ? 'var(--success-foreground)' : 'var(--status-slipping)',
                                }}>
                                    {e.fulfilled ? '✓ Made up' : 'Pending'}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                Reason: {e.reason}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                Makeup due: {new Date(e.makeup_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {section === 'notes' && (
                <PrivateNoteEditor
                    studentId={student.id}
                    pairId={pairId}
                    initialNote={student.private_note}
                />
            )}

            {section === 'info' && (
                <div style={{ padding: '14px 16px' }}>
                    {/* Last login */}
                    <p style={{ margin: '0 0 12px', fontSize: '0.8125rem' }}>
                        <strong>Last login:</strong>{' '}
                        <span style={{ color: 'var(--muted-foreground)' }}>{student.last_login}</span>
                    </p>

                    {/* Notification delivery log */}
                    <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                        Recent Notifications
                    </p>
                    {(student.notif_log ?? []).length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>No notifications sent yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {student.notif_log.map((n) => (
                                <div key={n.id} style={{
                                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                                    background: 'var(--muted)', fontSize: '0.8125rem',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <span style={{ color: 'var(--foreground)', flex: 1 }}>{n.message}</span>
                                        <span style={{
                                            fontSize: '0.6875rem', padding: '1px 6px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: n.seen_at ? 'var(--success)' : 'var(--secondary)',
                                            color: n.seen_at ? 'var(--success-foreground)' : 'var(--secondary-foreground)',
                                            flexShrink: 0, fontWeight: 600,
                                        }}>
                                            {n.seen_at ? 'Seen' : 'Unseen'}
                                        </span>
                                    </div>
                                    <p style={{ margin: '3px 0 0', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                                        Sent {n.sent_at}
                                        {n.seen_at && ` · Seen ${n.seen_at}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Pair change modal */}
            {showPairChange && (
                <PairChangeModal
                    student={student}
                    partnerName={partnerName}
                    pairId={pairId}
                    allStudents={allStudents}
                    onClose={() => setShowPairChange(false)}
                />
            )}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PairDetail({ pair, halqa, all_students }) {
    const students = pair?.students ?? [];

    return (
        <LeaderLayout title={`Pair · ${students.map((s) => s.name.split(' ')[0]).join(' & ')}`}>
            <Head title="Pair Detail" />

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                    href="/leader/dashboard"
                    style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', textDecoration: 'none' }}
                >
                    ← {halqa?.name ?? 'Dashboard'}
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
                {students.map((student) => {
                    const partner = students.find(s => s.id !== student.id);
                    return (
                        <StudentPanel
                            key={student.id}
                            student={student}
                            pairId={pair.id}
                            partnerName={partner?.name ?? null}
                            allStudents={all_students ?? []}
                        />
                    );
                })}
            </div>
        </LeaderLayout>
    );
}
