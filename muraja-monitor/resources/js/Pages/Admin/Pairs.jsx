import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import StatusTag from '@/Components/UI/StatusTag';

const SLOT_LABELS = {
    after_subhi: 'Fajr', after_zuhr: 'Dhuhr',
    after_asr: 'Asr', after_maghrib: 'Maghrib', after_isha: 'Isha',
};

// ── All pairs list ────────────────────────────────────────────────────────────

function PairRow({ pair, halqas }) {
    const [assignHalqa, setAssignHalqa] = useState(false);
    const [halqaId, setHalqaId] = useState(pair.halqa_id ?? '');

    function del() {
        if (!confirm('Delete this pair?')) return;
        router.delete(`/admin/pairs/${pair.id}`, { preserveScroll: true });
    }
    function saveHalqa() {
        router.put(`/admin/pairs/${pair.id}/halqa`, { halqa_id: halqaId || null }, { preserveScroll: true, onSuccess: () => setAssignHalqa(false) });
    }

    return (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px auto auto auto', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{pair.student_a.name}</span>
            <span style={{ fontSize: '0.875rem', color: pair.student_b ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                {pair.student_b ? pair.student_b.name : '— solo —'}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{pair.halqa}</span>
            <span style={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{pair.consistency}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                {pair.last_sub ? new Date(pair.last_sub).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never'}
            </span>
            <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: pair.status === 'active' ? 'var(--success)' : 'var(--muted)', color: pair.status === 'active' ? 'var(--success-foreground)' : 'var(--muted-foreground)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {pair.status}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setAssignHalqa(!assignHalqa)} style={{ padding: '3px 8px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer' }}>Halqa</button>
                <button onClick={del} style={{ padding: '3px 8px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer' }}>×</button>
            </div>
            {assignHalqa && (
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select value={halqaId} onChange={(e) => setHalqaId(e.target.value)} style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' }}>
                        <option value="">— No halqa —</option>
                        {halqas.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                    <button onClick={saveHalqa} style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Save</button>
                </div>
            )}
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
    const [pairs, setPairs]       = useState(initialSuggested.map((p, i) => ({ ...p, halqa_id: '', _key: i })));
    const [selected, setSelected] = useState(null); // { pairIdx, side: 'a'|'b' }
    const [halqaAll, setHalqaAll] = useState('');

    function selectStudent(pairIdx, side) {
        if (!selected) { setSelected({ pairIdx, side }); return; }
        // Swap
        if (selected.pairIdx === pairIdx && selected.side === side) { setSelected(null); return; }
        const newPairs = [...pairs];
        const from = { ...newPairs[selected.pairIdx] };
        const to   = { ...newPairs[pairIdx] };
        const temp = from['student_' + selected.side];
        from['student_' + selected.side] = to['student_' + side];
        to['student_' + side] = temp;
        // Recompute shared slots after swap
        from.shared_slots = from.student_a.available_times.filter((s) => from.student_b.available_times.includes(s));
        to.shared_slots   = to.student_a.available_times.filter((s) => to.student_b.available_times.includes(s));
        newPairs[selected.pairIdx] = from;
        newPairs[pairIdx] = to;
        setPairs(newPairs);
        setSelected(null);
    }

    function applyHalqaAll() {
        setPairs(pairs.map((p) => ({ ...p, halqa_id: halqaAll })));
    }

    function confirm() {
        const payload = pairs.map((p) => ({ a: p.student_a.id, b: p.student_b.id, halqa_id: p.halqa_id || null }));
        router.post('/admin/pairs/confirm-assignment', { pairs: payload });
    }

    if (pairs.length === 0) {
        return <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', padding: '20px 0' }}>No suggested pairs. All active students may already be assigned.</p>;
    }

    return (
        <div>
            <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Click a student name to select, then click another to swap them between pairs. Shared time slots are highlighted.
            </p>

            {/* Bulk halqa assign */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', padding: '10px 12px', background: 'var(--muted)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Assign all to halqa:</span>
                <select value={halqaAll} onChange={(e) => setHalqaAll(e.target.value)} style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' }}>
                    <option value="">— Choose —</option>
                    {halqas.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <button onClick={applyHalqaAll} disabled={!halqaAll} style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Apply</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {pairs.map((pair, i) => (
                    <div key={pair._key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {['a', 'b'].map((side) => {
                            const s = pair['student_' + side];
                            const isSelected = selected?.pairIdx === i && selected?.side === side;
                            return (
                                <button key={side} onClick={() => selectStudent(i, side)} style={{
                                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                    background: isSelected ? 'var(--secondary)' : 'transparent',
                                    cursor: 'pointer', fontWeight: isSelected ? 700 : 500, fontSize: '0.875rem', color: 'var(--foreground)',
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

                        <div style={{ marginLeft: 'auto' }}>
                            <select value={pair.halqa_id} onChange={(e) => setPairs(pairs.map((p, j) => j === i ? { ...p, halqa_id: e.target.value } : p))}
                                style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' }}>
                                <option value="">No halqa</option>
                                {halqas.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Pairs({ pairs, requests, suggested, no_match, halqas }) {
    const [tab, setTab] = useState('All Pairs');

    const tabs = [
        { key: 'All Pairs',  count: pairs.length },
        { key: 'Requests',   count: requests.filter((r) => r).length },
        { key: 'Assignment', count: null },
    ];

    return (
        <AdminLayout title="Pair Management">
            <Head title="Pairs" />

            {/* Summary */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total pairs',   value: pairs.length },
                    { label: 'Active',        value: pairs.filter((p) => p.status === 'active').length },
                    { label: 'Solo',          value: pairs.filter((p) => p.status === 'solo').length },
                    { label: 'Pending requests', value: requests.length, warn: requests.length > 0 },
                ].map(({ label, value, warn }) => (
                    <div key={label} style={{ padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: warn ? 'var(--destructive)' : 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {tabs.map(({ key, count }) => (
                    <button key={key} onClick={() => setTab(key)} style={{
                        padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer',
                        background: tab === key ? 'var(--primary)' : 'var(--card)',
                        color: tab === key ? 'var(--primary-foreground)' : 'var(--foreground)',
                        fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem',
                    }}>
                        {key}{count != null ? ` (${count})` : ''}
                    </button>
                ))}
            </div>

            {/* All Pairs */}
            {tab === 'All Pairs' && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px auto auto auto', gap: '10px', padding: '6px 14px', borderBottom: '1px solid var(--border)' }}>
                        {['Student A', 'Student B', 'Halqa', 'Consistency', 'Last Sub', 'Status', ''].map((h) => (
                            <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                        ))}
                    </div>
                    {pairs.length === 0
                        ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No pairs yet.</p>
                        : pairs.map((p) => <PairRow key={p.id} pair={p} halqas={halqas} />)
                    }
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
