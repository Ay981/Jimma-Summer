import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function DownloadCard({ title, description, href, ext = 'CSV' }) {
    const [clicked, setClicked] = useState(false);
    const isPdf = ext === 'PDF' || ext === 'ZIP';

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

export default function Reports({ program_name }) {
    return (
        <AdminLayout title="Reports & Exports">
            <Head title="Reports" />

            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                All exports reflect current live data. CSV downloads are instant; PDF and ZIP files may take a few seconds to generate.
            </p>

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

                <DownloadCard
                    title="Completion Certificates (ZIP)"
                    description={`PDF certificate for every student who met the ${program_name ? `${program_name} ` : ''}consistency threshold. Batch download as ZIP.`}
                    href="/admin/reports/certificates"
                    ext="ZIP"
                />

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
