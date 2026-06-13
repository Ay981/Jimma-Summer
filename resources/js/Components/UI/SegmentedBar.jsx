export default function SegmentedBar({ value = 0, max = 100, segments = 20, blocks, label, fraction, variant = 'auto' }) {
    const count  = blocks ?? segments;
    const pct    = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
    const filled = Math.round((pct / 100) * count);
    const color  = variant === 'gold' ? 'gold'
        : pct < 40 ? 'danger'
        : pct < 70 ? 'caution'
        : '';

    return (
        <div>
            <div className="seg-bar">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={`seg-block${i < filled ? ` filled${color ? ` ${color}` : ''}` : ''}`}
                    />
                ))}
            </div>
            {(label || fraction) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    {label && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                        {fraction && `${fraction} · `}{Math.round(pct)}%
                    </span>
                </div>
            )}
        </div>
    );
}
