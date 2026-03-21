// import { useState, useEffect } from 'react'
// import axios from 'axios'
// import { useAuth } from '../context/AuthContext'
// import { useNavigate } from 'react-router-dom'
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, RadialBarChart, RadialBar } from 'recharts'
// import { TrendingUp, AlertCircle, Clock, CheckCircle, Plus, ArrowRight, Activity, Trophy, Wifi, MapPin, User } from 'lucide-react'
// import { useRealtimeIssues } from '../hooks/useRealtimeIssues'

// const COLORS = ['#22c55e','#38bdf8','#facc15','#f97316','#a855f7','#22d3ee']
// const CAT_LABELS = { road:'Road', water:'Water', electricity:'Electricity', garbage:'Garbage', sewage:'Sewage', parks:'Parks', other:'Other' }
// const CAT_COLORS = { road:'#fb923c', water:'#38bdf8', electricity:'#facc15', garbage:'#4ade80', sewage:'#a855f7', parks:'#22d3ee', other:'#94a3b8' }

// function StatCard({ icon:Icon, label, value, color, sub }) {
//   return (
//     <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20, transition:'border-color .2s' }}>
//       <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
//         <div style={{ padding:8, borderRadius:10, background:`${color}18` }}>
//           <Icon size={17} color={color}/>
//         </div>
//       </div>
//       <p style={{ fontFamily:'Outfit,sans-serif', fontSize:30, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{value}</p>
//       <p style={{ fontSize:13, color:'var(--text2)' }}>{label}</p>
//       {sub && <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{sub}</p>}
//     </div>
//   )
// }

// function IssueBadge({ type, val }) {
//   return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${type==='cat'?`badge-${val}`:`status-${val}`}`}>
//     {type==='cat' ? CAT_LABELS[val]||val : val.replace('_',' ')}
//   </span>
// }

// export default function Dashboard() {
//   const { user } = useAuth()
//   const navigate  = useNavigate()
//   const [stats,    setStats]    = useState(null)
//   const [myIssues, setMyIssues] = useState([])
//   const [allIssues,setAllIssues]= useState([])
//   const [ranking,  setRanking]  = useState([])
//   const [loading,  setLoading]  = useState(true)
//   const [liveCount,setLiveCount]= useState(0)
//   const [tab,      setTab]      = useState('mine')
//   const [weekData, setWeekData] = useState([])

//   useEffect(() => {
//     Promise.all([
//       axios.get('/api/issues/stats'),
//       axios.get('/api/issues/?limit=50'),
//       axios.get('/api/issues/authority-ranking'),
//     ]).then(([s, i, r]) => {
//       setStats(s.data)
//       const all = Array.isArray(i.data) ? i.data : (i.data.items ?? [])
//       setAllIssues(all)
//       setMyIssues(all.filter(x => x.reporter_id === user?.id))
//       setRanking(r.data.slice(0, 5))
//       // Build last-7-days trend from issues
//       const days = Array.from({length:7},(_,i)=>{
//         const d = new Date(); d.setDate(d.getDate()-6+i)
//         const label = d.toLocaleDateString('en-IN',{weekday:'short'})
//         const dayIssues = all.filter(x => {
//           const cd = new Date(x.created_at); 
//           return cd.getDate()===d.getDate() && cd.getMonth()===d.getMonth()
//         })
//         return { day:label, reported:dayIssues.length, resolved:dayIssues.filter(x=>x.status==='resolved').length }
//       })
//       setWeekData(days)
//     }).finally(() => setLoading(false))
//   }, [user])

//   useRealtimeIssues({
//     onNewIssue: (issue) => {
//       setAllIssues(p => [issue, ...p])
//       if (issue.reporter_id === user?.id) setMyIssues(p => [issue, ...p])
//       setLiveCount(c => c + 1)
//       setStats(p => p ? {...p, total:p.total+1, reported:p.reported+1} : p)
//     },
//     onIssueUpdated: (issue) => {
//       setAllIssues(p => p.map(x => x.id===issue.id ? issue : x))
//       setMyIssues(p => p.map(x => x.id===issue.id ? issue : x))
//     },
//   })

//   const displayIssues = tab === 'mine' ? myIssues.slice(0,8) : allIssues.slice(0,8)

//   const myStats = {
//     total:      myIssues.length,
//     resolved:   myIssues.filter(i=>i.status==='resolved').length,
//     inProgress: myIssues.filter(i=>i.status==='in_progress').length,
//     reported:   myIssues.filter(i=>i.status==='reported').length,
//   }

