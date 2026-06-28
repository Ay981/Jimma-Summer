import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function DownloadCard({ title, description, href, ext = 'CSV' }) {
    const [clicked, setClicked] = useState(false);
    const isPdf = ext === 'PDF';

    function handleClick() {
        if (isPdf) {
            setClicked(true);
            setTimeout(() => setClicked(false), 6000);
        }
    }

    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '18px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', flexWrap: 'wrap',
        }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{title}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{description}</p>
                {clicked && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 500 }}>
                        Your download will start shortly. If it doesn't, click again in a moment.
                    </p>
                )}
            </div>
            <a
                href={href}
                onClick={handleClick}
                style={{
                    padding: '7px 16px', border: 'none',
                    background: 'var(--primary)', color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem',
                    textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                }}
            >
                Download {ext} ↓
            </a>
        </div>
    );
}

// Async export card — uses Inertia router so we get a real loading state
// while the request is in flight, then the layout's flash toast confirms queuing.
function AsyncExportCard({ title, description, href, ext = 'ZIP' }) {
    const [loading, setLoading] = useState(false);

    function handleClick() {
        if (loading) return;
        setLoading(true);
        router.get(href, {}, {
            onFinish: () => setLoading(false),
        });
    }

    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '18px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', flexWrap: 'wrap',
        }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{title}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{description}</p>
                {loading && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
                        Queuing export…
                    </p>
                )}
            </div>
            <button
                onClick={handleClick}
                disabled={loading}
                style={{
                    padding: '7px 16px', border: 'none',
                    background: loading ? 'var(--muted)' : 'var(--primary)',
                    color: loading ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'background 0.15s',
                }}
            >
                {loading && (
                    <span style={{
                        width: '12px', height: '12px', border: '2px solid currentColor',
                        borderTopColor: 'transparent', borderRadius: '50%',
                        display: 'inline-block', animation: 'spin 0.7s linear infinite',
                    }} />
                )}
                {loading ? 'Queuing…' : `Download ${ext} ↓`}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const STATUS_STYLES = {
    queued:     { bg: 'var(--muted)',        color: 'var(--muted-foreground)', label: 'Queued' },
    processing: { bg: '#fef9c3',             color: '#854d0e',                 label: 'Processing…' },
    ready:      { bg: '#dcfce7',             color: '#166534',                 label: 'Ready' },
    failed:     { bg: '#fee2e2',             color: '#991b1b',                 label: 'Failed' },
};

function ExportStatusPanel({ exports }) {
    // Auto-poll every 3s while any export is still pending
    const hasPending = exports.some(e => e.status === 'queued' || e.status === 'processing');

    useEffect(() => {
        if (!hasPending) return;
        const id = setInterval(() => router.reload({ only: ['exports'] }), 3000);
        return () => clearInterval(id);
    }, [hasPending]);

    if (exports.length === 0) return null;

    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '24px',
        }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                Recent Exports
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {exports.map(e => {
                    const s = STATUS_STYLES[e.status] ?? STATUS_STYLES.queued;
                    return (
                        <div key={e.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: '12px', flexWrap: 'wrap',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem',
                                    fontWeight: 600, background: s.bg, color: s.color,
                                    display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                }}>
                                    {(e.status === 'queued' || e.status === 'processing') && (
                                        <span style={{
                                            width: '8px', height: '8px', border: '1.5px solid currentColor',
                                            borderTopColor: 'transparent', borderRadius: '50%',
                                            display: 'inline-block', animation: 'spin 0.7s linear infinite',
                                        }} />
                                    )}
                                    {s.label}
                                </span>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Certificates ZIP &middot; {e.created_at}
                                </span>
                                {e.status === 'failed' && e.error_message && (
                                    <span style={{ fontSize: '0.8125rem', color: '#991b1b' }}>— {e.error_message}</span>
                                )}
                            </div>
                            {e.download_url && (
                                <a
                                    href={e.download_url}
                                    style={{
                                        padding: '5px 14px', background: 'var(--primary)',
                                        color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)',
                                        fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none',
                                        flexShrink: 0,
                                    }}
                                >
                                    Download ZIP ↓
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Reports({ program_name, exports = [], certificates_published }) {
    return (
        <AdminLayout title="Reports & Exports">
            <Head title="Reports" />

            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                All exports reflect current live data. CSV downloads are instant; ZIP exports are queued and appear below when ready.
            </p>

            <ExportStatusPanel exports={exports} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                    Data Exports
                </h3>

                <DownloadCard
                    title="All Submissions"
                    description="Every submission ever filed — juz, pages, minutes, edited flag, integrity status."
                    href="/admin/reports/submissions"
                />
                <DownloadCard
                    title="Per-Student Summary"
                    description="One row per student: total submissions, pages, minutes, consistency %, streak."
                    href="/admin/reports/student-summary"
                />
                <DownloadCard
                    title="Contact Log"
                    description="All contact notes across all leaders and admins."
                    href="/admin/reports/contact-log"
                />

                <h3 style={{ margin: '16px 0 4px', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                    Certificates
                </h3>

                <AsyncExportCard
                    title="Completion Certificates (ZIP)"
                    description={`PDF certificate for every student who met the ${program_name ? `${program_name} ` : ''}consistency threshold. Queued in the background — export appears below when ready.`}
                    href="/admin/reports/certificates"
                    ext="ZIP"
                />

                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '18px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '16px', flexWrap: 'wrap',
                }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Serve Certificates in Dashboards</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                            {certificates_published
                                ? 'Students and leaders can currently download their certificates from their dashboards.'
                                : 'Enable this after the program ends to let students and leaders download their certificates directly from their dashboards.'}
                        </p>
                    </div>
                    <form method="POST" action="/admin/reports/certificates/publish" onSubmit={e => { e.preventDefault(); router.post('/admin/reports/certificates/publish'); }}>
                        <button type="submit" style={{
                            padding: '7px 16px', border: 'none', cursor: 'pointer',
                            background: certificates_published ? 'var(--destructive)' : 'var(--success)',
                            color: certificates_published ? 'var(--destructive-foreground)' : 'var(--success-foreground)',
                            borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem',
                            whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                            {certificates_published ? 'Remove from Dashboards' : 'Serve in Dashboards'}
                        </button>
                    </form>
                </div>

                <h3 style={{ margin: '16px 0 4px', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                    Full Program Report
                </h3>

                <DownloadCard
                    title="Full Program PDF Report"
                    description={`Complete report for ${program_name ?? 'this program'}: leaderboards, at-risk students, per-halqa breakdown, award winners.`}
                    href="/admin/reports/program-report"
                    ext="PDF"
                />
            </div>
        </AdminLayout>
    );
}
