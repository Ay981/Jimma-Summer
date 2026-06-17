import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AyatBox from '@/Components/UI/AyatBox';
import Heatmap from '@/Components/UI/Heatmap';
import SegmentedBar from '@/Components/UI/SegmentedBar';
import StudentLayout from '@/Layouts/StudentLayout';
const JUZ_LABELS = {
    1:'Al-Fātiḥah',2:'Al-Baqarah 142',3:'Al-Baqarah 253',4:"Āl ʿImrān 92",
    5:'An-Nisāʾ 24',6:'An-Nisāʾ 148',7:"Al-Māʾidah 82",8:"Al-Anʿām 111",
    9:"Al-Aʿrāf 88",10:'Al-Anfāl 41',11:'At-Tawbah 94',12:'Hūd 6',
    13:'Yūsuf 53',14:'Al-Ḥijr 1',15:'Al-Isrāʾ 1',16:'Al-Kahf 75',
    17:'Al-Anbiyāʾ 1',18:"Al-Muʾminūn 1",19:'Al-Furqān 21',20:'An-Naml 56',
    21:"Al-ʿAnkabūt 46",22:'Al-Aḥzāb 31',23:'Yā-Sīn 28',24:'Az-Zumar 32',
    25:'Fuṣṣilat 47',26:'Al-Aḥqāf 1',27:'Adh-Dhāriyāt 31',28:'Al-Mujādilah 1',
    29:'Al-Mulk 1',30:"An-Nabaʾ 1",
};

function StatCard({ label, value, sub }) {
    return (
        <div style={{
            background:'var(--card)',border:'1px solid var(--border)',
            borderRadius:'var(--radius-lg)',padding:'16px',
        }}>
            <p style={{margin:0,fontSize:'0.75rem',color:'var(--muted-foreground)',fontWeight:500}}>{label}</p>
            <p style={{margin:'4px 0 2px',fontSize:'1.75rem',fontWeight:700,color:'var(--foreground)',lineHeight:1}}>{value}</p>
            {sub && <p style={{margin:0,fontSize:'0.75rem',color:'var(--muted-foreground)'}}>{sub}</p>}
        </div>
    );
}

function SubmissionForm({ pairId }) {
    const { data, setData, post, processing, errors } = useForm({
        juz: '', page_from: '', page_to: '', minutes_spent: '',
    });

    const inp = (extra) => ({
        padding:'8px 10px',background:'var(--background)',
        border:`1px solid var(--border)`,borderRadius:'var(--radius-md)',
        color:'var(--foreground)',fontSize:'0.9rem',outline:'none',
        width:'100%',boxSizing:'border-box',...extra,
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); post('/student/checkin'); }}
            style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div>
                <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Juz</label>
                <select data-onboard="juz-field" value={data.juz} onChange={e=>setData('juz',e.target.value)} style={inp()}>
                    <option value="">Select juz…</option>
                    {Array.from({length:30},(_,i)=>i+1).map(j=>(
                        <option key={j} value={j}>Juz {j} — {JUZ_LABELS[j]}</option>
                    ))}
                </select>
                {errors.juz && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.juz}</p>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div>
                    <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Page from</label>
                    <input type="number" min="1" max="604" value={data.page_from}
                        onChange={e=>setData('page_from',e.target.value)} placeholder="1–604" style={inp()} />
                    {errors.page_from && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.page_from}</p>}
                </div>
                <div>
                    <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Page to</label>
                    <input type="number" min="1" max="604" value={data.page_to}
                        onChange={e=>setData('page_to',e.target.value)} placeholder="1–604" style={inp()} />
                    {errors.page_to && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.page_to}</p>}
                </div>
            </div>
            <div>
                <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Minutes spent</label>
                <input type="number" min="1" max="480" value={data.minutes_spent}
                    onChange={e=>setData('minutes_spent',e.target.value)} placeholder="e.g. 30" style={inp()} />
                {errors.minutes_spent && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.minutes_spent}</p>}
            </div>
            {errors.submit && <p style={{color:'var(--destructive)',fontSize:'0.8125rem',margin:0}}>{errors.submit}</p>}
            <button data-onboard="submit-btn" type="submit" disabled={processing} style={{
                padding:'10px',background:'var(--primary)',color:'var(--primary-foreground)',
                border:'none',borderRadius:'var(--radius-md)',fontWeight:600,fontSize:'0.9375rem',
                cursor:processing?'not-allowed':'pointer',opacity:processing?0.7:1,
            }}>
                {processing ? 'Submitting…' : 'Submit Revision'}
            </button>
        </form>
    );
}

