export default function Heatmap({ data = [] }) {
    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '3px',
            }}>
                {data.map(({ date, submitted, scheduled }) => {
                    const isToday     = date === today;
                    const isScheduled = scheduled !== false; // default true if not provided

                    let bg;
                    if (submitted)         bg = 'var(--success)';
                    else if (!isScheduled) bg = 'transparent';
                    else                   bg = 'var(--muted)';

                    return (
                        <div
                            key={date}
                            title={date}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '2px',
                                background: bg,
                                border: !isScheduled
                                    ? '1px dashed var(--border)'
                                    : submitted
                                    ? 'none'
                                    : '1px solid var(--border)',
                                outline: isToday ? '2px solid var(--accent)' : 'none',
                                outlineOffset: '1px',
                                opacity: !isScheduled ? 0.35 : 1,
                                flexShrink: 0,
                            }}
                        />
                    );
                })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '7px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'var(--success)' }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Submitted</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'var(--muted)', border: '1px solid var(--border)' }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Missed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'transparent', border: '1px dashed var(--border)', opacity: 0.35 }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Not scheduled</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: 'var(--muted)', outline: '2px solid var(--accent)', outlineOffset: '1px' }} />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Today</span>
                </div>
            </div>
        </div>
    );
}
