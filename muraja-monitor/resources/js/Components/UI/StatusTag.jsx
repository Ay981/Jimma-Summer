const STATUS = {
    on_track: { label: 'On Track',  bg: 'var(--success)',    color: 'var(--success-foreground)' },
    slipping: { label: 'Slipping',  bg: 'oklch(83% 0.15 84)', color: 'oklch(28% 0.09 84)' },
    at_risk:  { label: 'At Risk',   bg: 'var(--destructive)', color: 'var(--destructive-foreground)' },
    inactive: { label: 'Inactive',  bg: 'var(--muted)',       color: 'var(--muted-foreground)' },
};

export default function StatusTag({ status = 'inactive' }) {
    const s = STATUS[status] ?? STATUS.inactive;
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: s.bg,
            color: s.color,
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
        }}>
            {s.label}
        </span>
    );
}
