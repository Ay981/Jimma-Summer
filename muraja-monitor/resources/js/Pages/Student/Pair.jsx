import { Head } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';

export default function Pair({ pair }) {
    const td = { padding:'10px 12px',fontSize:'0.875rem',color:'var(--foreground)',borderBottom:'1px solid var(--border)' };
    const th = { padding:'10px 12px',textAlign:'left',fontSize:'0.75rem',color:'var(--muted-foreground)',fontWeight:600,borderBottom:'1px solid var(--border)' };

    return (
        <StudentLayout title="My Partner">
            <Head title="My Partner" />
            <div className="page-content">
                <h1 style={{margin:'0 0 20px',fontSize:'1.25rem',fontWeight:700,color:'var(--foreground)'}}>My Partner</h1>

                {!pair ? (
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'40px',textAlign:'center'}}>
                        <p style={{color:'var(--muted-foreground)',margin:0}}>You haven't been assigned to a pair yet. Contact your halqa leader.</p>
                    </div>
                ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

                        {/* Partner info card */}
                        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'20px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'16px'}}>
                                <div style={{
                                    width:'48px',height:'48px',borderRadius:'50%',
                                    background:'var(--primary)',color:'var(--primary-foreground)',
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    fontSize:'1.125rem',fontWeight:700,flexShrink:0,
                                }}>
                                    {pair.partner_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p style={{margin:0,fontSize:'1.0625rem',fontWeight:700,color:'var(--foreground)'}}>{pair.partner_name}</p>
                                    <p style={{margin:'2px 0 0',fontSize:'0.875rem',color:'var(--muted-foreground)'}}>📞 {pair.partner_phone !== '—' ? pair.partner_phone : 'No phone on file'}</p>
                                </div>
                                <div style={{marginLeft:'auto'}}>
                                    <div style={{
                                        display:'flex',alignItems:'center',gap:'6px',
                                        padding:'6px 12px',borderRadius:'var(--radius-md)',
                                        background: pair.today_submitted ? 'var(--success)' : 'var(--muted)',
                                        color: pair.today_submitted ? 'var(--success-foreground)' : 'var(--muted-foreground)',
                                        fontSize:'0.8125rem',fontWeight:500,
                                    }}>
                                        <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'currentColor',flexShrink:0}} />
                                        {pair.today_submitted ? 'Submitted today' : 'Not yet today'}
                                    </div>
                                </div>
                            </div>

                            {pair.status === 'solo' && (
                                <div style={{padding:'8px 12px',background:'var(--muted)',borderRadius:'var(--radius-md)',fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>
                                    ⚠️ Your partner has withdrawn. Contact your leader for reassignment.
                                </div>
                            )}
                        </div>

                        {/* Partner history */}
                        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                            <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
                                <h2 style={{margin:0,fontSize:'0.9375rem',fontWeight:700,color:'var(--foreground)'}}>Partner's Submission History</h2>
                            </div>
                            {pair.history.length === 0 ? (
                                <p style={{padding:'24px',textAlign:'center',color:'var(--muted-foreground)',margin:0}}>No submissions yet.</p>
                            ) : (
                                <div style={{overflowX:'auto'}}>
                                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                                        <thead>
                                            <tr style={{background:'var(--muted)'}}>
                                                <th style={th}>Date</th>
                                                <th style={th}>Juz</th>
                                                <th style={th}>Pages</th>
                                                <th style={th}>Minutes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pair.history.map(s=>(
                                                <tr key={s.id}>
                                                    <td style={td}>{s.date}</td>
                                                    <td style={td}>Juz {s.juz}</td>
                                                    <td style={td}>{s.page_from}–{s.page_to} <span style={{color:'var(--muted-foreground)',fontSize:'0.75rem'}}>({s.page_to-s.page_from+1}p)</span></td>
                                                    <td style={td}>{s.minutes_spent} min</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
