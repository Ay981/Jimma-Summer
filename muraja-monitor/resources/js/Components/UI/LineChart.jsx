/**
 * LineChart — responsive SVG, fills its container.
 *
 * Props
 *   series   [{label, color, data:[number], fill?:boolean}]
 *   labels   string[]   — x-axis tick labels
 *   height   number     — viewBox height
 *   yMax     number     — explicit y ceiling
 *   yMin     number
 *   unit     string
 */
export default function LineChart({
    series = [],
    labels = [],
    height = 180,
    yMax,
    yMin = 0,
    unit = '',
}) {
    if (!series.length || !series[0].data.length) return null;

    const PAD_L = 36, PAD_R = 12, PAD_T = 14, PAD_B = 40;
    const nPoints = series[0].data.length;
    // Per-point spacing — wide enough that labels like "Wk 18/04" (~44px) don't collide
    const PX_PER_PT = 56;
    const width  = Math.max(320, nPoints * PX_PER_PT + PAD_L + PAD_R);
    const chartH = height - PAD_T - PAD_B;
    const chartW = width  - PAD_L - PAD_R;

    // Font size scales with viewBox so it looks consistent regardless of point count
    const FS = Math.round(Math.max(7, Math.min(10, width / 40)));

    const allVals = series.flatMap((s) => s.data);
    const maxY    = yMax ?? Math.max(...allVals, 1);
    const minY    = yMin;
    const range   = maxY - minY || 1;

    const px = (i) => PAD_L + (i / Math.max(nPoints - 1, 1)) * chartW;
    const py = (v) => PAD_T + chartH - ((v - minY) / range) * chartH;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: PAD_T + chartH * (1 - f),
        label: Math.round(minY + range * f),
    }));

    // Show every Nth x-label so they don't crowd
    const labelStep = Math.max(1, Math.ceil(nPoints / 8));

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: 'block', width: '100%', height: 'auto' }}
            aria-label="Line chart"
        >
            {/* Grid */}
            {yTicks.map(({ y, label }) => (
                <g key={y}>
                    <line x1={PAD_L} x2={width - PAD_R} y1={y} y2={y}
                        stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
                    <text x={PAD_L - 4} y={y + 4} textAnchor="end"
                        fontSize={FS} fill="var(--muted-foreground)">{label}</text>
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
                        <polyline points={pts} fill="none" stroke={s.color}
                            strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
                        {s.data.map((v, i) => (
                            <circle key={i} cx={px(i)} cy={py(v)} r={3} fill={s.color}>
                                <title>{s.label} — {labels[i] ?? i}: {v.toFixed(1)}{unit}</title>
                            </circle>
                        ))}
                    </g>
                );
            })}

            {/* X labels — thinned out to avoid overlap */}
            {labels.map((lbl, i) => {
                if (i % labelStep !== 0 && i !== labels.length - 1) return null;
                const rotate = nPoints > 6;
                return (
                    <text key={i} x={px(i)} y={height - 8}
                        textAnchor={rotate ? 'end' : 'middle'}
                        fontSize={FS} fill="var(--muted-foreground)"
                        transform={rotate ? `rotate(-40,${px(i)},${height - 8})` : undefined}>
                        {lbl}
                    </text>
                );
            })}

            {/* Legend */}
            {series.length > 1 && (
                <g transform={`translate(${PAD_L},${PAD_T - 2})`}>
                    {series.map((s, i) => (
                        <g key={i} transform={`translate(${i * 120},0)`}>
                            <line x1={0} x2={14} y1={0} y2={0} stroke={s.color} strokeWidth={2} />
                            <text x={17} y={3} fontSize={FS} fill="var(--muted-foreground)">{s.label}</text>
                        </g>
                    ))}
                </g>
            )}
        </svg>
    );
}
