import { Head } from '@inertiajs/react';
import StudentLayout from '@/Layouts/StudentLayout';

const BADGE_META = {
    streak_7:     { icon: '🔥', next: 'streak_14' },
    streak_14:    { icon: '🔥', next: 'streak_30' },
    streak_30:    { icon: '🏆' },
    juz_1:        { icon: '📖', next: 'juz_5' },
    juz_5:        { icon: '📚', next: 'juz_10' },
    juz_10:       { icon: '📚' },
    full_program: { icon: '🌟' },
    pages_100:    { icon: '📃', next: 'pages_500' },
    pages_500:    { icon: '📄' },
};

export default function Badges({ earned, locked, defs }) {
    const nextBadge = earned.length > 0
        ? BADGE_META[earned[0]?.type]?.next
        : locked[0]?.type;

    return (
        <StudentLayout title="Badges">
            <Head title="Badges" />
            <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 2rem'}}>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'8px'}}>
                    <h1 style={{margin:0,fontSize:'1.25rem',fontWeight:700,color:'var(--foreground)'}}>
                        Badges <span style={{fontWeight:400,color:'var(--muted-foreground)',fontSize:'1rem'}}>({earned.length}/{earned.length+locked.length} earned)</span>
                    </h1>
                </div>

                {/* Next badge hint */}
                {nextBadge && defs[nextBadge] && (
                    <div style={{
                        background:'var(--card)',border:'1px solid var(--accent)',
                        borderRadius:'var(--radius-lg)',padding:'14px 16px',
                        marginBottom:'16px',display:'flex',alignItems:'center',gap:'12px',
                    }}>
                        <span style={{fontSize:'1.5rem'}}>{BADGE_META[nextBadge]?.icon ?? '🎯'}</span>
                        <div>
                            <p style={{margin:0,fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>Next badge</p>
                            <p style={{margin:'1px 0 0',fontWeight:600,color:'var(--foreground)',fontSize:'0.9375rem'}}>{defs[nextBadge].label}</p>
                            <p style={{margin:'1px 0 0',fontSize:'0.8125rem',color:'var(--muted-foreground)'}}>{defs[nextBadge].condition}</p>
                        </div>
                    </div>
                )}

                {/* Earned badges */}
                {earned.length > 0 && (
                    <div style={{marginBottom:'20px'}}>
                        <h2 style={{margin:'0 0 10px',fontSize:'0.875rem',fontWeight:600,color:'var(--muted-foreground)',letterSpacing:'0.05em'}}>EARNED</h2>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'10px'}}>
                            {earned.map(b=>(
                                <div key={b.type} style={{
                                    background:'var(--card)',border:'1px solid var(--success)',
                                    borderRadius:'var(--radius-lg)',padding:'16px',
                                    display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:'6px',
                                }}>
                                    <span style={{fontSize:'2rem'}}>{BADGE_META[b.type]?.icon ?? '🏅'}</span>
                                    <p style={{margin:0,fontWeight:700,color:'var(--foreground)',fontSize:'0.875rem'}}>{defs[b.type]?.label ?? b.type}</p>
                                    <p style={{margin:0,fontSize:'0.6875rem',color:'var(--success)',fontWeight:500}}>Earned {b.earned_at}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locked badges */}
                {locked.length > 0 && (
                    <div>
                        <h2 style={{margin:'0 0 10px',fontSize:'0.875rem',fontWeight:600,color:'var(--muted-foreground)',letterSpacing:'0.05em'}}>LOCKED</h2>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'10px'}}>
                            {locked.map(b=>(
                                <div key={b.type} style={{
                                    background:'var(--muted)',border:'1px solid var(--border)',
                                    borderRadius:'var(--radius-lg)',padding:'16px',
                                    display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:'6px',
                                    opacity:0.75,
                                }}>
                                    <span style={{fontSize:'2rem',filter:'grayscale(1)'}}>🔒</span>
                                    <p style={{margin:0,fontWeight:700,color:'var(--muted-foreground)',fontSize:'0.875rem'}}>{defs[b.type]?.label ?? b.type}</p>
                                    <p style={{margin:0,fontSize:'0.6875rem',color:'var(--muted-foreground)'}}>{defs[b.type]?.condition}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {earned.length === 0 && locked.length === 0 && (
                    <p style={{textAlign:'center',color:'var(--muted-foreground)',padding:'40px 0'}}>No badges defined yet.</p>
                )}
            </div>
        </StudentLayout>
    );
}
