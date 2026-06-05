import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Settings({ settings, ayat, prayer_today }) {
    const { data, setData, put, processing, errors } = useForm({ ...settings });
    const [newAyat, setNewAyat] = useState({ text: '', reference: '' });

    function save(e) { e.preventDefault(); put('/admin/settings', {}); }

    function addAyat(e) {
        e.preventDefault();
        router.post('/admin/settings/ayat', newAyat, { preserveScroll: true, onSuccess: () => setNewAyat({ text: '', reference: '' }) });
    }

    function fetchPrayer() {
        router.post('/admin/settings/prayer-times', {}, { preserveScroll: true });
    }

    const Row = ({ label, children }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)' }}>{label}</label>
            {children}
        </div>
    );

    const inp = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' };

    return (
        <AdminLayout title="Settings">
            <Head title="Settings" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }} className="settings-grid">
                {/* Main settings form */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
                    <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Program Settings</h2>
                    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column' }}>
                        <Row label="Program Name"><input style={inp} value={data.program_name} onChange={(e) => setData('program_name', e.target.value)} /></Row>
                        <Row label="Start Date"><input type="date" style={inp} value={data.program_start_date} onChange={(e) => setData('program_start_date', e.target.value)} /></Row>
                        <Row label="End Date"><input type="date" style={inp} value={data.program_end_date} onChange={(e) => setData('program_end_date', e.target.value)} /></Row>
                        <Row label="Default Password"><input style={inp} value={data.default_password} onChange={(e) => setData('default_password', e.target.value)} /></Row>
                        <Row label="Certificate Threshold (%)"><input type="number" style={inp} value={data.certificate_threshold} onChange={(e) => setData('certificate_threshold', e.target.value)} min={0} max={100} /></Row>

                        <h3 style={{ margin: '16px 0 8px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Badge Thresholds</h3>
                        {[
                            ['Streak Bronze (days)', 'badge_streak_bronze'], ['Streak Silver (days)', 'badge_streak_silver'], ['Streak Gold (days)', 'badge_streak_gold'],
                            ['Pages Bronze', 'badge_pages_bronze'], ['Pages Silver', 'badge_pages_silver'], ['Pages Gold', 'badge_pages_gold'],
                        ].map(([label, key]) => (
                            <Row key={key} label={label}>
                                <input type="number" style={inp} value={data[key]} onChange={(e) => setData(key, e.target.value)} min={1} />
                            </Row>
                        ))}

                        <h3 style={{ margin: '16px 0 8px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modes</h3>
                        {[['Exam Mode', 'exam_mode'], ['Ramadan Mode', 'ramadan_mode']].map(([label, key]) => (
                            <Row key={key} label={label}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={data[key] === '1' || data[key] === true} onChange={(e) => setData(key, e.target.checked ? '1' : '0')} />
                                    <span style={{ fontSize: '0.875rem' }}>Enabled</span>
                                </label>
                            </Row>
                        ))}

                        <Row label="Date Override (leave blank = today)">
                            <input type="date" style={inp} value={data.date_override} onChange={(e) => setData('date_override', e.target.value)} />
                        </Row>

                        <button type="submit" disabled={processing} style={{ marginTop: '16px', padding: '9px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9375rem', cursor: processing ? 'not-allowed' : 'pointer' }}>
                            {processing ? 'Saving…' : 'Save Settings'}
                        </button>
                    </form>
                </div>

                {/* Right: prayer times + ayat */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Prayer times */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: '0.9375rem', fontWeight: 700 }}>Prayer Times (Jimma)</h3>
                        {prayer_today ? (
                            <p style={{ margin: '0 0 8px', fontSize: '0.875rem' }}>Today — Fajr: <strong>{prayer_today.fajr}</strong> · Isha: <strong>{prayer_today.isha}</strong></p>
                        ) : (
                            <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>No cached times for today.</p>
                        )}
                        <button onClick={fetchPrayer} style={{ padding: '6px 14px', border: 'none', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>
                            Fetch from Aladhan API
                        </button>
                    </div>

                    {/* Ayat rotation */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Ayat Rotation ({ayat.length})</h3>
                        </div>
                        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                            {ayat.map((a) => (
                                <div key={a.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.8125rem' }}>{a.text.slice(0, 80)}{a.text.length > 80 ? '…' : ''}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{a.reference}</p>
                                    </div>
                                    <button onClick={() => router.delete(`/admin/settings/ayat/${a.id}`, { preserveScroll: true })} style={{ padding: '3px 8px', border: 'none', background: 'var(--destructive)', color: 'var(--destructive-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>×</button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addAyat} style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <textarea value={newAyat.text} onChange={(e) => setNewAyat({ ...newAyat, text: e.target.value })} placeholder="Arabic text…" rows={2} required style={{ padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem', resize: 'none', fontFamily: 'inherit' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input value={newAyat.reference} onChange={(e) => setNewAyat({ ...newAyat, reference: e.target.value })} placeholder="Reference (e.g. Al-Baqarah 2:1)" required style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.8125rem' }} />
                                <button type="submit" style={{ padding: '5px 12px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', cursor: 'pointer' }}>Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`@media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr !important; } }`}</style>
        </AdminLayout>
    );
}
