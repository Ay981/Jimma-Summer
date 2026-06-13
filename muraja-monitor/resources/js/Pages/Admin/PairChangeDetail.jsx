import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

const TYPE = {
    same_halqa:  { label: 'Same Halqa',  color: 'oklch(36% 0.12 145)' },
    cross_halqa: { label: 'Cross-Halqa', color: 'var(--destructive)' },
    unspecified: { label: 'Unspecified', color: 'var(--muted-foreground)' },
};

// ── Rejection modal ───────────────────────────────────────────────────────────

function RejectModal({ requestId, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ rejection_reason: '' });
    function submit(e) {
        e.preventDefault();
        post(`/admin/pair-changes/${requestId}/reject`, {
            preserveScroll: true,
            onSuccess: () => { onClose(); router.get('/admin/pair-changes'); },
        });
    }
    const inp = { padding:'7px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--background)', color:'var(--foreground)', fontSize:'0.875rem', width:'100%', boxSizing:'border-box' };
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:600, padding:'16px' }} onClick={onClose}>
            <div style={{ background:'var(--card)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', width:'100%', maxWidth:'440px', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{ margin:0, fontSize:'0.875rem', fontWeight:700, color:'var(--destructive)' }}>Reject Request</p>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem', color:'var(--muted-foreground)' }}>✕</button>
                </div>
                <form onSubmit={submit} style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                    <div>
                        <label style={{ display:'block', fontSize:'0.6875rem', color:'var(--muted-foreground)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'3px' }}>Rejection reason *</label>
                        <textarea
                            value={data.rejection_reason}
                            onChange={e => setData('rejection_reason', e.target.value)}
                            rows={3} required
                            placeholder="Explain why the request is being rejected…"
                            style={{ ...inp, resize:'vertical', fontFamily:'inherit' }}
                        />
                        {errors.rejection_reason && <p style={{ margin:'2px 0 0', fontSize:'0.75rem', color:'var(--destructive)' }}>{errors.rejection_reason}</p>}
                    </div>
                    <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding:'7px 14px', border:'1px solid var(--border)', background:'transparent', borderRadius:'var(--radius-sm)', fontSize:'0.875rem', cursor:'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding:'7px 16px', border:'none', background:'var(--destructive)', color:'var(--destructive-foreground)', borderRadius:'var(--radius-sm)', fontWeight:600, fontSize:'0.875rem', cursor:processing?'not-allowed':'pointer', opacity:processing?0.7:1 }}>
                            {processing ? 'Rejecting…' : 'Confirm Reject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Student card ──────────────────────────────────────────────────────────────

function StudentCard({ label, name, partnerName, halqa, color }) {
    return (
        <div style={{ padding:'12px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)' }}>
            <p style={{ margin:'0 0 2px', fontSize:'0.625rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted-foreground)' }}>{label}</p>
            <p style={{ margin:0, fontSize:'0.9375rem', fontWeight:700, color: color ?? 'var(--foreground)' }}>{name}</p>
            {halqa && <p style={{ margin:'1px 0 0', fontSize:'0.75rem', color:'var(--muted-foreground)' }}>Halqa: {halqa}</p>}
            {partnerName && <p style={{ margin:'2px 0 0', fontSize:'0.75rem', color:'var(--muted-foreground)' }}>Current partner: {partnerName}</p>}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ErrorBanner({ errors }) {
    const msgs = Object.values(errors ?? {}).filter(Boolean);
    if (!msgs.length) return null;
    return (
        <div style={{ padding:'10px 14px', marginBottom:'12px', borderRadius:'var(--radius-md)', background:'oklch(96% 0.06 20)', border:'1px solid var(--destructive)' }}>
            {msgs.map((m, i) => <p key={i} style={{ margin: i ? '4px 0 0' : 0, fontSize:'0.875rem', color:'var(--destructive)', fontWeight:500 }}>{m}</p>)}
        </div>
    );
}

export default function PairChangeDetail({
    change_request, student, current_partner,
    requested_partner, req_partner_partner,
    same_halqa_students, cross_halqa_warning,
}) {
    const { props: { flash } } = usePage();
    const [showReject, setShowReject] = useState(false);
    const [outcome, setOutcome]       = useState('a_with_req'); // 'a_with_req' or 'a_with_req_partner'

    const { data, setData, post, processing, errors } = useForm({
        new_partner_id: requested_partner?.id ?? '',
        confirm_cross:  '',
    });

    const isCross   = change_request.type === 'cross_halqa';
    const isPending = change_request.status === 'escalated_to_admin';
    const t         = TYPE[change_request.type] ?? TYPE.unspecified;

    // Determine who gets paired with whom based on outcome selection
    const partnerForA = outcome === 'a_with_req' ? requested_partner : req_partner_partner;
    const partnerForB = outcome === 'a_with_req' ? req_partner_partner : requested_partner;

    function submitApprove(e) {
        e.preventDefault();
        post(`/admin/pair-changes/${change_request.id}/approve`, {
            onSuccess: () => router.get('/admin/pair-changes'),
        });
    }

    const selStyle = { padding:'6px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--background)', color:'var(--foreground)', fontSize:'0.8125rem', width:'100%' };
    const inp      = { ...selStyle };

    return (
        <AdminLayout title="Pair Change Request">
            <Head title="Pair Change Request" />

            <div style={{ maxWidth:'800px', margin:'0 auto' }}>
                {/* Back */}
                <button onClick={() => router.get('/admin/pair-changes')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.8125rem', color:'var(--muted-foreground)', marginBottom:'16px', padding:0 }}>
                    ← All Requests
                </button>

                {/* Flash error banner */}
                {flash?.error && (
                    <div style={{ padding:'10px 14px', marginBottom:'12px', borderRadius:'var(--radius-md)', background:'oklch(96% 0.06 20)', border:'1px solid var(--destructive)' }}>
                        <p style={{ margin:0, fontSize:'0.875rem', color:'var(--destructive)', fontWeight:500 }}>{flash.error}</p>
                    </div>
                )}

                {/* Header card */}
                <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:'14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'10px' }}>
                        <div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                                <h1 style={{ margin:0, fontSize:'1.125rem', fontWeight:700 }}>Pair Change Request #{change_request.id}</h1>
                                <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'2px 9px', borderRadius:'99px', color:t.color, background:'var(--muted)', border:`1px solid ${t.color}` }}>{t.label}</span>
                                {isCross && <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'2px 9px', borderRadius:'99px', background:'var(--destructive)', color:'var(--destructive-foreground)' }}>⚠ Requires CONFIRM</span>}
                            </div>
                            <p style={{ margin:0, fontSize:'0.8125rem', color:'var(--muted-foreground)' }}>
                                Submitted {change_request.requested_at} by leader {change_request.leader_name}
                            </p>
                        </div>
                        <span style={{ fontSize:'0.75rem', fontWeight:600, padding:'4px 12px', borderRadius:'var(--radius-sm)', background: change_request.status === 'escalated_to_admin' ? 'var(--status-slipping-bg)' : change_request.status === 'approved' ? 'var(--success)' : 'var(--destructive)', color: change_request.status === 'escalated_to_admin' ? 'var(--status-slipping)' : change_request.status === 'approved' ? 'var(--success-foreground)' : 'var(--destructive-foreground)' }}>
                            {change_request.status === 'escalated_to_admin' ? 'Pending review' : change_request.status}
                        </span>
                    </div>
                    <div style={{ marginTop:'12px', padding:'10px 12px', background:'var(--muted)', borderRadius:'var(--radius-md)' }}>
                        <p style={{ margin:'0 0 2px', fontSize:'0.625rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--muted-foreground)' }}>Reason</p>
                        <p style={{ margin:0, fontSize:'0.875rem' }}>{change_request.reason}</p>
                    </div>
                    {change_request.rejection_reason && (
                        <div style={{ marginTop:'8px', padding:'10px 12px', background:'oklch(96% 0.05 20)', border:'1px solid var(--destructive)', borderRadius:'var(--radius-md)' }}>
                            <p style={{ margin:'0 0 2px', fontSize:'0.625rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--destructive)' }}>Rejection reason</p>
                            <p style={{ margin:0, fontSize:'0.875rem' }}>{change_request.rejection_reason}</p>
                        </div>
                    )}
                </div>

                {/* Cross-halqa warning */}
                {isCross && (
                    <div style={{ padding:'12px 16px', marginBottom:'14px', borderRadius:'var(--radius-md)', background:'oklch(95% 0.07 20)', border:'1px solid var(--destructive)', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                        <span style={{ fontSize:'1.1rem', flexShrink:0 }}>⚠</span>
                        <div>
                            <p style={{ margin:'0 0 2px', fontSize:'0.875rem', fontWeight:700, color:'var(--destructive)' }}>Cross-halqa request — moving students between halqas is required.</p>
                            <p style={{ margin:0, fontSize:'0.8125rem', color:'var(--muted-foreground)' }}>
                                {cross_halqa_warning ?? 'Both halqas have even numbers. The swap can proceed.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Student cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'8px', marginBottom:'14px' }}>
                    <StudentCard label="Requesting student" name={student.name} halqa={student.halqa} color="oklch(32% 0.14 145)" />
                    <StudentCard label="Current partner" name={current_partner?.name ?? '— solo —'} />
                    {requested_partner && <StudentCard label="Requested new partner" name={requested_partner.name} partnerName={req_partner_partner?.name} color="var(--gold-600)" />}
                    {req_partner_partner && <StudentCard label="Requested partner's current partner" name={req_partner_partner.name} />}
                </div>

                {/* Approval form */}
                {isPending && (
                    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:'14px' }}>
                        <p style={{ margin:'0 0 14px', fontSize:'0.875rem', fontWeight:700 }}>Execute Pair Change</p>

                        <form onSubmit={submitApprove} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                            <ErrorBanner errors={errors} />
                            {/* Partner picker (if no requested partner or override) */}
                            <div>
                                <label style={{ display:'block', fontSize:'0.6875rem', color:'var(--muted-foreground)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'3px' }}>
                                    Pair {student.name} with
                                </label>
                                <select
                                    value={data.new_partner_id}
                                    onChange={e => setData('new_partner_id', e.target.value)}
                                    style={selStyle}
                                    required
                                >
                                    <option value="">— Select partner —</option>
                                    {same_halqa_students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.student_id})
                                            {s.id === requested_partner?.id ? ' ★ requested' : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.new_partner_id && <p style={{ margin:'2px 0 0', fontSize:'0.75rem', color:'var(--destructive)' }}>{errors.new_partner_id}</p>}
                                <p style={{ margin:'4px 0 0', fontSize:'0.6875rem', color:'var(--muted-foreground)' }}>
                                    The selected student will be removed from their current pair. Their ex-partner becomes solo.
                                </p>
                            </div>

                            {/* Cross-halqa CONFIRM field */}
                            {isCross && (
                                <div>
                                    <label style={{ display:'block', fontSize:'0.6875rem', color:'var(--destructive)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'3px' }}>
                                        Type CONFIRM to execute cross-halqa swap
                                    </label>
                                    <input
                                        type="text"
                                        value={data.confirm_cross}
                                        onChange={e => setData('confirm_cross', e.target.value)}
                                        placeholder="CONFIRM"
                                        style={{ ...inp, borderColor: data.confirm_cross === 'CONFIRM' ? 'var(--success)' : 'var(--destructive)' }}
                                    />
                                    {errors.confirm_cross && <p style={{ margin:'2px 0 0', fontSize:'0.75rem', color:'var(--destructive)' }}>{errors.confirm_cross}</p>}
                                </div>
                            )}

                            {errors.error && <p style={{ margin:0, fontSize:'0.8125rem', color:'var(--destructive)' }}>{errors.error}</p>}

                            <div style={{ display:'flex', gap:'8px' }}>
                                <button
                                    type="submit"
                                    disabled={processing || (isCross && data.confirm_cross !== 'CONFIRM')}
                                    style={{ padding:'8px 20px', border:'none', background: isCross ? 'var(--destructive)' : 'var(--primary)', color: isCross ? 'var(--destructive-foreground)' : 'var(--primary-foreground)', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.875rem', cursor:(processing||(isCross&&data.confirm_cross!=='CONFIRM'))?'not-allowed':'pointer', opacity:(processing||(isCross&&data.confirm_cross!=='CONFIRM'))?0.6:1 }}
                                >
                                    {processing ? 'Executing…' : isCross ? '⚠ Execute Cross-Halqa Swap' : '✓ Approve & Execute Swap'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReject(true)}
                                    style={{ padding:'8px 16px', border:'1px solid var(--destructive)', background:'transparent', color:'var(--destructive)', borderRadius:'var(--radius-sm)', fontWeight:600, fontSize:'0.875rem', cursor:'pointer' }}
                                >
                                    Reject
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {showReject && <RejectModal requestId={change_request.id} onClose={() => setShowReject(false)} />}
        </AdminLayout>
    );
}