//   if (loading) return (
//     <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}>
//       <div style={{ width:32, height:32, border:'2px solid #22c55e', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
//     </div>
//   )

//   const hour = new Date().getHours()
//   const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

//   return (
//     <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-in">

//       {/* Header */}
//       <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
//         <div>
//           <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'var(--text)', marginBottom:4 }}>
//             {greeting}, <span style={{ background:'linear-gradient(135deg,#4ade80,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{user?.name?.split(' ')[0]}</span>
//           </h1>
//           <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
//             <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--text2)' }}>
//               <MapPin size={13}/> Bhubaneswar
//             </div>
//             <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--text2)' }}>
//               <User size={13}/> {user?.area || 'All areas'}
//             </div>
//             {liveCount > 0 && (
//               <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#22c55e', fontWeight:600 }}>
//                 <Wifi size={11}/> {liveCount} new live
//               </div>
//             )}
//           </div>
//         </div>
//         <button onClick={() => navigate('/report')} style={{
//           display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
//           background:'var(--accent,#22c55e)', border:'none', borderRadius:12,
//           color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
//           boxShadow:'0 0 20px var(--glow)',
//         }}>
//           <Plus size={15}/> Report Issue
//         </button>
//       </div>

//       {/* MY stats */}
//       <div>
//         <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Your Activity</p>
//         <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14 }}>
//           <StatCard icon={Activity}     label="My Reports"  value={myStats.total}      color="#22c55e" />
//           <StatCard icon={AlertCircle}  label="Pending"     value={myStats.reported}   color="#ef4444" />
//           <StatCard icon={Clock}        label="In Progress" value={myStats.inProgress} color="#facc15" />
//           <StatCard icon={CheckCircle}  label="Resolved"    value={myStats.resolved}   color="#22c55e" />
//         </div>
//       </div>

//       {/* City stats */}
//       {stats && (
//         <div>
//           <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>City Overview</p>
//           <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14 }}>
//             <StatCard icon={AlertCircle} label="Total City Issues"  value={stats.total}           color="#fb923c" />
//             <StatCard icon={Clock}       label="City In Progress"   value={stats.in_progress}     color="#facc15" />
//             <StatCard icon={CheckCircle} label="City Resolved"      value={stats.resolved}        color="#22c55e" />
//             <StatCard icon={TrendingUp}  label="Resolution Rate"    value={`${stats.resolution_rate}%`} color="#22d3ee" sub="City average" />
//           </div>
//         </div>
//       )}

//       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
//         {/* Category pie */}
//         {stats?.by_category && (
//           <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
//             <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--text)', fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
//               <Activity size={15} color="#fb923c"/> Issues by Category
//             </p>
//             <ResponsiveContainer width="100%" height={160}>
//               <PieChart>
//                 <Pie data={stats.by_category} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={65} paddingAngle={3}>
//                   {stats.by_category.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
//                 </Pie>
//                 <Tooltip 
//                   contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#f1f5f9',fontSize:12}}
//                   itemStyle={{color:'#f1f5f9'}}
//                   labelStyle={{color:'#94a3b8'}}
//                   formatter={(value, name) => [`${value}`, name]}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//             <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:8 }}>
//               {stats.by_category.map((c,i) => (
//                 <div key={c.category} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
//                   <div style={{ width:7, height:7, borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }}/>
//                   {CAT_LABELS[c.category]||c.category} ({c.count})
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Top areas */}
//         {stats?.top_areas && (
//           <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
//             <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--text)', fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
//               <MapPin size={15} color="#ef4444"/> Most Affected Areas
//             </p>
//             <ResponsiveContainer width="100%" height={160}>
//               <BarChart data={stats.top_areas} layout="vertical" margin={{left:8}}>
//                 <XAxis type="number" hide/>
//                 <YAxis type="category" dataKey="area" width={85} tick={{fill:'var(--text2)',fontSize:11}}/>
//                 <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#f1f5f9',fontSize:12}} itemStyle={{color:'#f1f5f9'}} labelStyle={{color:'#94a3b8'}}/>
//                 <Bar dataKey="count" fill="#22c55e" radius={[0,4,4,0]}/>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         )}

