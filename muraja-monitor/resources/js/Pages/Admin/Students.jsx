import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import SegmentedBar from '@/Components/UI/SegmentedBar';
import Sparkline from '@/Components/UI/Sparkline';
import StatusTag from '@/Components/UI/StatusTag';

// ── Shared button styles ──────────────────────────────────────────────────────

const outlineBtn = {
    padding: '7px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'transparent',
    fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--foreground)',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    textDecoration: 'none', whiteSpace: 'nowrap',
};

const inp = {
    padding: '5px 10px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--foreground)', fontSize: '0.8125rem', width: '100%',
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }) {
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 120;
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: `oklch(62% 0.10 ${hue + 100})`, color: 'var(--warm-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.34 + 'px', fontWeight: 700,
        }}>
            {initials}
        </div>
    );
}

// ── ID generation ─────────────────────────────────────────────────────────────

function generateNextId(students) {
    const year = new Date().getFullYear();
    const prefix = `JUMU-${year}-`;
    const nums = (students ?? [])
        .map((s) => s.student_id ?? '')
        .filter((id) => id.startsWith(prefix))
        .map((id) => parseInt(id.slice(prefix.length), 10))
        .filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
}

// ── Add Student modal ─────────────────────────────────────────────────────────

function AddStudentModal({ halqas, students, onClose }) {
    const suggestedId = generateNextId(students);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', student_id: suggestedId, phone: '', halqa_id: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/admin/students', { onSuccess: () => { reset(); onClose(); } });
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
        }} onClick={onClose}>
            <div style={{
                background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '24px',
                width: '440px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
            }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Add Student</h3>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Name */}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Full Name *</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Ahmed Ali" required
                            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                        {errors.name && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone *</label>
                        <input type="text" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="09..." required
                            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                        {errors.phone && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.phone}</p>}
                    </div>

                    {/* Student ID + Generate */}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Student ID *</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input type="text" value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} placeholder="JUMU-2026-001" required
                                style={{ flex: 1, boxSizing: 'border-box', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }} />
                            <button type="button" onClick={() => setData('student_id', generateNextId(students))}
                                style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--foreground)', fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                ↻ Generate
                            </button>
                        </div>
                        {errors.student_id && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.student_id}</p>}
                    </div>

                    {/* Halqa — required */}
                    <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Halqa *</label>
                        <select value={data.halqa_id} onChange={(e) => setData('halqa_id', e.target.value)} required
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem' }}>
                            <option value="">— Select halqa —</option>
                            {halqas.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                        {errors.halqa_id && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.halqa_id}</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: '0.875rem', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {processing && <span className="spinner spinner-sm" />}
                            {processing ? 'Creating…' : 'Create Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── CSV Import modal / mobile bottom drawer ───────────────────────────────────

function ImportModal({ onClose }) {
    const [csvFile, setCsvFile] = useState(null);
    const [result, setResult]   = useState(null);
    const [processing, setProc] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef();

    function submit(e) {
        e.preventDefault();
        if (!csvFile) return;
        setProc(true);
        const form = new FormData();
        form.append('csv', csvFile);
        router.post('/admin/students/import', form, {
            forceFormData: true,
            onSuccess: (page) => {
                const r = page.props?.flash?.import_result;
                setResult(r ?? { created: 0, failed: [] });
            },
            onFinish: () => setProc(false),
        });
    }

    function downloadFailed() {
        if (!result?.failed?.length) return;
        const header = 'line,student_id,reason\n';
        const rows = result.failed.map((f) => `${f.line},"${f.data}","${f.reason}"`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'failed-import.csv';
        a.click();
    }

    function downloadTemplate() {
        const header = 'name,student_id,phone,current_juz,available_times,has_pair_request,requested_partner_name,requested_partner_phone\n';
        const example = 'Ahmed Ali,JUMU-2026-001,0912345678,15,after_asr|after_isha,0,,\n';
        const blob = new Blob([header + example], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'students-template.csv';
        a.click();
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) setCsvFile(file);
    }

    return (
        <div
            className="import-modal-backdrop"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}
            onClick={onClose}
        >
            <div
                className="import-modal-inner"
                style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '480px', maxWidth: '100%' }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>Import Students via CSV</h3>

                {!result ? (
                    <>
                        {/* Expected columns */}
                        <div style={{ background: 'var(--muted)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '12px' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected columns</p>
                            <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--foreground)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                <code>{'name, student_id, phone,\ncurrent_juz, available_times,\nhas_pair_request,\nrequested_partner_name,\nrequested_partner_phone'}</code>
                            </pre>
                        </div>

                        {/* Download template */}
                        <button onClick={downloadTemplate} style={{ ...outlineBtn, marginBottom: '12px', fontSize: '0.8125rem' }}>
                            ⬇ Download template CSV
                        </button>

                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Dropzone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={onDrop}
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    padding: '28px 16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: dragging ? 'var(--secondary)' : 'var(--background)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 500 }}>
                                    {csvFile ? `✓ ${csvFile.name}` : 'Drop CSV here or click to browse'}
                                </p>
                                {!csvFile && (
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Accepts .csv only</p>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={(e) => setCsvFile(e.target.files[0] ?? null)}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={onClose} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', fontSize: '0.875rem', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing || !csvFile} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: '0.875rem', fontWeight: 600, cursor: (processing || !csvFile) ? 'not-allowed' : 'pointer', opacity: !csvFile ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    {processing && <span className="spinner spinner-sm" />}
                                    {processing ? 'Importing…' : 'Import'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div>
                        <div style={{ padding: '12px 14px', background: result.created > 0 ? 'var(--success)' : 'var(--muted)', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: result.created > 0 ? 'var(--success-foreground)' : 'var(--foreground)' }}>
                                ✓ {result.created} student{result.created !== 1 ? 's' : ''} created
                            </p>
                        </div>

                        {result.failed?.length > 0 && (
                            <>
                                <p style={{ margin: '0 0 6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--destructive)' }}>
                                    ✗ {result.failed.length} row{result.failed.length !== 1 ? 's' : ''} skipped:
                                </p>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}>
                                    {result.failed.map((f, i) => (
                                        <div key={i} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                                            <span style={{ color: 'var(--muted-foreground)' }}>Line {f.line} · {f.data}</span>
                                            <span style={{ color: 'var(--destructive)', marginLeft: '6px' }}>— {f.reason}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={downloadFailed} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--secondary)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '12px' }}>
                                    Download failed rows ↓
                                </button>
                            </>
                        )}

                        <div style={{ textAlign: 'right' }}>
                            <button onClick={onClose} style={{ padding: '7px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Done</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Student row ───────────────────────────────────────────────────────────────

function StudentRow({ student }) {
    const sparkColor = { on_track: 'var(--success)', slipping: 'oklch(70% 0.15 84)', at_risk: 'var(--destructive)', inactive: 'var(--muted-foreground)' }[student.status] ?? 'var(--success)';

    const lastSeenStr = student.last_sub
        ? new Date(student.last_sub).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : 'Never';

    return (
        <Link
            href={`/admin/students/${student.id}`}
            className="student-row"
            style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 90px 80px 50px 60px 70px auto',
                alignItems: 'center', gap: '10px',
                padding: '10px 14px', textDecoration: 'none', color: 'var(--foreground)',
                borderBottom: '1px solid var(--border)',
                background: student.is_monitored ? 'var(--status-slipping-bg)' : 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = student.is_monitored ? 'var(--status-slipping-bg)' : 'transparent')}
        >
            <Avatar name={student.name} size={32} />

            <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.name}
                    {!student.is_active && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 400 }}>inactive</span>}
                    {student.is_monitored && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', color: 'oklch(60% 0.12 50)', fontWeight: 600 }}>⚑</span>}
                    {student.must_change_password && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', background: 'var(--status-slipping-bg)', color: 'var(--status-slipping)', fontWeight: 600, padding: '1px 5px', borderRadius: '3px' }}>No login</span>}
                    {!student.must_change_password && !student.profile_completed && <span style={{ marginLeft: '6px', fontSize: '0.6875rem', background: 'var(--status-slipping-bg)', color: 'var(--status-slipping)', fontWeight: 600, padding: '1px 5px', borderRadius: '3px' }}>No profile</span>}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.halqa} {student.partner ? `· ↔ ${student.partner}` : '· no pair'}
                </p>
            </div>

            <div className="hide-mobile">
                <SegmentedBar value={student.consistency} max={100} segments={10} />
            </div>

            <span className="hide-mobile">
                <Sparkline data={student.sparkline} width={72} height={20} color={sparkColor} />
            </span>

            <span style={{ fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {student.consistency}%
            </span>

            <span className="hide-mobile" style={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--muted-foreground)' }}>
                {student.streak}d
            </span>

            <span className="hide-mobile" style={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--muted-foreground)' }}>
                {lastSeenStr}
            </span>

            <StatusTag status={student.status} />
        </Link>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Students({ students, halqas }) {
    const [tab, setTab]               = useState('All');
    const [search, setSearch]         = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterHalqa, setFilterHalqa]   = useState('');
    const [sortBy, setSortBy]         = useState('name');
    const [showAdd, setShowAdd]       = useState(false);
    const [showImport, setShowImport] = useState(false);

    const filtered = useMemo(() => {
        let list = [...(students ?? [])];

        if (tab === 'At Risk')   list = list.filter((s) => s.status === 'at_risk' || s.status === 'inactive');
        if (tab === 'Watchlist') list = list.filter((s) => s.on_watchlist);
        if (tab === 'Not Set Up') list = list.filter((s) => s.must_change_password || !s.profile_completed);

        if (filterStatus) list = list.filter((s) => s.status === filterStatus);
        if (filterHalqa)  list = list.filter((s) => s.halqa === filterHalqa || String(s.halqa_id) === filterHalqa);

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((s) => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));
        }

        if (sortBy === 'consistency') list.sort((a, b) => b.consistency - a.consistency);
        else if (sortBy === 'streak')  list.sort((a, b) => b.streak - a.streak);
        else if (sortBy === 'name')    list.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'last_seen') list.sort((a, b) => {
            const da = a.last_sub ? new Date(a.last_sub) : new Date(0);
            const db = b.last_sub ? new Date(b.last_sub) : new Date(0);
            return db - da;
        });

        return list;
    }, [students, tab, search, filterStatus, filterHalqa, sortBy]);

    const summary = useMemo(() => ({
        total:      (students ?? []).length,
        active:     (students ?? []).filter((s) => s.is_active).length,
        at_risk:    (students ?? []).filter((s) => s.status === 'at_risk' || s.status === 'inactive').length,
        watchlist:  (students ?? []).filter((s) => s.on_watchlist).length,
        not_set_up: (students ?? []).filter((s) => s.must_change_password || !s.profile_completed).length,
    }), [students]);

    const TABS = ['All', 'At Risk', 'Watchlist', 'Not Set Up'];

    return (
        <AdminLayout title="Students">
            <Head title="Students" />

            {/* ── Header actions: PDF (left) | Import CSV (right) ─────────── */}
            <div className="students-header-actions">
                <a href="/admin/students/credentials-pdf" target="_blank" style={outlineBtn}>
                    ⬇ Credentials PDF
                </a>
                <button onClick={() => setShowImport(true)} style={outlineBtn}>
                    ⬆ Import CSV
                </button>
            </div>

            {/* ── Stat cards (2-col on mobile, auto-fit on desktop) ────────── */}
            <div className="stat-grid" style={{ marginBottom: '20px' }}>
                {[
                    { label: 'Total',            value: summary.total },
                    { label: 'Active',           value: summary.active },
                    { label: 'At Risk / Inactive', value: summary.at_risk,    warn: summary.at_risk > 0 },
                    { label: 'Watchlist',        value: summary.watchlist },
                    { label: 'Not Set Up',       value: summary.not_set_up,  goldWarn: summary.not_set_up > 0 },
                ].map(({ label, value, warn, goldWarn }, i, arr) => (
                    <div
                        key={label}
                        className={i === arr.length - 1 && arr.length % 2 !== 0 ? 'stat-card-full' : ''}
                        style={{ padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'baseline' }}
                    >
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: warn ? 'var(--destructive)' : goldWarn ? 'var(--gold-500)' : 'var(--foreground)' }}>{value}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* ── Tabs: desktop row / mobile select ───────────────────────── */}
            <div style={{ marginBottom: '8px' }}>
                <div className="tab-row-desktop">
                    {TABS.map((t) => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '5px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer',
                            background: tab === t ? 'var(--primary)' : 'var(--card)',
                            color: tab === t ? 'var(--primary-foreground)' : 'var(--foreground)',
                            fontWeight: tab === t ? 600 : 400, fontSize: '0.8125rem',
                        }}>{t}</button>
                    ))}
                </div>
                <select
                    className="tab-select-mobile"
                    value={tab}
                    onChange={(e) => setTab(e.target.value)}
                >
                    {TABS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* ── Filters: status + halqa, then sort + search ──────────────── */}
            <div className="filter-row-dropdowns">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inp}>
                    <option value="">All statuses</option>
                    <option value="on_track">On Track</option>
                    <option value="slipping">Slipping</option>
                    <option value="at_risk">At Risk</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select value={filterHalqa} onChange={(e) => setFilterHalqa(e.target.value)} style={inp}>
                    <option value="">All halqas</option>
                    {(halqas ?? []).map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
                </select>
            </div>
            <div className="filter-row-dropdowns" style={{ marginBottom: '12px' }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inp}>
                    <option value="name">Sort: Name</option>
                    <option value="consistency">Sort: Consistency</option>
                    <option value="streak">Sort: Streak</option>
                    <option value="last_seen">Sort: Last Seen</option>
                </select>
                <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or ID…"
                    style={inp}
                />
            </div>

            {/* ── Column headers ───────────────────────────────────────────── */}
            <div className="student-row" style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 90px 80px 50px 60px 70px auto',
                gap: '10px', padding: '5px 14px',
            }}>
                {[
                    { label: '',         cls: '' },
                    { label: 'Student',  cls: '' },
                    { label: 'Bar',      cls: 'hide-mobile' },
                    { label: '14 days',  cls: 'hide-mobile' },
                    { label: '%',        cls: '' },
                    { label: 'Streak',   cls: 'hide-mobile' },
                    { label: 'Last Sub', cls: 'hide-mobile' },
                    { label: 'Status',   cls: '' },
                ].map(({ label, cls }, i) => (
                    <span key={i} className={cls} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                    </span>
                ))}
            </div>

            <style>{`
                @media (max-width: 640px) {
                    .student-row {
                        grid-template-columns: 36px 1fr 50px auto !important;
                        gap: 8px !important;
                    }
                    .hide-mobile { display: none !important; }
                }
            `}</style>

            {/* ── Student list ─────────────────────────────────────────────── */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                    <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', margin: 0 }}>No students match current filters.</p>
                ) : (
                    filtered.map((s) => <StudentRow key={s.id} student={s} />)
                )}
            </div>

            {/* ── Add Student — full-width at bottom ───────────────────────── */}
            <div className="add-student-footer">
                <button
                    onClick={() => setShowAdd(true)}
                    style={{ padding: '10px 20px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}
                >
                    + Add Student
                </button>
            </div>

            {showAdd    && <AddStudentModal halqas={halqas} students={students} onClose={() => setShowAdd(false)} />}
            {showImport && <ImportModal onClose={() => setShowImport(false)} />}
        </AdminLayout>
    );
}
