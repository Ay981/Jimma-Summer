/**
 * BarChart — pure SVG, no dependencies.
 *
 * Props
 *   data       [{label, value, color?}]
 *   height     number (default 160)
 *   barColor   CSS color string (overridden per-bar by data[i].color)
 *   lineData   [{label, values:[number], color}]  — overlaid polylines
 *   lineScale  {min, max}  — y-axis domain for lines (defaults to 0–100)
 *   showValues boolean     — render value labels on top of bars
 *   unit       string      — appended to tooltip
 */
export default function BarChart({
    data = [],
    height = 160,
    barColor = 'var(--primary)',
    lineData = [],
    lineScale = { min: 0, max: 100 },
    showValues = false,
    unit = '',
}) {
    if (!data.length) return null;

    const PAD_L = 32, PAD_R = 8, PAD_T = showValues ? 20 : 8, PAD_B = 28;
    const W_PER_BAR = 28;
    const width = Math.max(300, data.length * W_PER_BAR + PAD_L + PAD_R);
    const chartH = height - PAD_T - PAD_B;
    const chartW = width - PAD_L - PAD_R;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const barW   = Math.max(6, (chartW / data.length) * 0.6);
    const barGap = chartW / data.length;

    // bar x position
    const bx = (i) => PAD_L + i * barGap + barGap / 2 - barW / 2;
    // bar y + h
    const bh = (v) => Math.max(1, (v / maxVal) * chartH);
    const by = (v) => PAD_T + chartH - bh(v);

    // line scale helpers
    const lRange = lineScale.max - lineScale.min || 1;
    const ly = (v) => PAD_T + chartH - ((v - lineScale.min) / lRange) * chartH;

    // y-axis grid lines (3 levels)
    const yTicks = [0, 0.5, 1].map((f) => ({ y: PAD_T + chartH * (1 - f), label: Math.round(maxVal * f) }));

    return (
        <div style={{ overflowX: 'auto' }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
                {/* Y-axis grid */}
                {yTicks.map(({ y, label }) => (
                    <g key={y}>
                        <line x1={PAD_L} x2={width - PAD_R} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                        <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">{label}</text>
                    </g>
                ))}

                {/* Bars */}
                {data.map((d, i) => (
                    <g key={i}>
                        <rect
                            x={bx(i)} y={by(d.value)}
                            width={barW} height={bh(d.value)}
                            fill={d.color ?? barColor}
                            rx={2}
                            opacity={0.85}
                        >
                            <title>{d.label}: {d.value}{unit}</title>
                        </rect>
                        {showValues && d.value > 0 && (
                            <text x={bx(i) + barW / 2} y={by(d.value) - 3} textAnchor="middle" fontSize={8} fill="var(--foreground)">{d.value}</text>
                        )}
                        <text x={bx(i) + barW / 2} y={height - 6} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)"
                            transform={data.length > 20 ? `rotate(-45,${bx(i) + barW / 2},${height - 6})` : undefined}>
                            {d.label}
                        </text>
                    </g>
                ))}

                {/* Overlaid lines */}
                {lineData.map((series, si) => {
                    const pts = series.values.map((v, i) =>
                        `${bx(i) + barW / 2},${ly(v)}`
                    ).join(' ');
                    return (
                        <g key={si}>
                            <polyline points={pts} fill="none" stroke={series.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
                            {series.values.map((v, i) => (
                                <circle key={i} cx={bx(i) + barW / 2} cy={ly(v)} r={2.5} fill={series.color}>
                                    <title>{series.label}: {v.toFixed(1)}%</title>
                                </circle>
                            ))}
                        </g>
                    );
                })}

                {/* Line legend */}
                {lineData.length > 0 && (
                    <g transform={`translate(${PAD_L},${PAD_T - 4})`}>
                        {lineData.map((s, i) => (
                            <g key={i} transform={`translate(${i * 110},0)`}>
                                <line x1={0} x2={14} y1={0} y2={0} stroke={s.color} strokeWidth={2} />
                                <text x={17} y={3} fontSize={9} fill="var(--muted-foreground)">{s.label}</text>
                            </g>
                        ))}
                    </g>
                )}
            </svg>
        </div>
    );
}
