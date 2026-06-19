import { Head } from '@inertiajs/react';
import { Mosque } from '@phosphor-icons/react';
import SegmentedBar from '@/Components/UI/SegmentedBar';
import StudentLayout from '@/Layouts/StudentLayout';
import EmptyState from '@/Components/UI/EmptyState';

export default function Halqa({ halqa }) {
    return (
        <StudentLayout title="My Halqa">
            <Head title="My Halqa" />
            <div className="page-content">
                <h1 className="page-title" style={{margin:'0 0 20px'}}>My Halqa</h1>

                {!halqa ? (
                    <div style={{background:'var(--card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-sm)'}}>
                        <EmptyState icon={Mosque} title="No halqa assigned yet">
                            Once your leader assigns you to a halqa, its details and group progress will appear here.
                        </EmptyState>
                    </div>
                ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

                        {/* Halqa info */}
                        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'20px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
                                <div>
                                    <h2 style={{margin:0,fontSize:'1.125rem',fontWeight:700,color:'var(--foreground)'}}>{halqa.name}</h2>
                                    <p style={{margin:'3px 0 0',fontSize:'0.875rem',color:'var(--muted-foreground)'}}>Leader: {halqa.leader_name}</p>
                                </div>
                                <div style={{
                                    padding:'6px 14px',borderRadius:'var(--radius-md)',
                                    background:'var(--secondary)',color:'var(--secondary-foreground)',
                                    fontSize:'0.875rem',fontWeight:600,textAlign:'center',
                                }}>
                                    Rank #{halqa.rank} <span style={{fontWeight:400,fontSize:'0.8125rem'}}>of {halqa.total_halqas}</span>
                                </div>
                            </div>
                            <div>
                                <p style={{margin:'0 0 6px',fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>Group consistency</p>
                                <SegmentedBar value={halqa.group_consistency} max={100} segments={20} fraction={`${Math.round(halqa.group_consistency)}%`} />
                            </div>
                        </div>

                        {/* Pairs list */}
                        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                            <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
                                <h2 style={{margin:0,fontSize:'0.9375rem',fontWeight:700,color:'var(--foreground)'}}>
                                    Pairs in this Halqa <span style={{fontWeight:400,color:'var(--muted-foreground)',fontSize:'0.875rem'}}>({halqa.pairs.length})</span>
                                </h2>
                            </div>
                            {halqa.pairs.length === 0 ? (
                                <p style={{padding:'24px',textAlign:'center',color:'var(--muted-foreground)',margin:0}}>No pairs assigned yet.</p>
                            ) : (
                                <div>
                                    {halqa.pairs.map((p,i)=>(
                                        <div key={p.id} style={{
                                            display:'flex',alignItems:'center',justifyContent:'space-between',
                                            padding:'12px 16px',
                                            borderBottom: i < halqa.pairs.length-1 ? '1px solid var(--border)' : 'none',
                                        }}>
                                            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                                                <span style={{
                                                    width:'28px',height:'28px',borderRadius:'50%',
                                                    background:'var(--muted)',color:'var(--muted-foreground)',
                                                    display:'flex',alignItems:'center',justifyContent:'center',
                                                    fontSize:'0.75rem',fontWeight:600,flexShrink:0,
                                                }}>
                                                    {i+1}
                                                </span>
                                                <span style={{fontSize:'0.9rem',color:'var(--foreground)',fontWeight:500}}>
                                                    {p.student_a} & {p.student_b}
                                                </span>
                                            </div>
                                            {p.status === 'solo' && (
                                                <span style={{
                                                    fontSize:'0.6875rem',padding:'2px 8px',
                                                    borderRadius:'var(--radius-sm)',
                                                    background:'var(--muted)',color:'var(--muted-foreground)',
                                                }}>Solo</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