function WeeklyTargetEditor({ currentTarget }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing } = useForm({ weekly_target: currentTarget });
    return editing ? (
        <form onSubmit={(e)=>{e.preventDefault();put('/student/settings/weekly-target',{onSuccess:()=>setEditing(false)});}}
            style={{display:'flex',gap:'6px',alignItems:'center'}}>
            <input type="number" min="1" max="604" value={data.weekly_target}
                onChange={e=>setData('weekly_target',e.target.value)}
                style={{width:'64px',padding:'4px 6px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',background:'var(--background)',color:'var(--foreground)',fontSize:'0.875rem'}} />
            <button type="submit" disabled={processing}
                style={{padding:'4px 10px',background:'var(--primary)',color:'var(--primary-foreground)',border:'none',borderRadius:'var(--radius-sm)',fontSize:'0.8125rem',cursor:'pointer'}}>
                Save
            </button>
            <button type="button" onClick={()=>setEditing(false)}
                style={{padding:'4px 8px',background:'var(--muted)',color:'var(--foreground)',border:'none',borderRadius:'var(--radius-sm)',fontSize:'0.8125rem',cursor:'pointer'}}>
                Cancel
            </button>
        </form>
    ) : (
        <button onClick={()=>setEditing(true)}
            style={{background:'none',border:'none',color:'var(--accent)',fontSize:'0.8125rem',cursor:'pointer',padding:0}}>
            Edit target
        </button>
    );
}

// ── Edit today's submission ───────────────────────────────────────────────────

