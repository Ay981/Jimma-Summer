/**
 * LineChart — pure SVG multi-series line / area chart.
 *
 * Props
 *   series   [{label, color, data:[number], fill?:boolean}]
 *   labels   string[]   — x-axis tick labels
 *   height   number
 *   yMax     number     — explicit y ceiling (defaults to data max)
 *   yMin     number
 *   unit     string     — tooltip suffix
 */
export default function LineChart({
    series = [],
    labels = [],
    height = 160,
    yMax,
    yMin = 0,
    unit = '',
}) {
    if (!series.length || !series[0].data.length) return null;

    const PAD_L = 36, PAD_R = 12, PAD_T = 12, PAD_B = 28;
    const nPoints = series[0].data.length;
    const width   = Math.max(300, nPoints * 36 + PAD_L + PAD_R);
    const chartH  = height - PAD_T - PAD_B;
    const chartW  = width - PAD_L - PAD_R;

    const allVals = series.flatMap((s) => s.data);
    const maxY    = yMax  ?? Math.max(...allVals, 1);
    const minY    = yMin;
    const range   = maxY - minY || 1;

    const px = (i) => PAD_L + (i / Math.max(nPoints - 1, 1)) * chartW;
    const py = (v) => PAD_T + chartH - ((v - minY) / range) * chartH;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: PAD_T + chartH * (1 - f),
        label: Math.round(minY + range * f),
    }));

    return (
        <div style={{ overflowX: 'auto' }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
                {/* Grid */}
                {yTicks.map(({ y, label }) => (
                    <g key={y}>
                        <line x1={PAD_L} x2={width - PAD_R} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                        <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">{label}</text>
                    </g>
                ))}

                {/* Series */}
                {series.map((s, si) => {
                    const pts = s.data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
                    const areaBase = py(minY);
                    const areaPath = `M${px(0)},${areaBase} ` +
                        s.data.map((v, i) => `L${px(i)},${py(v)}`).join(' ') +
                        ` L${px(s.data.length - 1)},${areaBase} Z`;

                    return (
                        <g key={si}>
                            {s.fill !== false && (
                                <path d={areaPath} fill={s.color} opacity={0.12} />
                            )}
                            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
                            {s.data.map((v, i) => (
                                <circle key={i} cx={px(i)} cy={py(v)} r={3} fill={s.color}>
                                    <title>{s.label} — {labels[i] ?? i}: {v.toFixed(1)}{unit}</title>
                                </circle>
                            ))}
                        </g>
                    );
                })}

                {/* X labels */}
                {labels.map((lbl, i) => (
                    <text key={i} x={px(i)} y={height - 6} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)"
                        transform={labels.length > 10 ? `rotate(-45,${px(i)},${height - 6})` : undefined}>
                        {lbl}
                    </text>
                ))}

                {/* Legend */}
                {series.length > 1 && (
                    <g transform={`translate(${PAD_L},${PAD_T - 2})`}>
                        {series.map((s, i) => (
                            <g key={i} transform={`translate(${i * 120},0)`}>
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
