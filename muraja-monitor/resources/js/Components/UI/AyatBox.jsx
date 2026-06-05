export default function AyatBox({ text, reference }) {
    if (!text) return null;
    return (
        <div style={{
            borderLeft: '4px solid var(--accent)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderLeftWidth: '4px',
            borderLeftColor: 'var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
        }}>
            <p style={{
                fontStyle: 'italic',
                color: 'var(--foreground)',
                fontSize: '0.9375rem',
                lineHeight: 1.7,
                margin: 0,
            }}>
                "{text}"
            </p>
            <p style={{
                color: 'var(--muted-foreground)',
                fontSize: '0.8125rem',
                marginTop: '0.5rem',
                marginBottom: 0,
                fontWeight: 500,
            }}>
                — {reference}
            </p>
        </div>
    );
}
