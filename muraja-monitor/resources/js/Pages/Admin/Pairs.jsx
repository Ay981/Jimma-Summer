import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const PAIRS_CSS = `
.pairs-row { display:grid; gap:10px; padding:10px 14px; align-items:center; border-bottom:1px solid var(--border); }
.pairs-row.normal { grid-template-columns: 1fr 1fr 80px 90px auto auto auto; }
.pairs-row.scored { grid-template-columns: 1fr 1fr 80px 90px 60px auto auto auto; }
.pairs-col-halqa, .pairs-col-last { display:block; }
@media (max-width:640px) {
  .pairs-row.normal { grid-template-columns: 1fr 1fr auto auto; }
  .pairs-row.scored { grid-template-columns: 1fr 1fr auto auto; }
  .pairs-col-halqa, .pairs-col-last, .pairs-col-cons { display:none; }
}
`;

const SLOT_LABELS = {
    after_subhi: 'Fajr', after_zuhr: 'Dhuhr',
    after_asr: 'Asr', after_maghrib: 'Maghrib', after_isha: 'Isha',
};

// ── All pairs list ────────────────────────────────────────────────────────────

function PairRow({ pair, showScore = false }) {
    function del() {
        if (!confirm('Delete this pair?')) return;
        router.delete(`/admin/pairs/${pair.id}`, { preserveScroll: true });
    }

    return (
        <div className={`pairs-row ${showScore ? 'scored' : 'normal'}`} style={{ background: pair.needs_review ? 'var(--status-slipping-bg)' : 'transparent' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pair.student_a.name}</span>
            <span style={{ fontSize: '0.875rem', color: pair.student_b ? 'var(--foreground)' : 'var(--muted-foreground)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pair.student_b ? pair.student_b.name : '— solo —'}
            </span>
            <span className="pairs-col-halqa" style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{pair.halqa}</span>
            <span className="pairs-col-cons" style={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{pair.consistency}%</span>
            {showScore && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '99px', background: 'var(--status-slipping-bg)', color: 'var(--status-slipping)', textAlign: 'center' }}>
                    {pair.compatibility_score ?? '—'}
                </span>
            )}
            <span className="pairs-col-last" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                {pair.last_sub ? new Date(pair.last_sub).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never'}
            </span>
            <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: pair.status === 'active' ? 'var(--success)' : 'var(--muted)', color: pair.status === 'active' ? 'var(--success-foreground)' : 'var(--muted-foreground)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {pair.status}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => router.get(`/admin/pairs/${pair.id}`)} style={{ padding: '3px 8px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 500 }}>Details</button>
                <button onClick={del} style={{ padding: '3px 8px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer' }}>×</button>
            </div>
        </div>
    );
}

// ── Pair requests ─────────────────────────────────────────────────────────────

