import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

// Dismissal is keyed to the current week-start date so the banner re-appears on
// the next Sunday even after it's been dismissed this week.
function storageKey() {
    const d = new Date();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - d.getDay()); // getDay() 0 = Sunday
    return `rank_movement_dismissed_${sunday.toISOString().split('T')[0]}`;
}

const COPY = {
    1:  { emoji: '📈', text: 'Your rank went up this week — keep it up!',        accent: 'var(--success)' },
    '-1': { emoji: '📉', text: 'Your rank dropped this week — you can climb back.', accent: 'var(--destructive)' },
    0:  { emoji: '➖', text: 'Your rank held steady this week.',                  accent: 'var(--muted-foreground)' },
};

export default function RankMovementBanner() {
    const { rank_movement } = usePage().props;
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        try { setHidden(localStorage.getItem(storageKey()) === '1'); } catch { setHidden(false); }
    }, []);

    if (!rank_movement || hidden) return null;

    const copy = COPY[rank_movement.direction];
    if (!copy) return null;

    function handleDismiss() {
        try { localStorage.setItem(storageKey(), '1'); } catch {}
        setHidden(true);
    }

    return (
        <div style={{
            background: 'var(--secondary)',
            borderBottom: '1px solid var(--border)',
            borderLeft: `4px solid ${copy.accent}`,
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
        }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{copy.emoji}</span>
            <p style={{ margin: 0, flex: 1, fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>
                {copy.text}
            </p>
            <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted-foreground)', fontSize: '1.1rem',
                    padding: '0 2px', lineHeight: 1, flexShrink: 0,
                }}
            >
                ×
            </button>
        </div>
    );
}
