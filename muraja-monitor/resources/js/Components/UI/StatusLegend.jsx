import React from 'react';
import { Info, CaretDown } from '@phosphor-icons/react';

// Plain-English meaning of each status. These mirror the rules in
// ConsistencyService::deriveStatus — every count is measured against the days
// each student chose to submit, so a day off never counts against them.
const ITEMS = [
    {
        key: 'on_track',
        label: 'On Track',
        color: 'var(--status-on-track)',
        text: 'Keeping up well — submitting on most of the days they chose.',
    },
    {
        key: 'slipping',
        label: 'Slipping',
        color: 'var(--status-slipping)',
        text: 'Starting to fall behind — missed a couple of their chosen days lately.',
    },
    {
        key: 'at_risk',
        label: 'At Risk',
        color: 'var(--status-at-risk)',
        text: 'Needs a nudge — missed several chosen days in a row, or has not started yet.',
    },
    {
        key: 'inactive',
        label: 'Inactive',
        color: 'var(--status-inactive)',
        text: 'Gone quiet — no submissions for a full week of their chosen days.',
    },
];

/**
 * A small, collapsible "what do these words mean?" panel for leaders/admins.
 * Defaults to collapsed so it never gets in the way.
 */
export default function StatusLegend({ defaultOpen = false }) {
    const [open, setOpen] = React.useState(defaultOpen);

    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
        }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 12px', background: 'transparent', border: 'none',
                    cursor: 'pointer', color: 'var(--foreground)', textAlign: 'left',
                }}
            >
                <Info size={16} weight="fill" color="var(--primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, flex: 1 }}>
                    What do “On Track”, “Slipping”, “At Risk” and “Inactive” mean?
                </span>
                <CaretDown
                    size={14}
                    style={{ flexShrink: 0, transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }}
                    color="var(--muted-foreground)"
                />
            </button>

            {open && (
                <div style={{ padding: '2px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ITEMS.map(({ key, label, color, text }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                            <span style={{
                                width: '10px', height: '10px', borderRadius: '3px',
                                background: color, flexShrink: 0, marginTop: '3px',
                            }} />
                            <span style={{ fontSize: '0.8125rem', color: 'var(--foreground)', lineHeight: 1.45 }}>
                                <strong>{label}</strong> — {text}
                            </span>
                        </div>
                    ))}
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                        Percentages and streaks only count the days each student chose to submit — their days off never count against them.
                    </p>
                </div>
            )}
        </div>
    );
}
