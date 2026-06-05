import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function FlagRow({ s }) {
    function review(verdict) {
        router.post(`/admin/integrity/${s.id}/review`, { verdict }, { preserveScroll: true });
    }
    function unflag() {
        router.post(`/admin/integrity/${s.id}/unflag`, {}, { preserveScroll: true });
    }

    return (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px auto', gap: '10px', alignItems: 'center' }}>
            <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{s.student} <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>({s.halqa})</span></p>
                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Juz {s.juz} · pp. {s.page_from}–{s.page_to} · {s.minutes_spent} min · {s.submission_date}
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Filed by: {s.filed_by}</p>
            </div>
            {s.is_edited && <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--muted)', color: 'var(--muted-foreground)', textAlign: 'center' }}>edited</span>}
            {s.flag_verdict
                ? <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.flag_verdict === 'verified' ? 'var(--success)' : 'var(--destructive)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: s.flag_verdict === 'verified' ? 'oklch(95% 0.05 160)' : 'oklch(95% 0.04 20)' }}>{s.flag_verdict}</span>
                : <div />
            }
            <div style={{ display: 'flex', gap: '4px' }}>
                {!s.flag_verdict && (
                    <>
                        <button onClick={() => review('verified')} style={{ padding: '3px 8px', border: 'none', background: 'var(--success)', color: 'var(--success-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 600 }}>Verify</button>
                        <button onClick={() => review('rejected')} style={{ padding: '3px 8px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer' }}>Reject</button>
                    </>
                )}
                <button onClick={unflag} style={{ padding: '3px 8px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.6875rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}>Remove flag</button>
            </div>
        </div>
    );
}

export default function Integrity({ flagged, proxySubs }) {
    const [tab, setTab] = useState('Flagged');

    return (
        <AdminLayout title="Data Integrity">
            <Head title="Integrity" />

            <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                {[`Flagged (${(flagged ?? []).length})`, `Proxy Filed (${(proxySubs ?? []).length})`].map((t) => {
                    const key = t.startsWith('F') ? 'Flagged' : 'Proxy';
                    return (
                        <button key={key} onClick={() => setTab(key)} style={{ padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', background: tab === key ? 'var(--primary)' : 'var(--card)', color: tab === key ? 'var(--primary-foreground)' : 'var(--foreground)', fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem' }}>{t}</button>
                    );
                })}
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {tab === 'Flagged' && (
                    <>
                        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px auto', gap: '10px' }}>
                            {['Submission', 'Edited', 'Verdict', '', 'Actions'].map((h) => (
                                <span key={h} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</span>
                            ))}
                        </div>
                        {(flagged ?? []).length === 0
                            ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--success)', margin: 0 }}>No flagged submissions. All clear.</p>
                            : (flagged ?? []).map((s) => <FlagRow key={s.id} s={s} />)
                        }
                    </>
                )}
                {tab === 'Proxy' && (
                    <>
                        <p style={{ padding: '10px 14px', margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                            Submissions where the filer and the subject are different students.
                        </p>
                        {(proxySubs ?? []).length === 0
                            ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--success)', margin: 0 }}>No proxy submissions found.</p>
                            : (proxySubs ?? []).map((s) => (
                                <div key={s.id} style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                            <strong>{s.filed_by}</strong> filed for <strong>{s.student}</strong>
                                        </p>
                                        <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.date}</p>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'oklch(95% 0.04 50)', color: 'oklch(45% 0.1 50)', fontWeight: 600 }}>Cross-filed</span>
                                </div>
                            ))
                        }
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
