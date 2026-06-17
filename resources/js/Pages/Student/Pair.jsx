import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import StudentLayout from '@/Layouts/StudentLayout';

// ── Partner request card (shown when pairing window is open) ──────────────────

function PairingRequestCard({ pairing }) {
    const { window_open, window_deadline, my_request } = pairing;
    const { data, setData, post, processing, errors, reset } = useForm({ partner_student_id: '' });
    const [withdrawing, setWithdrawing] = useState(false);

    function submit(e) {
        e.preventDefault();
        post('/student/pair-request', { onSuccess: () => reset() });
    }

    function withdraw() {
        if (!confirm('Withdraw your partner request?')) return;
        setWithdrawing(true);
        router.delete('/student/pair-request', { onFinish: () => setWithdrawing(false) });
    }

    // Window closed — show read-only state
    if (!window_open) {
        return (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🤝</span>
                    <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--foreground)' }}>Partner Request</h2>
                    <span style={{ marginLeft: '4px', fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>Window Closed</span>
                </div>
                {my_request ? (
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        You requested <strong style={{ color: 'var(--foreground)' }}>{my_request.partner_name}</strong> ({my_request.partner_student_id}). The admin will consider this when running pairing.
                    </p>
                ) : (
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        The partner request window is not open yet. Check back when your admin announces it.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--card)', border: '2px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.1rem' }}>🤝</span>
                <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--foreground)' }}>Partner Request Window is Open</h2>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                If you have a specific partner in mind, enter their Student ID below.
                {window_deadline && <> Window closes on <strong>{window_deadline}</strong>.</>}
                {' '}You can change this anytime before it closes.
            </p>

            {my_request && (
                <div style={{ padding: '12px 14px', background: 'var(--secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Your current request</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.9375rem', fontWeight: 700 }}>
                            {my_request.partner_name}
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 400 }}>{my_request.partner_student_id}</span>
                        </p>
                    </div>
                    <button onClick={withdraw} disabled={withdrawing} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--destructive)' }}>
                        {withdrawing ? 'Withdrawing…' : 'Withdraw'}
                    </button>
                </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                    <input
                        value={data.partner_student_id}
                        onChange={e => setData('partner_student_id', e.target.value.toUpperCase())}
                        placeholder={my_request ? 'Enter a different Student ID to change' : 'Enter partner\'s Student ID (e.g. JUMU-2026-001)'}
                        style={{
                            width: '100%', boxSizing: 'border-box', padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)', border: `1px solid ${errors.partner_student_id ? 'var(--destructive)' : 'var(--border)'}`,
                            background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem',
                        }}
                    />
                    {errors.partner_student_id && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.partner_student_id}</p>}
                </div>
                <button type="submit" disabled={processing || !data.partner_student_id.trim()} style={{
                    padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                    background: 'var(--primary)', color: 'var(--primary-foreground)',
                    fontWeight: 600, fontSize: '0.875rem', cursor: processing ? 'not-allowed' : 'pointer',
                    opacity: (!data.partner_student_id.trim() || processing) ? 0.6 : 1, whiteSpace: 'nowrap',
                }}>
                    {processing ? 'Sending…' : my_request ? 'Change' : 'Request'}
                </button>
            </form>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Pair({ pair, pairing }) {
    const td = { padding: '10px 12px', fontSize: '0.875rem', color: 'var(--foreground)', borderBottom: '1px solid var(--border)' };
    const th = { padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, borderBottom: '1px solid var(--border)' };

    return (
        <StudentLayout title="My Partner">
            <Head title="My Partner" />
            <div className="page-content">
                <h1 style={{ margin: '0 0 20px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>My Partner</h1>

                {/* Pairing request card — only shown when student has no pair yet */}
                {!pair && pairing && <PairingRequestCard pairing={pairing} />}

                {!pair ? (
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
                            {pairing?.window_open
                                ? 'Pairing hasn\'t happened yet. Submit your preference above or wait for the admin to run pairing.'
                                : 'You haven\'t been assigned to a pair yet. Contact your halqa leader.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Partner info card */}
                        <div data-onboard="partner-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'var(--primary)', color: 'var(--primary-foreground)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.125rem', fontWeight: 700, flexShrink: 0,
                                }}>
                                    {pair.partner_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--foreground)' }}>{pair.partner_name}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                        📞 {pair.partner_phone !== '—' ? pair.partner_phone : 'No phone on file'}
                                    </p>
                                    {pair.partner_telegram && (
                                        <a
                                            href={`https://t.me/${pair.partner_telegram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.875rem', color: 'oklch(55% 0.18 230)', textDecoration: 'none', fontWeight: 500 }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.964-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.982.059z"/></svg>
                                            @{pair.partner_telegram}
                                        </a>
                                    )}
                                </div>
                                <div style={{ marginLeft: 'auto' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 12px', borderRadius: 'var(--radius-md)',
                                        background: pair.today_submitted ? 'var(--success)' : 'var(--muted)',
                                        color: pair.today_submitted ? 'var(--success-foreground)' : 'var(--muted-foreground)',
                                        fontSize: '0.8125rem', fontWeight: 500,
                                    }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                                        {pair.today_submitted ? 'Submitted today' : 'Not yet today'}
                                    </div>
                                </div>
                            </div>

                            {pair.status === 'solo' && (
                                <div style={{ padding: '8px 12px', background: 'var(--muted)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                    ⚠️ Your partner has withdrawn. Contact your leader for reassignment.
                                </div>
                            )}
                        </div>

                        {/* Partner history */}
                        <div data-onboard="partner-history" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--foreground)' }}>Partner's Submission History</h2>
                            </div>
                            {pair.history.length === 0 ? (
                                <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No submissions yet.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--muted)' }}>
                                                <th style={th}>Date</th>
                                                <th style={th}>Juz</th>
                                                <th style={th}>Pages</th>
                                                <th style={th}>Minutes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pair.history.map(s => (
                                                <tr key={s.id}>
                                                    <td style={td}>{s.date}</td>
                                                    <td style={td}>Juz {s.juz}</td>
                                                    <td style={td}>{s.page_from}–{s.page_to} <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>({s.page_to - s.page_from + 1}p)</span></td>
                                                    <td style={td}>{s.minutes_spent} min</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
