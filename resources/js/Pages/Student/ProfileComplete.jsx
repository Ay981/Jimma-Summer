import { Head, useForm } from '@inertiajs/react';
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

function PillToggle({ items, selected, onToggle, cols }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '8px',
        }}>
            {items.map((item) => {
                const active = selected.includes(item.value);
                return (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => onToggle(item.value)}
                        style={{
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                            background: active ? 'var(--secondary)' : 'var(--background)',
                            color: active ? 'var(--primary)' : 'var(--foreground)',
                            fontSize: '0.875rem',
                            fontWeight: active ? 700 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.1s',
                            textAlign: 'center',
                        }}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function ProfileComplete({ user }) {
    const { data, setData, post, processing, errors } = useForm({
        memo_level:      user.memo_level      ?? '',
        current_juz:     user.current_juz     ?? 1,
        available_days:  user.available_days  ?? [],
        available_times: user.available_times ?? [],
        health_notes:    user.health_notes    ?? '',
    });

    function toggle(field, value) {
        setData(field, data[field].includes(value)
            ? data[field].filter((v) => v !== value)
            : [...data[field], value]
        );
    }

    function submit(e) {
        e.preventDefault();
        post('/student/profile/complete');
    }

    const inp = {
        padding: '8px 10px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontSize: '0.9rem',
        width: '100%',
        boxSizing: 'border-box',
    };
    const lbl   = { fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '6px' };
    const hint  = { margin: '0 0 8px', fontSize: '0.8125rem', color: 'var(--muted-foreground)' };
    const err   = { margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' };

    const canSubmit = data.memo_level && data.available_days.length > 0 && data.available_times.length > 0;

    return (
        <StudentLayout title="Complete Your Profile">
            <Head title="Complete Your Profile" />

            <div style={{ maxWidth: '540px', margin: '0 auto', padding: '0 4px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ margin: '0 0 6px', fontSize: '1.375rem', fontWeight: 700 }}>
                        Welcome, {user.name} 👋
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                        Complete your profile so your leader can match you with the right partner.
                    </p>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                    {/* Memorization level */}
                    <div>
                        <label style={lbl}>Memorization level <span style={{ color: 'var(--destructive)' }}>*</span></label>
                        <select value={data.memo_level} onChange={(e) => setData('memo_level', e.target.value)} style={inp} required>
                            <option value="">Select level…</option>
                            {MEMO_LEVELS.map((l) => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                        </select>
                        {errors.memo_level && <p style={err}>{errors.memo_level}</p>}
                    </div>

                    {/* Current juz */}
                    <div>
                        <label style={lbl}>Juz you are currently revising <span style={{ color: 'var(--destructive)' }}>*</span></label>
                        <select value={data.current_juz} onChange={(e) => setData('current_juz', parseInt(e.target.value))} style={inp} required>
                            {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                                <option key={j} value={j}>Juz {j}</option>
                            ))}
                        </select>
                        {errors.current_juz && <p style={err}>{errors.current_juz}</p>}
                    </div>

                    {/* Days of the week */}
                    <div>
                        <label style={lbl}>
                            Days you can do muraja'a <span style={{ color: 'var(--destructive)' }}>*</span>
                        </label>
                        <p style={hint}>These set your streak schedule — you'll only be counted absent on days you've selected.</p>
                        <PillToggle
                            items={DAYS}
                            selected={data.available_days}
                            onToggle={(v) => toggle('available_days', v)}
                            cols={7}
                        />
                        {errors.available_days && <p style={err}>{errors.available_days}</p>}
                    </div>

                    {/* Prayer time slots */}
                    <div>
                        <label style={lbl}>
                            Preferred times for muraja'a <span style={{ color: 'var(--destructive)' }}>*</span>
                        </label>
                        <p style={hint}>Used to match you with a compatible partner.</p>
                        <PillToggle
                            items={TIMES}
                            selected={data.available_times}
                            onToggle={(v) => toggle('available_times', v)}
                        />
                        {errors.available_times && <p style={err}>{errors.available_times}</p>}
                    </div>

                    {/* Health / schedule notes */}
                    <div>
                        <label style={lbl}>
                            Health or schedule notes{' '}
                            <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
                        </label>
                        <textarea
                            value={data.health_notes}
                            onChange={(e) => setData('health_notes', e.target.value)}
                            placeholder="Any health conditions, travel plans, or constraints your leader should know about…"
                            rows={3}
                            style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                        />
                        {errors.health_notes && <p style={err}>{errors.health_notes}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !canSubmit}
                        style={{
                            padding: '12px',
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: processing ? 'not-allowed' : 'pointer',
                            opacity: !canSubmit ? 0.6 : 1,
                        }}
                    >
                        {processing ? 'Saving…' : 'Complete Profile & Continue'}
                    </button>
                </form>
            </div>
        </StudentLayout>
    );
}