function EditSubmissionForm({ submission, partner, onCancel }) {
    const { data, setData, put, processing, errors } = useForm({
        juz:           String(submission.juz),
        page_from:     String(submission.page_from),
        page_to:       String(submission.page_to),
        minutes_spent: String(submission.minutes_spent),
    });

    const inp = {
        padding:'8px 10px', background:'var(--background)',
        border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
        color:'var(--foreground)', fontSize:'0.9rem', outline:'none',
        width:'100%', boxSizing:'border-box',
    };

    function submit(e) {
        e.preventDefault();
        put(`/student/checkin/${submission.id}`, { onSuccess: onCancel });
    }

    return (
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div>
                <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Juz</label>
                <select value={data.juz} onChange={e=>setData('juz',e.target.value)} style={inp}>
                    {Array.from({length:30},(_,i)=>i+1).map(j=>(
                        <option key={j} value={j}>Juz {j}</option>
                    ))}
                </select>
                {errors.juz && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.juz}</p>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div>
                    <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Page from</label>
                    <input type="number" min="1" max="604" value={data.page_from} onChange={e=>setData('page_from',e.target.value)} style={inp} />
                    {errors.page_from && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.page_from}</p>}
                </div>
                <div>
                    <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Page to</label>
                    <input type="number" min="1" max="604" value={data.page_to} onChange={e=>setData('page_to',e.target.value)} style={inp} />
                    {errors.page_to && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.page_to}</p>}
                </div>
            </div>
            <div>
                <label style={{fontSize:'0.8125rem',fontWeight:500,color:'var(--foreground)',display:'block',marginBottom:'4px'}}>Minutes spent</label>
                <input type="number" min="1" max="480" value={data.minutes_spent} onChange={e=>setData('minutes_spent',e.target.value)} style={inp} />
                {errors.minutes_spent && <p style={{color:'var(--destructive)',fontSize:'0.75rem',margin:'2px 0 0'}}>{errors.minutes_spent}</p>}
            </div>
            {errors.edit && <p style={{color:'var(--destructive)',fontSize:'0.8125rem',margin:0}}>{errors.edit}</p>}
            <div style={{display:'flex',gap:'8px'}}>
                <button type="submit" disabled={processing} style={{
                    flex:1, padding:'9px', background:'var(--primary)', color:'var(--primary-foreground)',
                    border:'none', borderRadius:'var(--radius-md)', fontWeight:600, fontSize:'0.9rem',
                    cursor:processing?'not-allowed':'pointer', opacity:processing?0.7:1,
                }}>
                    {processing ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={onCancel} style={{
                    padding:'9px 16px', background:'var(--muted)', color:'var(--foreground)',
                    border:'none', borderRadius:'var(--radius-md)', fontSize:'0.9rem', cursor:'pointer',
                }}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

// ── Excuse / makeup card ──────────────────────────────────────────────────────

function ExcuseCard({ missed, scheduledDays = [] }) {
    const [open, setOpen] = useState(null); // missed_date string of the open form
    const { data, setData, post, processing, errors, reset } = useForm({
        missed_date: '',
        reason:      '',
        makeup_date: '',
    });

    function openForm(date, weekEnd) {
        setOpen(date);
        setData({ missed_date: date, reason: '', makeup_date: weekEnd });
    }

    function submit(e) {
        e.preventDefault();
        post('/student/excuse', { preserveScroll: true, onSuccess: () => { setOpen(null); reset(); } });
    }

    const inp = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ background: 'var(--status-slipping-bg)', border: '1px solid var(--status-slipping-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--status-slipping-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem' }}>⏳</span>
                <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--status-slipping)' }}>
                    Missed Day — Excuse Window Open
                </p>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--foreground)' }}>
                    You missed a scheduled day. File an excuse within 48 hours and propose a makeup date <strong>in the same week</strong> to protect your streak.
                </p>
                {scheduledDays.length > 0 && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--status-slipping)', fontWeight: 500 }}>
                        ⚠ Makeup must be on a day <strong>outside</strong> your regular schedule ({scheduledDays.join(', ')}).
                    </p>
                )}
                {missed.map((m) => (
                    <div key={m.date}>
                        {open === m.date ? (
                            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600 }}>{m.label}</p>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '3px' }}>Reason</label>
                                    <textarea value={data.reason} onChange={e => setData('reason', e.target.value)} rows={2} required
                                        style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Brief reason for missing…" />
                                    {errors.reason && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.reason}</p>}
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '3px' }}>
                                        Makeup date — must be outside your regular schedule, within this week
                                    </label>
                                    <input type="date" value={data.makeup_date} onChange={e => setData('makeup_date', e.target.value)}
                                        min={new Date().toISOString().slice(0,10)} max={m.week_end} required style={inp} />
                                    {errors.makeup_date && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.makeup_date}</p>}
                                </div>
                                {errors.error && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--destructive)' }}>{errors.error}</p>}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button type="submit" disabled={processing} style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                                        {processing ? 'Filing…' : 'File Excuse'}
                                    </button>
                                    <button type="button" onClick={() => setOpen(null)} style={{ padding: '6px 10px', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gap: '8px' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{m.label}</span>
                                <button onClick={() => openForm(m.date, m.week_end)} style={{ padding: '4px 12px', border: 'none', background: 'var(--warning)', color: 'var(--warning-foreground)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    File Excuse
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function PendingExcusesBanner({ excuses }) {
    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Pending Makeups</p>
            {excuses.map((e) => (
                <div key={e.missed_date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', gap: '8px' }}>
                    <span>Missed <strong>{new Date(e.missed_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</strong> — makeup due <strong>{new Date(e.makeup_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</strong></span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--status-slipping-bg)', color: 'var(--status-slipping)', borderRadius: '99px', fontWeight: 600, whiteSpace: 'nowrap' }}>pending</span>
                </div>
            ))}
        </div>
    );
}

export default function Dashboard({
    name, streak, consistency, pages_total, minutes_total,
    weekly_target, week_pages, today_submitted, today_submission,
    pair_id, partner, halqa, ayat, checkins_30_days,
    program_started, program_ended, server_date,
    earned_badges, locked_badges, weekly_summary, personal_best,
    excusable_missed, pending_excuses, scheduled_days,
}) {
    const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const isFriday = new Date().getDay() === 5;
    const [editingSubmission, setEditingSubmission] = useState(false);

    if (!program_started) {
        const startDate = server_date
            ? new Date(server_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : null;
        return (
            <StudentLayout title="Dashboard">
                <Head title="Dashboard" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 20px', textAlign: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '3rem', lineHeight: 1 }}>🌙</div>
                    <div>
                        <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>Program starts soon</h1>
                        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--muted-foreground)', maxWidth: '360px', lineHeight: 1.6 }}>
                            {startDate
                                ? <>The program begins on <strong style={{ color: 'var(--foreground)' }}>{startDate}</strong>. Check back then to start submitting your muraja&apos;a.</>
                                : "The admin hasn't set a start date yet. You'll be notified when the program begins."
                            }
                        </p>
                    </div>
                    <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', maxWidth: '360px' }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--green-800)', fontSize: '0.9375rem' }}>Use this time to prepare</p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--green-700)' }}>Revise your memorisation and review your schedule. Your profile and pair assignment are ready.</p>
                    </div>
                    {halqa && (
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                            You are in <strong>{halqa.name}</strong> · Leader: {halqa.leader_name ?? '—'}
                        </p>
                    )}
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="page-content" style={{display:'flex',flexDirection:'column',gap:'20px'}}>

                {/* ── Onboarding banner ─────────────────────────────────── */}
                <div style={{
                    background:'var(--secondary)',border:'1px solid var(--border)',
                    borderRadius:'var(--radius-lg)',padding:'12px 16px',
                    display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',
                }}>
                    <div>
                        <p style={{margin:0,fontSize:'0.875rem',fontWeight:600,color:'var(--secondary-foreground)'}}>New to Muraja Monitor?</p>
                        <p style={{margin:'2px 0 0',fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>Download the visual step-by-step onboarding guide.</p>
                    </div>
                    <a href="/student/onboarding/guide" target="_blank" rel="noreferrer" style={{
                        padding:'7px 16px',background:'var(--primary)',color:'var(--primary-foreground)',
                        borderRadius:'var(--radius-sm)',fontWeight:600,fontSize:'0.8125rem',
                        textDecoration:'none',whiteSpace:'nowrap',flexShrink:0,
                    }}>Download Guide (PDF)</a>
                </div>

                {/* ── Greeting ──────────────────────────────────────────── */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px'}}>
                    <div>
                        <h1 style={{margin:0,fontSize:'1.375rem',fontWeight:700,color:'var(--foreground)'}}>
                            Assalamu Alaykum, {name} 👋
                        </h1>
                        <p style={{margin:'2px 0 0',fontSize:'0.875rem',color:'var(--muted-foreground)'}}>{server_date}</p>
                    </div>
                    {streak > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{
                                display:'flex',alignItems:'center',gap:'6px',
                                padding:'6px 12px',borderRadius:'var(--radius-md)',
                                background:'var(--status-on-track-bg)',color:'var(--status-on-track)',
                                fontSize:'0.875rem',fontWeight:600,
                            }}>
                                🔥 {streak}-day streak
                            </div>
                            {pending_excuses?.length > 0 && (
                                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                                    Protected — makeup due {new Date(pending_excuses[0].makeup_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Ayat ──────────────────────────────────────────────── */}
                {ayat && <AyatBox text={ayat.text} reference={ayat.reference} />}

                {/* ── Stat Cards ────────────────────────────────────────── */}
                <div className="stat-grid" data-onboard="stat-cards" style={{gap:'12px'}}>
                    <StatCard label="Consistency" value={`${Math.round(consistency)}%`} sub="Overall program" />
                    <StatCard label="Current Streak" value={streak} sub="days in a row" />
                    <StatCard label="Total Pages" value={pages_total.toLocaleString()} sub="submitted" />
                    <StatCard label="Total Minutes" value={minutes_total.toLocaleString()} sub="spent revising" />
                </div>

                {/* ── Weekly target progress ─────────────────────────────── */}
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <p style={{margin:0,fontSize:'0.875rem',fontWeight:600,color:'var(--foreground)'}}>
                            Weekly Target — {week_pages} / {weekly_target} pages
                        </p>
                        <WeeklyTargetEditor currentTarget={weekly_target} />
                    </div>
                    <SegmentedBar value={week_pages} max={weekly_target} segments={20} />
                </div>

                {/* ── Main grid: Submission + Partner ───────────────────── */}
                <div className="grid-2col" style={{gap:'16px'}}>

                    {/* Submission card */}
                    <div data-onboard="submission-form" style={{
                        background: 'var(--card)',
                        border: today_submitted
                            ? '1px solid var(--status-on-track-border)'
                            : '1px solid var(--border)',
                        borderLeft: today_submitted
                            ? '3px solid var(--status-on-track)'
                            : '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px',
                    }}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                            <h2 style={{margin:0,fontSize:'1rem',fontWeight:700,color:'var(--foreground)'}}>
                                {partner?.makeup_today
                                    ? `Makeup — ${partner.name}'s Session`
                                    : partner ? `Record ${partner.name}'s Muraja'ah` : "Today's Revision"}
                            </h2>
                        </div>
                        {partner?.makeup_today && (
                            <div style={{
                                padding:'8px 12px',borderRadius:'var(--radius-md)',marginBottom:'12px',
                                background:'var(--status-slipping-bg)',border:'1px solid var(--status-slipping-border)',
                                fontSize:'0.8125rem',color:'var(--status-slipping)',fontWeight:500,
                            }}>
                                Today is a makeup day for {partner.name}. Record their session to protect their streak.
                            </div>
                        )}
                        {program_ended ? (
                            <p style={{color:'var(--muted-foreground)',fontSize:'0.875rem'}}>
                                The program has ended. No further submissions are accepted.
                            </p>
                        ) : !program_started ? (
                            <p style={{color:'var(--muted-foreground)',fontSize:'0.875rem'}}>
                                Submissions are not open yet. Check back on the program start date.
                            </p>
                        ) : partner && !partner.scheduled_today ? (
                            <div style={{
                                padding:'14px',borderRadius:'var(--radius-md)',
                                background:'var(--muted)',
                                border:'1px solid var(--border)',
                            }}>
                                <p style={{margin:'0 0 4px',fontSize:'0.875rem',fontWeight:600,color:'var(--foreground)'}}>
                                    {partner.name} is not available today
                                </p>
                                <p style={{margin:0,fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>
                                    {partner.next_available
                                        ? `Next available day: ${partner.next_available}`
                                        : 'No scheduled days set — ask them to complete their profile.'}
                                </p>
                            </div>
                        ) : today_submitted ? (
                            <div>
                                {editingSubmission ? (
                                    <EditSubmissionForm
                                        submission={today_submission}
                                        partner={partner}
                                        onCancel={() => setEditingSubmission(false)}
                                    />
                                ) : (
                                    <>
                                        <div style={{
                                            padding:'10px 12px',borderRadius:'var(--radius-md)',marginBottom:'12px',
                                            background:'var(--status-on-track-bg)',
                                            border:'1px solid var(--status-on-track-border)',
                                            display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',
                                        }}>
                                            <span style={{fontSize:'0.875rem',fontWeight:600,color:'var(--status-on-track)'}}>
                                                ✓ {partner ? `${partner.name}'s session recorded` : 'Submitted today'}
                                            </span>
                                            <button onClick={() => setEditingSubmission(true)} style={{
                                                background:'none',border:'1px solid var(--status-on-track-border)',
                                                borderRadius:'var(--radius-sm)',padding:'3px 10px',
                                                fontSize:'0.75rem',fontWeight:600,color:'var(--status-on-track)',
                                                cursor:'pointer',flexShrink:0,
                                            }}>
                                                Edit
                                            </button>
                                        </div>
                                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                                            {[
                                                ['Juz', today_submission.juz],
                                                ['Pages', `${today_submission.page_from}–${today_submission.page_to}`],
                                                ['Minutes', today_submission.minutes_spent],
                                                ['Pages covered', today_submission.page_to - today_submission.page_from + 1],
                                            ].map(([l,v])=>(
                                                <div key={l} style={{background:'var(--muted)',borderRadius:'var(--radius-sm)',padding:'8px 10px'}}>
                                                    <p style={{margin:0,fontSize:'0.6875rem',color:'var(--muted-foreground)'}}>{l}</p>
                                                    <p style={{margin:'2px 0 0',fontSize:'0.9375rem',fontWeight:600,color:'var(--foreground)'}}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            pair_id ? (
                                <SubmissionForm pairId={pair_id} />
                            ) : (
                                <p style={{color:'var(--muted-foreground)',fontSize:'0.875rem'}}>
                                    You haven't been assigned to a pair yet. Contact your halqa leader.
                                </p>
                            )
                        )}
                    </div>

                    {/* Partner card */}
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px'}}>
                        <h2 style={{margin:'0 0 14px',fontSize:'1rem',fontWeight:700,color:'var(--foreground)'}}>
                            My Partner
                        </h2>
                        {partner ? (
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                                    <div style={{
                                        width:'36px',height:'36px',borderRadius:'50%',
                                        background:'var(--primary)',color:'var(--primary-foreground)',
                                        display:'flex',alignItems:'center',justifyContent:'center',
                                        fontSize:'0.875rem',fontWeight:600,flexShrink:0,
                                    }}>
                                        {partner.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{margin:0,fontWeight:600,color:'var(--foreground)',fontSize:'0.9375rem'}}>{partner.name}</p>
                                        {partner.phone && (
                                            <p style={{margin:0,fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>{partner.phone}</p>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    display:'flex',alignItems:'center',gap:'6px',
                                    padding:'8px 12px',borderRadius:'var(--radius-md)',
                                    background: partner.today_submitted ? 'var(--status-on-track-bg)' : 'var(--muted)',
                                    color: partner.today_submitted ? 'var(--status-on-track)' : 'var(--muted-foreground)',
                                    fontSize:'0.875rem',fontWeight:500,
                                }}>
                                    <span style={{
                                        width:'8px',height:'8px',borderRadius:'50%',
                                        background: partner.today_submitted ? 'var(--status-on-track)' : 'var(--muted-foreground)',
                                        flexShrink:0,
                                    }} />
                                    {partner.today_submitted ? 'Confirmed your session' : 'Hasn\'t confirmed yet'}
                                </div>
                            </div>
                        ) : (
                            <p style={{color:'var(--muted-foreground)',fontSize:'0.875rem'}}>No partner assigned yet.</p>
                        )}

                        {/* Halqa info */}
                        {halqa && (
                            <div style={{marginTop:'16px',paddingTop:'12px',borderTop:'1px solid var(--border)'}}>
                                <p style={{margin:'0 0 2px',fontSize:'0.75rem',fontWeight:500,color:'var(--muted-foreground)'}}>MY HALQA</p>
                                <p style={{margin:0,fontWeight:600,color:'var(--foreground)',fontSize:'0.875rem'}}>{halqa.name}</p>
                                <p style={{margin:'1px 0 6px',fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>Leader: {halqa.leader_name}</p>
                                <SegmentedBar value={halqa.group_consistency} max={100} segments={16} label="Group consistency" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Weekly summary (Fridays) ───────────────────────────── */}
                {weekly_summary && (
                    <div style={{
                        background:'var(--card)',border:'1px solid var(--accent)',
                        borderRadius:'var(--radius-lg)',padding:'16px',
                    }}>
                        <h2 style={{margin:'0 0 6px',fontSize:'1rem',fontWeight:700,color:'var(--foreground)'}}>
                            📊 Weekly Summary
                        </h2>
                        <p style={{margin:0,color:'var(--foreground)',fontSize:'0.9375rem'}}>
                            This week you submitted <strong>{weekly_summary.submitted} out of 7 days</strong>.
                            Your consistency is <strong>{weekly_summary.consistency}%</strong>.
                        </p>
                    </div>
                )}

                {/* ── 30-day Heatmap ─────────────────────────────────────── */}
                <div data-onboard="heatmap" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px'}}>
                    <h2 style={{margin:'0 0 14px',fontSize:'1rem',fontWeight:700,color:'var(--foreground)'}}>
                        Last 30 Days
                    </h2>
                    <Heatmap data={checkins_30_days} />
                </div>

                {/* ── Excuse / makeup window ─────────────────────────────── */}
                {excusable_missed?.length > 0 && <ExcuseCard missed={excusable_missed} scheduledDays={scheduled_days ?? []} />}
                {pending_excuses?.length > 0 && <PendingExcusesBanner excuses={pending_excuses} />}

                {/* ── Personal Best ─────────────────────────────────────── */}
                <div className="grid-2col" style={{gap:'12px'}}>
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',textAlign:'center'}}>
                        <p style={{margin:'0 0 4px',fontSize:'0.75rem',color:'var(--muted-foreground)',fontWeight:500}}>LONGEST STREAK</p>
                        <p style={{margin:0,fontSize:'2rem',fontWeight:700,color:'var(--foreground)'}}>{personal_best.longest_streak}</p>
                        <p style={{margin:0,fontSize:'0.75rem',color:'var(--muted-foreground)'}}>days</p>
                    </div>
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px',textAlign:'center'}}>
                        <p style={{margin:'0 0 4px',fontSize:'0.75rem',color:'var(--muted-foreground)',fontWeight:500}}>MOST PAGES / WEEK</p>
                        <p style={{margin:0,fontSize:'2rem',fontWeight:700,color:'var(--foreground)'}}>{personal_best.most_pages_week}</p>
                        <p style={{margin:0,fontSize:'0.75rem',color:'var(--muted-foreground)'}}>pages</p>
                    </div>
                </div>

                {/* ── Badges preview ─────────────────────────────────────── */}
                {earned_badges.length > 0 && (
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px'}}>
                        <h2 style={{margin:'0 0 10px',fontSize:'1rem',fontWeight:700,color:'var(--foreground)'}}>
                            Badges Earned
                        </h2>
                        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                            {earned_badges.map(b=>(
                                <span key={b.type} style={{
                                    padding:'4px 12px',borderRadius:'var(--radius-md)',
                                    background:'var(--status-on-track-bg)',color:'var(--status-on-track)',
                                    fontSize:'0.8125rem',fontWeight:600,
                                }}>
                                    {b.type.replace(/_/g,' ')}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </StudentLayout>
    );
}