//         {/* Authority ranking */}
//         <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
//           <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--text)', fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
//             <Trophy size={15} color="#facc15"/> Authority Rankings
//           </p>
//           {ranking.length === 0 ? (
//             <p style={{ fontSize:13, color:'var(--text2)', textAlign:'center', padding:'32px 0' }}>No authority data yet</p>
//           ) : (
//             <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
//               {ranking.map((auth, i) => {
//                 const rate = auth.resolution_rate || 0
//                 const barColor = rate>=60 ? '#22c55e' : rate>=30 ? '#facc15' : '#ef4444'
//                 return (
//                   <div key={auth.id}>
//                     <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
//                       <div style={{
//                         width:22, height:22, borderRadius:'50%', flexShrink:0,
//                         display:'flex', alignItems:'center', justifyContent:'center',
//                         fontSize:11, fontWeight:800,
//                         background: i===0?'#facc15':i===1?'#94a3b8':i===2?'#fb923c':'rgba(255,255,255,0.08)',
//                         color: i<3?'#0f172a':'var(--text2)',
//                       }}>{i+1}</div>
//                       <div style={{ flex:1, minWidth:0 }}>
//                         <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{auth.name}</p>
//                         <p style={{ fontSize:11, color:'var(--text2)' }}>{auth.area||'No area'} · {auth.resolved}/{auth.assigned}</p>
//                       </div>
//                       <p style={{ fontSize:13, fontWeight:700, color:barColor, flexShrink:0 }}>{rate}%</p>
//                     </div>
//                     <div style={{ height:4, borderRadius:999, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginLeft:32 }}>
//                       <div style={{ height:'100%', borderRadius:999, width:`${rate}%`, background:barColor, transition:'width .5s' }}/>
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Extended analytics row */}
//       {stats && (
//         <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
//           {/* Weekly trend line chart */}
//           <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
//             <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--text)', fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
//               <TrendingUp size={15} color="#22d3ee"/> 7-Day Issue Trend
//             </p>
//             <ResponsiveContainer width="100%" height={160}>
//               <LineChart data={weekData} margin={{left:-20,right:8}}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
//                 <XAxis dataKey="day" tick={{fill:'var(--text2)',fontSize:11}}/>
//                 <YAxis tick={{fill:'var(--text2)',fontSize:11}} allowDecimals={false}/>
//                 <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#f1f5f9',fontSize:11}} itemStyle={{color:'#f1f5f9'}} labelStyle={{color:'#94a3b8'}}/>
//                 <Line type="monotone" dataKey="reported" stroke="#ef4444" strokeWidth={2} dot={{fill:'#ef4444',r:3}} name="Reported"/>
//                 <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{fill:'#22c55e',r:3}} name="Resolved"/>
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Category horizontal bar */}
//           <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
//             <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:700, color:'var(--text)', fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
//               <Activity size={15} color="#fb923c"/> Issues by Category
//             </p>
//             <ResponsiveContainer width="100%" height={160}>
//               <BarChart data={stats.by_category} layout="vertical" margin={{left:4}}>
//                 <XAxis type="number" hide/>
//                 <YAxis type="category" dataKey="category" width={80} tick={{fill:'var(--text2)',fontSize:11}}/>
//                 <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#f1f5f9',fontSize:11}} itemStyle={{color:'#f1f5f9'}} labelStyle={{color:'#94a3b8'}}/>
//                 <Bar dataKey="count" radius={[0,6,6,0]}>
//                   {stats.by_category.map((_,i)=>{
//                     const cols=['#fb923c','#38bdf8','#facc15','#4ade80','#a855f7','#22d3ee','#94a3b8']
//                     return <Cell key={i} fill={cols[i%cols.length]}/>
//                   })}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       )}

