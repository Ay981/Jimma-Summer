import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import StudentLayout from '@/Layouts/StudentLayout';

const JUZ_LABELS = {1:'Al-Fātiḥah',2:'Al-Baqarah 142',3:'Al-Baqarah 253',4:"Āl ʿImrān 92",5:'An-Nisāʾ 24',6:'An-Nisāʾ 148',7:"Al-Māʾidah 82",8:"Al-Anʿām 111",9:"Al-Aʿrāf 88",10:'Al-Anfāl 41',11:'At-Tawbah 94',12:'Hūd 6',13:'Yūsuf 53',14:'Al-Ḥijr 1',15:'Al-Isrāʾ 1',16:'Al-Kahf 75',17:'Al-Anbiyāʾ 1',18:"Al-Muʾminūn 1",19:'Al-Furqān 21',20:'An-Naml 56',21:"Al-ʿAnkabūt 46",22:'Al-Aḥzāb 31',23:'Yā-Sīn 28',24:'Az-Zumar 32',25:'Fuṣṣilat 47',26:'Al-Aḥqāf 1',27:'Adh-Dhāriyāt 31',28:'Al-Mujādilah 1',29:'Al-Mulk 1',30:"An-Nabaʾ 1"};

function EditRow({ submission, onCancel }) {
    const { data, setData, put, processing, errors } = useForm({
        juz: submission.juz,
        page_from: submission.page_from,
        page_to: submission.page_to,
        minutes_spent: submission.minutes_spent,
    });

    const inp = { padding:'5px 8px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',background:'var(--background)',color:'var(--foreground)',fontSize:'0.8125rem',width:'100%',boxSizing:'border-box' };

    return (
        <tr style={{background:'var(--muted)'}}>
            <td colSpan={7} style={{padding:'12px 16px'}}>
                <form onSubmit={e=>{e.preventDefault();put(`/student/checkin/${submission.id}`,{onSuccess:onCancel});}}>
                    <div style={{display:'flex',gap:'10px',alignItems:'flex-end',flexWrap:'wrap'}}>
                        <div style={{minWidth:'140px'}}>
                            <label style={{fontSize:'0.75rem',color:'var(--muted-foreground)',display:'block',marginBottom:'3px'}}>Juz</label>
                            <select value={data.juz} onChange={e=>setData('juz',e.target.value)} style={inp}>
                                {Array.from({length:30},(_,i)=>i+1).map(j=>(
                                    <option key={j} value={j}>Juz {j}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{width:'80px'}}>
                            <label style={{fontSize:'0.75rem',color:'var(--muted-foreground)',display:'block',marginBottom:'3px'}}>From</label>
                            <input type="number" min="1" max="604" value={data.page_from} onChange={e=>setData('page_from',e.target.value)} style={inp} />
                        </div>
                        <div style={{width:'80px'}}>
                            <label style={{fontSize:'0.75rem',color:'var(--muted-foreground)',display:'block',marginBottom:'3px'}}>To</label>
                            <input type="number" min="1" max="604" value={data.page_to} onChange={e=>setData('page_to',e.target.value)} style={inp} />
                        </div>
                        <div style={{width:'90px'}}>
                            <label style={{fontSize:'0.75rem',color:'var(--muted-foreground)',display:'block',marginBottom:'3px'}}>Minutes</label>
                            <input type="number" min="1" max="480" value={data.minutes_spent} onChange={e=>setData('minutes_spent',e.target.value)} style={inp} />
                        </div>
                        <div style={{display:'flex',gap:'6px'}}>
                            <button type="submit" disabled={processing} style={{padding:'6px 14px',background:'var(--primary)',color:'var(--primary-foreground)',border:'none',borderRadius:'var(--radius-sm)',fontSize:'0.8125rem',cursor:'pointer'}}>
                                {processing?'Saving…':'Save'}
                            </button>
                            <button type="button" onClick={onCancel} style={{padding:'6px 10px',background:'var(--muted)',color:'var(--foreground)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontSize:'0.8125rem',cursor:'pointer'}}>
                                Cancel
                            </button>
                        </div>
                    </div>
                    {(errors.juz||errors.page_from||errors.page_to||errors.minutes_spent) && (
                        <p style={{color:'var(--destructive)',fontSize:'0.75rem',marginTop:'6px'}}>
                            {errors.juz||errors.page_from||errors.page_to||errors.minutes_spent}
                        </p>
                    )}
                </form>
            </td>
        </tr>
    );
}

export default function History({ submissions, current_month, months, is_editable, user_id }) {
    const [editingId, setEditingId] = useState(null);

    function changeMonth(m) {
        router.get('/student/history', { month: m }, { preserveScroll: true });
    }

    const th = { padding:'10px 12px',textAlign:'left',fontSize:'0.75rem',color:'var(--muted-foreground)',fontWeight:600,borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' };
    const td = { padding:'10px 12px',fontSize:'0.875rem',color:'var(--foreground)',borderBottom:'1px solid var(--border)' };

    return (
        <StudentLayout title="History">
            <Head title="History" />
            <div className="page-content">

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
                    <h1 style={{margin:0,fontSize:'1.25rem',fontWeight:700,color:'var(--foreground)'}}>Submission History</h1>
                    <select value={current_month} onChange={e=>changeMonth(e.target.value)}
                        style={{padding:'6px 10px',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',background:'var(--card)',color:'var(--foreground)',fontSize:'0.875rem'}}>
                        {months.map(m=>(
                            <option key={m} value={m}>
                                {new Date(m+'-01').toLocaleDateString('en-US',{year:'numeric',month:'long'})}
                            </option>
                        ))}
                    </select>
                </div>

                {submissions.data.length === 0 ? (
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'40px',textAlign:'center'}}>
                        <p style={{color:'var(--muted-foreground)',margin:0}}>No submissions for this month.</p>
                    </div>
                ) : (
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                        <div style={{overflowX:'auto'}}>
                            <table style={{width:'100%',borderCollapse:'collapse'}}>
                                <thead>
                                    <tr style={{background:'var(--muted)'}}>
                                        <th style={th}>Date</th>
                                        <th style={th}>Filed by</th>
                                        <th style={th}>Juz</th>
                                        <th style={th}>Pages</th>
                                        <th style={th}>Minutes</th>
                                        <th style={th}>Edited</th>
                                        {is_editable && <th style={th}></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.data.map(s=>(
                                        <>
                                            <tr key={s.id} style={{background: editingId===s.id?'var(--secondary)':'transparent'}}>
                                                <td style={td}>{s.date}</td>
                                                <td style={td}>
                                                    <span style={{fontSize:'0.8125rem'}}>
                                                        {s.filed_by_self ? 'You' : s.filed_by}
                                                    </span>
                                                </td>
                                                <td style={td}>Juz {s.juz}</td>
                                                <td style={td}>{s.page_from}–{s.page_to} <span style={{color:'var(--muted-foreground)',fontSize:'0.75rem'}}>({s.page_to-s.page_from+1}p)</span></td>
                                                <td style={td}>{s.minutes_spent} min</td>
                                                <td style={td}>
                                                    {s.is_edited && (
                                                        <span style={{fontSize:'0.6875rem',color:'var(--muted-foreground)',background:'var(--muted)',padding:'2px 6px',borderRadius:'var(--radius-sm)'}}>
                                                            edited {s.edited_at}
                                                        </span>
                                                    )}
                                                </td>
                                                {is_editable && (
                                                    <td style={td}>
                                                        {s.filed_by_self && editingId !== s.id && (
                                                            <button onClick={()=>setEditingId(s.id)}
                                                                style={{padding:'4px 10px',background:'none',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontSize:'0.75rem',cursor:'pointer',color:'var(--foreground)'}}>
                                                                Edit
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                            {editingId === s.id && (
                                                <EditRow key={`edit-${s.id}`} submission={s} onCancel={()=>setEditingId(null)} />
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {(submissions.prev_page_url || submissions.next_page_url) && (
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderTop:'1px solid var(--border)'}}>
                                <span style={{fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>
                                    Page {submissions.current_page} of {submissions.last_page}
                                </span>
                                <div style={{display:'flex',gap:'6px'}}>
                                    {submissions.prev_page_url && (
                                        <button onClick={()=>router.get(submissions.prev_page_url)}
                                            style={{padding:'5px 12px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',background:'var(--card)',color:'var(--foreground)',fontSize:'0.8125rem',cursor:'pointer'}}>
                                            ← Prev
                                        </button>
                                    )}
                                    {submissions.next_page_url && (
                                        <button onClick={()=>router.get(submissions.next_page_url)}
                                            style={{padding:'5px 12px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',background:'var(--card)',color:'var(--foreground)',fontSize:'0.8125rem',cursor:'pointer'}}>
                                            Next →
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
