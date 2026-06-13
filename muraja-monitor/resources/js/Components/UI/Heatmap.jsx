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
                        bg     = 'var(--heatmap-no-schedule)';
                        border = 'none';
                    } else if (submitted && is_makeup) {
                        bg     = 'var(--heatmap-makeup)';
                        border = 'none';
                    } else if (submitted) {
                        bg     = 'var(--heatmap-done)';
                        border = 'none';
                    } else {
                        bg     = 'var(--heatmap-missed)';
                        border = 'none';
                    }

                    return (
                        <div
                            key={date}
                            title={`${date}${is_makeup ? ' (makeup)' : ''}`}
                            style={{
                                width: '12px', height: '12px', borderRadius: '2px',
                                background: bg, border,
                                outline: isToday ? `2px solid var(--heatmap-today-ring)` : 'none',
                                outlineOffset: '2px',
                                opacity: !isScheduled ? 0.5 : 1,
                                flexShrink: 0,
                            }}
                        />
                    );
                })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '7px', flexWrap: 'wrap' }}>
                {[
                    { bg: 'var(--heatmap-done)',        label: 'Submitted' },
                    { bg: 'var(--heatmap-makeup)',      label: 'Makeup' },
                    { bg: 'var(--heatmap-missed)',      label: 'Missed' },
                    { bg: 'var(--heatmap-no-schedule)', label: 'Not scheduled', opacity: 0.5 },
                ].map(({ bg, opacity, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: bg, opacity }} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'var(--heatmap-done)', outline: `2px solid var(--heatmap-today-ring)`, outlineOffset: '1px' }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Today</span>
                </div>
            </div>
        </div>
    );
}