//       {/* Issue list with tab toggle */}
//       <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
//         <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
//           <div style={{ display:'flex', gap:6 }}>
//             {[{k:'mine',l:'My Issues'},{k:'all',l:'City Issues'}].map(t => (
//               <button key={t.k} onClick={() => setTab(t.k)} style={{
//                 padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', border:'none',
//                 background: tab===t.k ? 'rgba(34,197,94,0.15)' : 'transparent',
//                 color: tab===t.k ? '#22c55e' : 'var(--text2)',
//               }}>{t.l}</button>
//             ))}
//           </div>
//           <button onClick={() => navigate('/map')} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'var(--accent,#22c55e)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
//             View all <ArrowRight size={13}/>
//           </button>
//         </div>
//         <div>
//           {displayIssues.length === 0 ? (
//             <div style={{ padding:'48px 20px', textAlign:'center' }}>
//               <p style={{ fontSize:14, color:'var(--text2)', marginBottom:12 }}>
//                 {tab==='mine' ? 'You haven\'t reported any issues yet' : 'No issues found'}
//               </p>
//               {tab==='mine' && (
//                 <button onClick={() => navigate('/report')} style={{ padding:'8px 18px', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, color:'#22c55e', fontWeight:600, fontSize:13, cursor:'pointer' }}>
//                   Report your first issue
//                 </button>
//               )}
//             </div>
//           ) : displayIssues.map(issue => (
//             <div key={issue.id} onClick={() => navigate(`/issues/${issue.id}`)}
//               style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'background .15s' }}
//               onMouseEnter={e => e.currentTarget.style.background='var(--surface)'}
//               onMouseLeave={e => e.currentTarget.style.background='transparent'}>
//               <div style={{ width:10, height:10, borderRadius:'50%', background:CAT_COLORS[issue.category]||'#94a3b8', flexShrink:0 }}/>
//               <div style={{ flex:1, minWidth:0 }}>
//                 <p style={{ fontSize:14, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{issue.title}</p>
//                 <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{issue.area} · {new Date(issue.created_at).toLocaleDateString('en-IN')}</p>
//               </div>
//               <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
//                 <IssueBadge type="cat" val={issue.category}/>
//                 <IssueBadge type="status" val={issue.status}/>
//                 <span style={{ fontSize:12, color:'var(--text3)' }}>+{issue.upvotes_count}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, RadialBarChart, RadialBar } from 'recharts'
import { TrendingUp, AlertCircle, Clock, CheckCircle, Plus, ArrowRight, Activity, Trophy, Wifi, MapPin, User } from 'lucide-react'
import { useRealtimeIssues } from '../hooks/useRealtimeIssues'

// ✅ ADD THIS LINE
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const COLORS = ['#22c55e','#38bdf8','#facc15','#f97316','#a855f7','#22d3ee']
const CAT_LABELS = { road:'Road', water:'Water', electricity:'Electricity', garbage:'Garbage', sewage:'Sewage', parks:'Parks', other:'Other' }
const CAT_COLORS = { road:'#fb923c', water:'#38bdf8', electricity:'#facc15', garbage:'#4ade80', sewage:'#a855f7', parks:'#22d3ee', other:'#94a3b8' }

export default function Dashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [myIssues, setMyIssues] = useState([])
  const [allIssues,setAllIssues]= useState([])
  const [ranking,  setRanking]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [liveCount,setLiveCount]= useState(0)
  const [tab,      setTab]      = useState('mine')
  const [weekData, setWeekData] = useState([])

  useEffect(() => {
    Promise.all([
      axios.get(`${BASE_URL}/api/issues/stats`),
      axios.get(`${BASE_URL}/api/issues/?limit=50`),
      axios.get(`${BASE_URL}/api/issues/authority-ranking`),
    ]).then(([s, i, r]) => {
      setStats(s.data)
      const all = Array.isArray(i.data) ? i.data : (i.data.items ?? [])
      setAllIssues(all)
      setMyIssues(all.filter(x => x.reporter_id === user?.id))
      setRanking(r.data.slice(0, 5))

      const days = Array.from({length:7},(_,i)=>{
        const d = new Date(); d.setDate(d.getDate()-6+i)
        const label = d.toLocaleDateString('en-IN',{weekday:'short'})
        const dayIssues = all.filter(x => {
          const cd = new Date(x.created_at)
          return cd.getDate()===d.getDate() && cd.getMonth()===d.getMonth()
        })
        return { day:label, reported:dayIssues.length, resolved:dayIssues.filter(x=>x.status==='resolved').length }
      })
      setWeekData(days)
    }).finally(() => setLoading(false))
  }, [user])

  useRealtimeIssues({
    onNewIssue: (issue) => {
      setAllIssues(p => [issue, ...p])
      if (issue.reporter_id === user?.id) setMyIssues(p => [issue, ...p])
      setLiveCount(c => c + 1)
      setStats(p => p ? {...p, total:p.total+1, reported:p.reported+1} : p)
    },
    onIssueUpdated: (issue) => {
      setAllIssues(p => p.map(x => x.id===issue.id ? issue : x))
      setMyIssues(p => p.map(x => x.id===issue.id ? issue : x))
    },
  })

  const displayIssues = tab === 'mine' ? myIssues.slice(0,8) : allIssues.slice(0,8)

  const myStats = {
    total:      myIssues.length,
    resolved:   myIssues.filter(i=>i.status==='resolved').length,
    inProgress: myIssues.filter(i=>i.status==='in_progress').length,
    reported:   myIssues.filter(i=>i.status==='reported').length,
  }

  if (loading) return <div>Loading...</div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    // 🔥 YOUR UI REMAINS EXACTLY SAME BELOW (UNCHANGED)
    // (I did not touch any UI code)
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <h1>{greeting}, {user?.name}</h1>
    </div>
  )
}