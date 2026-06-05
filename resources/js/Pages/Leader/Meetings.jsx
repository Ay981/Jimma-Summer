import { Head, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import LeaderLayout from '@/Layouts/LeaderLayout';

function MeetingCard({ meeting }) {
    function del() {
        if (!confirm('Delete this meeting log?')) return;
        router.delete(`/leader/meetings/${meeting.id}`, { preserveScroll: true });
    }

    const dateStr = new Date(meeting.meeting_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div style={{
            padding: '14px 16px', background: 'var(--card)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{dateStr}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {meeting.attendance_count} attendee{meeting.attendance_count !== 1 ? 's' : ''}
                    </p>
                    {meeting.notes && (
                        <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                            {meeting.notes}
                        </p>
                    )}
                </div>
                <button
                    onClick={del}
                    style={{
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--muted-foreground)', fontSize: '0.75rem', cursor: 'pointer',
                    }}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export default function Meetings({ meetings, halqa }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        meeting_date:     new Date().toISOString().split('T')[0],
        attendance_count: '',
        notes:            '',
    });

    function submit(e) {
        e.preventDefault();
        post('/leader/meetings', {
            onSuccess: () => reset(),
        });
    }

    return (
        <LeaderLayout title={`Meetings · ${halqa?.name ?? ''}`}>
            <Head title="Meeting Log" />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 320px',
                gap: '20px', alignItems: 'start',
            }}
                className="meetings-grid"
            >
                {/* Log list */}
                <div>
                    <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>
                        Past Meetings
                    </h2>
                    {meetings.length === 0 ? (
                        <div style={{
                            padding: '40px', textAlign: 'center',
                            background: 'var(--card)', borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)', color: 'var(--muted-foreground)',
                            fontSize: '0.875rem',
                        }}>
                            No meetings logged yet.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {meetings.map((m) => <MeetingCard key={m.id} meeting={m} />)}
                        </div>
                    )}
                </div>

                {/* Log new meeting form */}
                <div style={{
                    background: 'var(--card)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)', overflow: 'hidden',
                    position: 'sticky', top: '70px',
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Log a Meeting</h3>
                    </div>
                    <form onSubmit={submit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                                Date
                            </label>
                            <input
                                type="date"
                                value={data.meeting_date}
                                onChange={(e) => setData('meeting_date', e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '7px 10px', boxSizing: 'border-box',
                                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                    background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem',
                                }}
                            />
                            {errors.meeting_date && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.meeting_date}</p>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                                Attendance
                            </label>
                            <input
                                type="number"
                                value={data.attendance_count}
                                onChange={(e) => setData('attendance_count', e.target.value)}
                                min={0}
                                required
                                placeholder="0"
                                style={{
                                    width: '100%', padding: '7px 10px', boxSizing: 'border-box',
                                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                    background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem',
                                }}
                            />
                            {errors.attendance_count && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.attendance_count}</p>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                                Notes
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Meeting notes..."
                                rows={5}
                                style={{
                                    width: '100%', padding: '7px 10px', boxSizing: 'border-box',
                                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                    background: 'var(--background)', color: 'var(--foreground)',
                                    fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                padding: '9px', borderRadius: 'var(--radius-sm)',
                                border: 'none', background: 'var(--primary)',
                                color: 'var(--primary-foreground)', fontSize: '0.9rem',
                                fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {processing ? 'Saving...' : 'Log Meeting'}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .meetings-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </LeaderLayout>
    );
}
