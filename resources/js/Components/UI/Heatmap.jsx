export default function Heatmap({ data = [] }) {
    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {data.map(({ date, submitted, scheduled, is_makeup }) => {
                    const isToday     = date === today;
                    const isScheduled = scheduled !== false;

                    let bg, border;
                    if (!isScheduled) {
                        bg = 'transparent';
                        border = '1px dashed var(--border)';
                    } else if (submitted && is_makeup) {
                        bg = 'oklch(72% 0.15 75)'; // amber — makeup submission
                        border = 'none';
                    } else if (submitted) {
                        bg = 'var(--success)';
                        border = 'none';
                    } else {
                        bg = 'var(--muted)';
                        border = '1px solid var(--border)';
                    }

                    return (
                        <div
                            key={date}
                            title={`${date}${is_makeup ? ' (makeup)' : ''}`}
                            style={{
                                width: '12px', height: '12px', borderRadius: '2px',
                                background: bg, border,
                                outline: isToday ? '2px solid var(--accent)' : 'none',
                                outlineOffset: '1px',
                                opacity: !isScheduled ? 0.35 : 1,
                                flexShrink: 0,
                                position: 'relative',
                            }}
                        />
                    );
                })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '7px', flexWrap: 'wrap' }}>
                {[
                    { bg: 'var(--success)', label: 'Submitted' },
                    { bg: 'oklch(72% 0.15 75)', label: 'Makeup' },
                    { bg: 'var(--muted)', border: '1px solid var(--border)', label: 'Missed' },
                    { bg: 'transparent', border: '1px dashed var(--border)', opacity: 0.35, label: 'Not scheduled' },
                ].map(({ bg, border, opacity, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: bg, border, opacity }} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'var(--muted)', outline: '2px solid var(--accent)', outlineOffset: '1px' }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Today</span>
                </div>
            </div>
        </div>
    );
}
