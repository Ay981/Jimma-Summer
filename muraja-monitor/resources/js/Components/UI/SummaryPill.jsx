const VARIANTS = {
    success: 'var(--success)',
    warning: 'oklch(70% 0.15 84)',
    danger:  'var(--destructive)',
    default: 'var(--foreground)',
};

export default function SummaryPill({ count, label, variant = 'default' }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            fontSize: '0.875rem',
        }}>
            <strong style={{ color: VARIANTS[variant] ?? VARIANTS.default, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                {count}
            </strong>
            <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
        </span>
    );
}
