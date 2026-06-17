import { Head, useForm } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';

export default function Journal({ entries, can_add, today_sub }) {
    const { data, setData, post, processing, errors, reset } = useForm({ text: '', submission_id: today_sub?.id ?? '' });

    function handleSubmit(e) {
        e.preventDefault();
        post('/student/journal', { onSuccess: () => reset() });
    }

    return (
        <StudentLayout title="Journal">
            <Head title="Journal" />
            <div className="page-content">

                <h1 style={{margin:'0 0 20px',fontSize:'1.25rem',fontWeight:700,color:'var(--foreground)'}}>My Journal</h1>

                {/* New entry form */}
                {can_add ? (
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'20px',marginBottom:'20px'}}>
                        <h2 style={{margin:'0 0 4px',fontSize:'0.9375rem',fontWeight:700,color:'var(--foreground)'}}>
                            Today's Reflection
                        </h2>
                        {today_sub && (
                            <p style={{margin:'0 0 12px',fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>
                                Linked to today's submission — Juz {today_sub.juz}
                            </p>
                        )}
                        <form onSubmit={handleSubmit}>
                            <textarea
                                data-onboard="journal-textarea"
                                value={data.text}
                                onChange={e=>setData('text',e.target.value)}
                                placeholder="Write your reflection here… What did you revise? How did it feel? Any areas to improve?"
                                rows={5}
                                style={{
                                    width:'100%',boxSizing:'border-box',
                                    padding:'10px 12px',
                                    border:`1px solid ${errors.text?'var(--destructive)':'var(--border)'}`,
                                    borderRadius:'var(--radius-md)',
                                    background:'var(--background)',color:'var(--foreground)',
                                    fontSize:'0.9rem',lineHeight:1.6,
                                    resize:'vertical',outline:'none',
                                    fontFamily:'inherit',
                                }}
                            />
                            {errors.text && <p style={{color:'var(--destructive)',fontSize:'0.8125rem',margin:'4px 0 0'}}>{errors.text}</p>}
                            <button data-onboard="journal-submit" type="submit" disabled={processing} style={{
                                marginTop:'10px',padding:'9px 20px',
                                background:'var(--primary)',color:'var(--primary-foreground)',
                                border:'none',borderRadius:'var(--radius-md)',
                                fontSize:'0.9rem',fontWeight:600,cursor:processing?'not-allowed':'pointer',
                                opacity:processing?0.7:1,
                            }}>
                                {processing?'Saving…':'Save Reflection'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div style={{
                        background:'var(--muted)',border:'1px solid var(--border)',
                        borderRadius:'var(--radius-lg)',padding:'14px 16px',
                        marginBottom:'20px',fontSize:'0.875rem',color:'var(--muted-foreground)',
                    }}>
                        {today_sub
                            ? 'You already wrote a reflection for today\'s submission.'
                            : 'Submit your revision first to add a journal entry for today.'}
                    </div>
                )}

                {/* Entries list */}
                {entries.data.length === 0 ? (
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'40px',textAlign:'center'}}>
                        <p style={{color:'var(--muted-foreground)',margin:0}}>No journal entries yet. Start by submitting your revision and writing a reflection.</p>
                    </div>
                ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        {entries.data.map(e=>(
                            <div key={e.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px 20px'}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px',flexWrap:'wrap',gap:'6px'}}>
                                    <span style={{fontSize:'0.8125rem',fontWeight:600,color:'var(--muted-foreground)'}}>{e.created_at}</span>
                                    {e.submission && (
                                        <span style={{
                                            fontSize:'0.75rem',padding:'2px 8px',
                                            borderRadius:'var(--radius-sm)',
                                            background:'var(--secondary)',color:'var(--secondary-foreground)',
                                        }}>
                                            Juz {e.submission.juz} · pp {e.submission.page_from}–{e.submission.page_to} · {e.submission.date}
                                        </span>
                                    )}
                                </div>
                                <p style={{margin:0,color:'var(--foreground)',fontSize:'0.9375rem',lineHeight:1.65,whiteSpace:'pre-wrap'}}>{e.text}</p>
                            </div>
                        ))}

                        {/* Pagination */}
                        {(entries.prev_page_url || entries.next_page_url) && (
                            <div style={{display:'flex',justifyContent:'center',gap:'8px',paddingTop:'4px'}}>
                                {entries.prev_page_url && (
                                    <a href={entries.prev_page_url} style={{padding:'6px 16px',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',color:'var(--foreground)',textDecoration:'none',fontSize:'0.875rem'}}>← Older</a>
                                )}
                                {entries.next_page_url && (
                                    <a href={entries.next_page_url} style={{padding:'6px 16px',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',color:'var(--foreground)',textDecoration:'none',fontSize:'0.875rem'}}>Newer →</a>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
