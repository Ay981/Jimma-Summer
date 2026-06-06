export default function Sparkline({ data = [], width = 72, height = 20, color = 'var(--success)' }) {
    if (!data || data.length < 2) return null;

    const max   = Math.max(...data, 1);
    const min   = 0;
    const range = max - min || 1;

    // Use viewBox for responsive scaling when used in flexible containers
    const vw = 72, vh = 20;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * vw;
        const y = vh - ((val - min) / range) * (vh - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
        <svg
            viewBox={`0 0 ${vw} ${vh}`}
            width={width}
            height={height}
            style={{ display: 'block' }}
        >
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
