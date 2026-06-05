export default function SegmentedBar({ value = 0, max = 100, segments = 20, label, fraction, onTrackThreshold = 70 }) {
    const pct    = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
    const filled = Math.round((pct / 100) * segments);
    const isGood = pct >= onTrackThreshold;

    return (
        <div>
            <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: segments }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: '10px',
                            borderRadius: '2px',
                            background: i < filled
                                ? (isGood ? 'var(--success)' : 'var(--destructive)')
                                : 'transparent',
                            border: i < filled ? 'none' : '1px solid var(--border)',
                            backgroundImage: i >= filled
                                ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, var(--border) 3px, var(--border) 4px)'
                                : 'none',
                        }}
                    />
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                {label && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{label}</span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                    {fraction && `${fraction} · `}{Math.round(pct)}%
                </span>
            </div>
        </div>
    );
}
