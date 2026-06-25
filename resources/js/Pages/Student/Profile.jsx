import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import StudentLayout from '@/Layouts/StudentLayout';

const MEMO_LEVELS = [
    { value: 'less_than_1', label: 'Less than 1 juz' },
    { value: '1_5',         label: '1–5 juz' },
    { value: '6_10',        label: '6–10 juz' },
    { value: '11_20',       label: '11–20 juz' },
    { value: '21_29',       label: '21–29 juz' },
    { value: 'full_hifz',   label: 'Full Hifz' },
];

const DAYS = [
    { value: 'sunday',    label: 'Sun' },
    { value: 'monday',    label: 'Mon' },
    { value: 'tuesday',   label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday',  label: 'Thu' },
    { value: 'friday',    label: 'Fri' },
    { value: 'saturday',  label: 'Sat' },
];

const TIMES = [
    { value: 'after_subhi',   label: 'After Subhi' },
    { value: 'after_zuhr',    label: 'After Zuhr' },
    { value: 'after_asr',     label: 'After Asr' },
    { value: 'after_maghrib', label: 'After Maghrib' },
    { value: 'after_isha',    label: 'After Isha' },
];

const inp = {
    width: '100%', boxSizing: 'border-box', padding: '9px 11px',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--background)', color: 'var(--foreground)',
    fontSize: '0.875rem', fontFamily: 'inherit',
};

const label = { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' };

export default function Profile({ profile, student, telegram }) {
    const { data, setData, put, processing, errors, wasSuccessful } = useForm({
        memo_level:      profile.memo_level      ?? '',
        current_juz:     profile.current_juz     ?? 1,
        available_times: profile.available_times ?? [],
        available_days:  profile.available_days  ?? [],
    });

    const [linkToken, setLinkToken]         = useState(null);
    const [tokenLoading, setTokenLoading]   = useState(false);
    const [copied, setCopied]               = useState(false);
    const [unlinking, setUnlinking]         = useState(false);

    async function generateToken() {
        setTokenLoading(true);
        try {
            const res = await fetch('/student/telegram/link-token', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                },
            });
            const json = await res.json();
            setLinkToken(json.token);
        } finally {
            setTokenLoading(false);
        }
    }

    function copyCommand() {
        navigator.clipboard.writeText(`/link ${linkToken}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function unlink() {
        if (!confirm('Disconnect your Telegram account?')) return;
        setUnlinking(true);
        router.delete('/student/telegram/unlink', {
            onFinish: () => setUnlinking(false),
        });
    }

    function toggleDay(val) {
        setData('available_days', data.available_days.includes(val)
            ? data.available_days.filter(d => d !== val)
            : [...data.available_days, val]
        );
    }

    function toggleTime(val) {
        setData('available_times', data.available_times.includes(val)
            ? data.available_times.filter(t => t !== val)
            : [...data.available_times, val]
        );
    }

    function submit(e) {
        e.preventDefault();
        put('/student/profile');
    }

    const toggleBtn = (active) => ({
        padding: '7px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        fontWeight: 600, fontSize: '0.8125rem', border: 'none',
        background: active ? 'var(--primary)' : 'var(--muted)',
        color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
        transition: 'background 0.12s, color 0.12s',
    });

    return (
        <StudentLayout title="My Profile">
            <Head title="My Profile" />

            <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Header */}
                <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700 }}>My Profile</h1>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {student.name} · {student.student_id}
                        {student.halqa && <span> · {student.halqa}</span>}
                    </p>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Memorisation level */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                        <span style={label}>Memorisation Level</span>
                        <select value={data.memo_level} onChange={e => setData('memo_level', e.target.value)} style={inp}>
                            <option value="">Select level…</option>
                            {MEMO_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                        {errors.memo_level && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.memo_level}</p>}
                    </div>

                    {/* Current juz */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                        <span style={label}>Current Juz</span>
                        <select value={data.current_juz} onChange={e => setData('current_juz', parseInt(e.target.value))} style={inp}>
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                <option key={j} value={j}>Juz {j}</option>
                            ))}
                        </select>
                        {errors.current_juz && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.current_juz}</p>}
                    </div>

                    {/* Available days */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                        <span style={label}>Revision Days</span>
                        <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Which days do you do muraja'a?</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {DAYS.map(d => (
                                <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => toggleDay(d.value)}
                                    style={toggleBtn(data.available_days.includes(d.value))}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        {errors.available_days && <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.available_days}</p>}
                    </div>

                    {/* Preferred times */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                        <span style={label}>Preferred Prayer Times</span>
                        <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>When are you free to revise?</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {TIMES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => toggleTime(t.value)}
                                    style={toggleBtn(data.available_times.includes(t.value))}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        {errors.available_times && <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.available_times}</p>}
                    </div>

                    {/* Telegram */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                        <span style={label}>Telegram</span>

                        {telegram.linked ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>✅</span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 600 }}>Account connected</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={unlink}
                                    disabled={unlinking}
                                    style={{
                                        padding: '6px 12px', border: '1px solid var(--destructive)',
                                        borderRadius: 'var(--radius-sm)', background: 'transparent',
                                        color: 'var(--destructive)', fontSize: '0.8125rem',
                                        fontWeight: 600, cursor: 'pointer', opacity: unlinking ? 0.6 : 1,
                                    }}
                                >
                                    {unlinking ? 'Disconnecting…' : 'Disconnect'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                    Connect your Telegram so you can reset your password directly from the bot.
                                </p>

                                {!linkToken ? (
                                    <button
                                        type="button"
                                        onClick={generateToken}
                                        disabled={tokenLoading}
                                        style={{
                                            padding: '9px 14px', border: 'none', borderRadius: 'var(--radius-sm)',
                                            background: 'var(--primary)', color: 'var(--primary-foreground)',
                                            fontSize: '0.875rem', fontWeight: 700,
                                            cursor: tokenLoading ? 'not-allowed' : 'pointer',
                                            opacity: tokenLoading ? 0.7 : 1, alignSelf: 'flex-start',
                                        }}
                                    >
                                        {tokenLoading ? 'Generating…' : 'Generate Link Code'}
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--foreground)', fontWeight: 600 }}>
                                            Open <a href={`https://t.me/${telegram.bot_username}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>@{telegram.bot_username}</a> and send this command:
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <code style={{
                                                flex: 1, padding: '9px 12px', background: 'var(--muted)',
                                                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.9375rem', fontFamily: 'monospace', letterSpacing: '0.05em',
                                            }}>
                                                /link {linkToken}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={copyCommand}
                                                style={{
                                                    padding: '9px 14px', border: 'none', borderRadius: 'var(--radius-sm)',
                                                    background: copied ? 'var(--success)' : 'var(--muted)',
                                                    color: copied ? 'var(--success-foreground)' : 'var(--foreground)',
                                                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                                                    transition: 'background 0.15s',
                                                }}
                                            >
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            Code expires in 10 minutes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        style={{
                            padding: '11px', border: 'none', borderRadius: 'var(--radius-md)',
                            background: wasSuccessful ? 'var(--success)' : 'var(--primary)',
                            color: wasSuccessful ? 'var(--success-foreground)' : 'var(--primary-foreground)',
                            fontSize: '0.9375rem', fontWeight: 700,
                            cursor: processing ? 'not-allowed' : 'pointer',
                            opacity: processing ? 0.7 : 1,
                            transition: 'background 0.2s',
                        }}
                    >
                        {processing ? 'Saving…' : wasSuccessful ? 'Saved ✓' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </StudentLayout>
    );
}
