/**
 * BarChart — responsive SVG, fills its container.
 *
 * Props
 *   data       [{label, value, color?}]
 *   height     number  — viewBox height (visual reference size)
 *   barColor   CSS color string (overridden per-bar by data[i].color)
 *   lineData   [{label, values:[number], color}]  — overlaid polylines
 *   lineScale  {min, max}  — y-axis domain for lines (defaults to 0–100)
 *   showValues boolean     — render value labels on top of bars
 *   unit       string      — appended to tooltip
 */
export default function BarChart({
    data = [],
    height = 180,
    barColor = 'var(--primary)',
    lineData = [],
    lineScale = { min: 0, max: 100 },
    showValues = false,
    unit = '',
}) {
    if (!data.length) return null;

    const PAD_L = 32, PAD_R = 8, PAD_T = showValues ? 20 : 10, PAD_B = 32;
    // Use a fixed per-bar width in viewBox coordinates — scales down with the SVG
    const W_PER_BAR = 24;
    const width  = Math.max(260, data.length * W_PER_BAR + PAD_L + PAD_R);
    const chartH = height - PAD_T - PAD_B;
    const chartW = width  - PAD_L - PAD_R;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const barW   = Math.max(6, (chartW / data.length) * 0.65);
    const barGap = chartW / data.length;

    const bx = (i) => PAD_L + i * barGap + barGap / 2 - barW / 2;
    const bh = (v) => Math.max(1, (v / maxVal) * chartH);
    const by = (v) => PAD_T + chartH - bh(v);

    const lRange = lineScale.max - lineScale.min || 1;
    const ly = (v) => PAD_T + chartH - ((v - lineScale.min) / lRange) * chartH;

    const yTicks = [0, 0.5, 1].map((f) => ({
        y: PAD_T + chartH * (1 - f),
        label: Math.round(maxVal * f),
    }));

    return (
        // width:100% + height:auto + viewBox = chart scales to fill any container
        <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: 'block', width: '100%', height: 'auto' }}
            aria-label="Bar chart"
        >
            {/* Y-axis grid */}
            {yTicks.map(({ y, label }) => (
                <g key={y}>
                    <line x1={PAD_L} x2={width - PAD_R} y1={y} y2={y}
                        stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                    <text x={PAD_L - 4} y={y + 4} textAnchor="end"
                        fontSize={9} fill="var(--muted-foreground)">{label}</text>
                </g>
            ))}

            {/* Bars */}
            {data.map((d, i) => (
                <g key={i}>
                    <rect
                        x={bx(i)} y={by(d.value)}
                        width={barW} height={bh(d.value)}
                        fill={d.color ?? barColor}
                        rx={2} opacity={0.9}
                    >
                        <title>{d.label}: {d.value}{unit}</title>
                    </rect>
                    {showValues && d.value > 0 && (
                        <text x={bx(i) + barW / 2} y={by(d.value) - 3}
                            textAnchor="middle" fontSize={8} fill="var(--foreground)">
                            {d.value}
                        </text>
                    )}
                    {/* X labels — only show every Nth label to avoid clutter */}
                    {(data.length <= 15 || i % Math.ceil(data.length / 12) === 0) && (
                        <text
                            x={bx(i) + barW / 2} y={height - 8}
                            textAnchor="middle" fontSize={9} fill="var(--muted-foreground)"
                            transform={data.length > 15
                                ? `rotate(-40,${bx(i) + barW / 2},${height - 8})`
                                : undefined}
                        >
                            {d.label}
                        </text>
                    )}
                </g>
            ))}

            {/* Overlaid lines */}
            {lineData.map((series, si) => {
                const pts = series.values.map((v, i) => `${bx(i) + barW / 2},${ly(v)}`).join(' ');
                return (
                    <g key={si}>
                        <polyline points={pts} fill="none" stroke={series.color}
                            strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
                        {series.values.map((v, i) => (
                            <circle key={i} cx={bx(i) + barW / 2} cy={ly(v)} r={2.5} fill={series.color}>
                                <title>{series.label}: {v.toFixed(1)}%</title>
                            </circle>
                        ))}
                    </g>
                );
            })}

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
    );
}