function RequestRow({ req }) {
    function approve() { router.post(`/admin/pairs/requests/${req.id}/approve`, {}, { preserveScroll: true }); }
    function reject()  { router.post(`/admin/pairs/requests/${req.id}/reject`,  {}, { preserveScroll: true }); }

    return (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
            <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{req.student.name}</p>
                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{req.student.phone}</p>
            </div>
            <div>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Requested: <strong>{req.requested_partner_name}</strong></p>
                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{req.requested_partner_phone}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={approve} style={{ padding: '5px 12px', border: 'none', background: 'var(--success)', color: 'var(--success-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                <button onClick={reject}  style={{ padding: '5px 12px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Reject</button>
            </div>
        </div>
    );
}

// ── Assignment UI (with swap) ─────────────────────────────────────────────────

function SlotTag({ slot }) {
    return (
        <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--secondary)', color: 'var(--secondary-foreground)', fontWeight: 600 }}>
            {SLOT_LABELS[slot] ?? slot}
        </span>
    );
}

function AssignmentPanel({ suggested: initialSuggested, noMatch, halqas }) {
    const [pairs, setPairs]       = useState(initialSuggested.map((p, i) => ({ ...p, _key: i })));
    const [selected, setSelected] = useState(null);

    function selectStudent(pairIdx, side) {
        if (!selected) { setSelected({ pairIdx, side }); return; }
        if (selected.pairIdx === pairIdx && selected.side === side) { setSelected(null); return; }
        const newPairs = [...pairs];
        const from = { ...newPairs[selected.pairIdx] };
        const to   = { ...newPairs[pairIdx] };
        const temp = from['student_' + selected.side];
        from['student_' + selected.side] = to['student_' + side];
        to['student_' + side] = temp;
        from.shared_slots = from.student_a.available_times.filter((s) => from.student_b.available_times.includes(s));
        to.shared_slots   = to.student_a.available_times.filter((s) => to.student_b.available_times.includes(s));
        newPairs[selected.pairIdx] = from;
        newPairs[pairIdx] = to;
        setPairs(newPairs);
        setSelected(null);
    }

    function confirm() {
        const payload = pairs.map((p) => ({ a: p.student_a.id, b: p.student_b.id, halqa_id: p.halqa_id || null }));
        router.post('/admin/pairs/confirm-assignment', { pairs: payload });
    }

    if (pairs.length === 0) {
        return <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', padding: '20px 0' }}>No suggested pairs. All active students may already be assigned.</p>;
    }

    // Group pairs by halqa for clarity
    const halqaMap = Object.fromEntries(halqas.map((h) => [h.id, h.name]));
    const grouped = pairs.reduce((acc, pair, i) => {
        const key = pair.halqa_id ?? '__none__';
        if (!acc[key]) acc[key] = [];
        acc[key].push({ ...pair, _realIdx: i });
        return acc;
    }, {});

    return (
        <div>
            <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Click a student name to select, then click another to swap them between pairs. Shared time slots are highlighted. Pairs are grouped by halqa.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '16px' }}>
                {Object.entries(grouped).map(([halqaKey, groupPairs]) => (
                    <div key={halqaKey}>
                        <p style={{ margin: '0 0 8px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>
                            {halqaKey === '__none__' ? 'No halqa assigned' : (halqaMap[halqaKey] ?? `Halqa ${halqaKey}`)}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {groupPairs.map((pair) => {
                                const i = pair._realIdx;
                                return (
                                    <div key={pair._key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                        {['a', 'b'].map((side) => {
                                            const s = pair['student_' + side];
                                            const isSelected = selected?.pairIdx === i && selected?.side === side;
                                            return (
                                                <button key={side} onClick={() => selectStudent(i, side)} style={{
                                                    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                                                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                                    background: isSelected ? 'var(--secondary)' : 'transparent',
                                                    cursor: 'pointer', fontWeight: isSelected ? 700 : 500,
                                                    fontSize: '0.875rem', color: 'var(--foreground)',
                                                }}>
                                                    {s.name}
                                                </button>
                                            );
                                        })}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Shared:</span>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {pair.shared_slots.map((slot) => <SlotTag key={slot} slot={slot} />)}
                                            {pair.shared_slots.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--destructive)' }}>No shared slots</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {noMatch.length > 0 && (
                <div style={{ padding: '10px 12px', background: 'var(--muted)', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>No compatible match found ({noMatch.length}):</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {noMatch.map((s) => (
                            <span key={s.id} style={{ fontSize: '0.8125rem', padding: '3px 8px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>{s.name}</span>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={confirm} style={{ padding: '9px 20px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
                Confirm & Create {pairs.length} Pair{pairs.length !== 1 ? 's' : ''}
            </button>
        </div>
    );
}

// ── Create Pair form ─────────────────────────────────────────────────────────

function CreatePairForm({ students, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        student_a_id: '',
        student_b_id: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/pairs', { preserveScroll: true, onSuccess: onClose });
    }

    const selectStyle = {
        width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', background: 'var(--background)',
        color: 'var(--foreground)', fontSize: '0.875rem',
    };

    return (
        <form onSubmit={submit} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
        }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 700 }}>Create New Pair</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Student A</label>
                    <select
                        value={data.student_a_id}
                        onChange={e => setData('student_a_id', e.target.value)}
                        style={selectStyle}
                        required
                    >
                        <option value="">— Select —</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}{s.halqa ? ` · ${s.halqa}` : ''}</option>)}
                    </select>
                    {errors.student_a_id && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.student_a_id}</p>}
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Student B</label>
                    <select
                        value={data.student_b_id}
                        onChange={e => setData('student_b_id', e.target.value)}
                        style={selectStyle}
                        required
                        disabled={!data.student_a_id}
                    >
                        <option value="">{data.student_a_id ? '— Select —' : '— Pick Student A first —'}</option>
                        {students
                            .filter(s => s.id !== Number(data.student_a_id))
                            .map(s => <option key={s.id} value={s.id}>{s.name}{s.halqa ? ` · ${s.halqa}` : ''}</option>)
                        }
                    </select>
                    {errors.student_b_id && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.student_b_id}</p>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="submit" disabled={processing} style={{
                        padding: '7px 16px', border: 'none', background: 'var(--primary)',
                        color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)',
                        fontWeight: 700, fontSize: '0.875rem', cursor: processing ? 'not-allowed' : 'pointer',
                        opacity: processing ? 0.7 : 1,
                    }}>
                        {processing ? 'Creating…' : 'Create'}
                    </button>
                    <button type="button" onClick={onClose} style={{
                        padding: '7px 12px', border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--foreground)', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem', cursor: 'pointer',
                    }}>
                        Cancel
                    </button>
                </div>
            </div>
            {errors.error && <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: 'var(--destructive)' }}>{errors.error}</p>}
        </form>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Pairs({ pairs, requests, suggested, no_match, halqas, students, unassigned }) {
    const [tab, setTab] = useState('All Pairs');
    const [showCreate, setShowCreate] = useState(false);

    const needsReview   = pairs.filter(p => p.needs_review);
    const unpairedCount = (pairs.filter(p => p.status === 'solo').length) + ((unassigned ?? []).length);

    const tabs = [
        { key: 'All Pairs',    count: pairs.length },
        { key: 'Needs Review', count: needsReview.length, warn: needsReview.length > 0 },
        { key: 'Requests',     count: requests.filter((r) => r).length },
        { key: 'Assignment',   count: unpairedCount, warn: unpairedCount > 0 },
        { key: 'Change Requests', count: null, action: () => router.get('/admin/pair-changes') },
    ];

    return (
        <AdminLayout title="Pair Management">
            <Head title="Pairs" />
            <style>{PAIRS_CSS}</style>

            {/* Summary */}
            <div className="stat-grid" style={{ marginBottom: '20px' }}>
                {[
                    { label: 'Total pairs',      value: pairs.length },
                    { label: 'Active',           value: pairs.filter((p) => p.status === 'active').length },
                    { label: 'Unpaired students', value: unpairedCount, warn: unpairedCount > 0 },
                    { label: 'Pending requests', value: requests.length, warn: requests.length > 0 },
                ].map(({ label, value, warn }) => (
                    <div key={label} style={{ padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'baseline', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: warn ? 'var(--destructive)' : 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Tabs: desktop row / mobile select */}
            <div style={{ marginBottom: '16px' }}>
                <div className="tab-row-desktop">
                    {tabs.map(({ key, count, warn, action }) => (
                        <button key={key} onClick={() => action ? action() : setTab(key)} style={{
                            padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer',
                            background: tab === key ? (warn ? 'var(--status-at-risk)' : 'var(--primary)') : 'var(--card)',
                            color: tab === key ? 'var(--warm-50)' : (warn ? 'var(--status-at-risk)' : 'var(--foreground)'),
                            fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem',
                            borderColor: warn && tab !== key ? 'var(--status-at-risk-border)' : 'var(--border)',
                        }}>
                            {key}{count != null ? ` (${count})` : ''}
                        </button>
                    ))}
                </div>
                <select
                    className="tab-select-mobile"
                    value={tab}
                    onChange={(e) => {
                        const found = tabs.find(t => t.key === e.target.value);
                        if (found?.action) found.action();
                        else setTab(e.target.value);
                    }}
                >
                    {tabs.map(({ key, count }) => (
                        <option key={key} value={key}>{key}{count != null ? ` (${count})` : ''}</option>
                    ))}
                </select>
            </div>

            {/* All Pairs */}
            {tab === 'All Pairs' && (
                <>
                {!showCreate && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                        <button onClick={() => setShowCreate(true)} style={{
                            padding: '7px 16px', border: 'none', background: 'var(--primary)',
                            color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)',
                            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                        }}>
                            + Create Pair
                        </button>
                    </div>
                )}
                {showCreate && (
                    <CreatePairForm students={students} onClose={() => setShowCreate(false)} />
                )}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}>
                    {/* Column headers — same grid class as rows for alignment */}
                    <div className="pairs-row normal" style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)', background: 'oklch(97% 0.005 0)' }}>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student A</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student B</span>
                        <span className="pairs-col-halqa" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Halqa</span>
                        <span className="pairs-col-cons" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consistency</span>
                        <span className="pairs-col-last" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sub</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                        <span />
                    </div>
                    {pairs.length === 0
                        ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No pairs yet.</p>
                        : pairs.map((p) => <PairRow key={p.id} pair={p} />)
                    }
                </div>
                </>
            )}

            {/* Needs Review */}
            {tab === 'Needs Review' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {needsReview.length === 0 ? (
                        <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No pairs flagged for review.</p>
                    ) : (
                        <>
                        <div style={{ padding: '10px 14px', background: 'oklch(96% 0.04 50)', border: '1px solid oklch(82% 0.1 50)', borderRadius: 'var(--radius-lg)', fontSize: '0.8125rem', color: 'var(--status-slipping)' }}>
                            🔶 These pairs were created but have a low compatibility score (≤ 4 out of 18). Consider swapping partners where possible.
                        </div>
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}>
                            <div className="pairs-row scored" style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)', background: 'oklch(97% 0.005 0)' }}>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student A</span>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student B</span>
                                <span className="pairs-col-halqa" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Halqa</span>
                                <span className="pairs-col-cons" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cons.</span>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</span>
                                <span className="pairs-col-last" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sub</span>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                                <span />
                            </div>
                            {needsReview.map((p) => <PairRow key={p.id} pair={p} showScore />)}
                        </div>
                        </>
                    )}
                </div>
            )}

            {/* Pair Requests */}
            {tab === 'Requests' && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', padding: '6px 14px', borderBottom: '1px solid var(--border)' }}>
                        {['Student', 'Requested Partner', 'Actions'].map((h) => (
                            <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                        ))}
                    </div>
                    {requests.length === 0
                        ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No pending requests.</p>
                        : requests.map((r) => <RequestRow key={r.id} req={r} />)
                    }
                </div>
            )}

            {/* Assignment */}
            {tab === 'Assignment' && (
                <AssignmentPanel suggested={suggested} noMatch={no_match} halqas={halqas} />
            )}
        </AdminLayout>
    );
}
