import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AyatBox from '@/Components/UI/AyatBox';
import AnnouncementBanner from '@/Components/UI/AnnouncementBanner';
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
                <select value={data.juz} onChange={e=>setData('juz',e.target.value)} style={inp()}>
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
            <button type="submit" disabled={processing} style={{
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

export default function Dashboard({
    name, streak, consistency, pages_total, minutes_total,
    weekly_target, week_pages, today_submitted, today_submission,
    pair_id, partner, halqa, ayat, checkins_30_days,
    earned_badges, locked_badges, weekly_summary, personal_best,
    announcements,
}) {
    const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const isFriday = new Date().getDay() === 5;

    return (
        <StudentLayout title="Dashboard">
            <Head title="Dashboard" />

            <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 2rem',display:'flex',flexDirection:'column',gap:'20px'}}>

                {/* ── Greeting ──────────────────────────────────────────── */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px'}}>
                    <div>
                        <h1 style={{margin:0,fontSize:'1.375rem',fontWeight:700,color:'var(--foreground)'}}>
                            Assalamu Alaykum, {name} 👋
                        </h1>
                        <p style={{margin:'2px 0 0',fontSize:'0.875rem',color:'var(--muted-foreground)'}}>{today}</p>
                    </div>
                    {streak > 0 && (
                        <div style={{
                            display:'flex',alignItems:'center',gap:'6px',
                            padding:'6px 12px',borderRadius:'var(--radius-md)',
                            background:'var(--success)',color:'var(--success-foreground)',
                            fontSize:'0.875rem',fontWeight:600,
                        }}>
                            🔥 {streak}-day streak
                        </div>
                    )}
                </div>

                {/* ── Ayat ──────────────────────────────────────────────── */}
                {ayat && <AyatBox text={ayat.text} reference={ayat.reference} />}

                {/* ── Announcements ─────────────────────────────────────── */}
                <AnnouncementBanner announcements={announcements} />

                {/* ── Stat Cards ────────────────────────────────────────── */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'12px'}}>
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
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>

                    {/* Submission card */}
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px'}}>
                        <h2 style={{margin:'0 0 14px',fontSize:'1rem',fontWeight:700,color:'var(--foreground)'}}>
                            Today's Revision
                        </h2>
                        {today_submitted ? (
                            <div>
                                <div style={{
                                    padding:'12px',borderRadius:'var(--radius-md)',
                                    background:'var(--success)',color:'var(--success-foreground)',
                                    fontSize:'0.875rem',fontWeight:500,marginBottom:'12px',
                                }}>
                                    ✓ Already submitted today
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
                                    background: partner.today_submitted ? 'var(--success)' : 'var(--muted)',
                                    color: partner.today_submitted ? 'var(--success-foreground)' : 'var(--muted-foreground)',
                                    fontSize:'0.875rem',fontWeight:500,
                                }}>
                                    <span style={{
                                        width:'8px',height:'8px',borderRadius:'50%',
                                        background: partner.today_submitted ? 'var(--success-foreground)' : 'var(--muted-foreground)',
                                        flexShrink:0,
                                    }} />
                                    {partner.today_submitted ? 'Submitted today' : 'Not yet submitted'}
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
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px'}}>
                    <h2 style={{margin:'0 0 14px',fontSize:'1rem',fontWeight:700,color:'var(--foreground)'}}>
                        Last 30 Days
                    </h2>
                    <Heatmap data={checkins_30_days} />
                </div>

                {/* ── Personal Best ─────────────────────────────────────── */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
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
                                    background:'var(--success)',color:'var(--success-foreground)',
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
