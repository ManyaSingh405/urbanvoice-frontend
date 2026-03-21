import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, MapPin, Eye, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS     = ['#22c55e','#38bdf8','#facc15','#f97316','#a855f7','#22d3ee','#94a3b8']
const CAT_ICONS  = { road:'', water:'', electricity:'', garbage:'', sewage:'', parks:'', other:'' }
const STATUS_CFG = {
  reported:    { color:'#ef4444', label:'Reported'    },
  in_progress: { color:'#facc15', label:'In Progress' },
  resolved:    { color:'#22c55e', label:'Resolved'    },
  rejected:    { color:'#64748b', label:'Rejected'    },
}

function StatCard({ icon:Icon, label, value, color, sub }) {
  return (
    <div className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all">
      <div className={`p-2 rounded-lg bg-white/5 ${color} w-fit mb-3`}><Icon size={18}/></div>
      <p className="font-display font-bold text-3xl text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate  = useNavigate()
  const [stats,      setStats]      = useState(null)
  const [ranking,    setRanking]    = useState([])
  const [allIssues,  setAllIssues]  = useState([])
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('overview')

  useEffect(() => {
    Promise.all([
      axios.get('/api/issues/stats'),
      axios.get('/api/issues/authority-ranking'),
      axios.get('/api/issues/?limit=100'),
      axios.get('/api/users/'),
    ]).then(([s, r, i, u]) => {
      setStats(s.data)
      setRanking(r.data)
      const raw = i.data
      setAllIssues(Array.isArray(raw) ? raw : (raw.items ?? []))
      setUsers(u.data)
    }).catch(() => toast.error('Failed to load admin data'))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  // Group issues by area for oversight
  const areaMap = {}
  allIssues.forEach(i => {
    if (!areaMap[i.area]) areaMap[i.area] = { area:i.area, total:0, reported:0, in_progress:0, resolved:0, rejected:0 }
    areaMap[i.area].total++
    areaMap[i.area][i.status] = (areaMap[i.area][i.status] || 0) + 1
  })
  const areas = Object.values(areaMap).sort((a,b) => b.reported - a.reported)

  // Neglected areas = areas with reported issues but NO in_progress ones
  const neglected = areas.filter(a => a.reported > 0 && a.in_progress === 0)

  const tabs = [
    { key:'overview',   label:' Overview'          },
    { key:'areas',      label:' Area Oversight'     },
    { key:'authority',  label:' Authority Tracker'  },
    { key:'issues',     label:' All Issues'         },
    { key:'users',      label:' Users'              },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="glass rounded-2xl p-6 border border-white/5"
        style={{ background:'linear-gradient(135deg,rgba(34,197,94,.06),rgba(56,189,248,.04))' }}>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <Shield size={28} className="text-green-400"/> Admin Control Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">Full oversight of all areas, authorities, and issues across Bhubaneswar</p>
        {neglected.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl"
            style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)' }}>
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0"/>
            <p className="text-sm text-red-300">
              <strong>{neglected.length} area{neglected.length>1?'s':''} neglected</strong> — reported issues with no authority action:
              {' '}{neglected.slice(0,3).map(a=>a.area).join(', ')}{neglected.length>3?' + more':''}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={AlertCircle} label="Total Issues"     value={stats.total}           color="text-red-400"    />
          <StatCard icon={Clock}       label="In Progress"      value={stats.in_progress}     color="text-yellow-400" />
          <StatCard icon={CheckCircle} label="Resolved"         value={stats.resolved}        color="text-green-400"  />
          <StatCard icon={TrendingUp}  label="Resolution Rate"  value={`${stats.resolution_rate}%`} color="text-cyan-400"
            sub={stats.avg_resolution_hours ? `Avg ${stats.avg_resolution_hours}h to resolve` : null} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab===t.key ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.04)',
              color:      activeTab===t.key ? '#4ade80' : '#64748b',
              border:     activeTab===t.key ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(255,255,255,.07)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab==='overview' && stats && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5 border border-white/5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><span></span> Issues by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.by_category} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {stats.by_category.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {stats.by_category.map((c,i) => (
                <div key={c.category} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                  {CAT_ICONS[c.category]} {c.category} ({c.count})
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-xl p-5 border border-white/5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><MapPin size={15} className="text-red-400"/> Top Problem Areas</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.top_areas} layout="vertical" margin={{left:8}}>
                <XAxis type="number" hide/>
                <YAxis type="category" dataKey="area" width={110} tick={{fill:'var(--text2)',fontSize:11}}/>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:12}}/>
                <Bar dataKey="count" fill="#22c55e" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Extra analytics row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5 border border-white/5">
            <h3 className="font-semibold text-white mb-4" style={{fontSize:14,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:'#22c55e'}}>●</span> Status Distribution
            </h3>
            {stats && (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  {name:'Reported', count:stats.reported, fill:'#ef4444'},
                  {name:'In Progress', count:stats.in_progress, fill:'#facc15'},
                  {name:'Resolved', count:stats.resolved, fill:'#22c55e'},
                ]} margin={{left:-20}}>
                  <XAxis dataKey="name" tick={{fill:'var(--text2)',fontSize:11}}/>
                  <YAxis tick={{fill:'var(--text2)',fontSize:11}} allowDecimals={false}/>
                  <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:12}}/>
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {[{fill:'#ef4444'},{fill:'#facc15'},{fill:'#22c55e'}].map((c,i)=><Cell key={i} fill={c.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="glass rounded-xl p-5 border border-white/5">
            <h3 className="font-semibold text-white mb-4" style={{fontSize:14,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:'#a855f7'}}>●</span> Resolution Rate by Area
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={Object.values((() => {
                const m = {}
                allIssues.forEach(i => {
                  if (!m[i.area]) m[i.area] = {area:i.area,total:0,resolved:0}
                  m[i.area].total++
                  if (i.status==='resolved') m[i.area].resolved++
                })
                return Object.values(m).map(a=>({...a,rate:a.total?Math.round(a.resolved/a.total*100):0})).sort((a,b)=>b.rate-a.rate).slice(0,6)
              })())} layout="vertical" margin={{left:8}}>
                <XAxis type="number" domain={[0,100]} tick={{fill:'var(--text2)',fontSize:11}} unit="%"/>
                <YAxis type="category" dataKey="area" width={100} tick={{fill:'var(--text2)',fontSize:10}}/>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:12}} formatter={(v)=>`${v}%`}/>
                <Bar dataKey="rate" fill="#a855f7" radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        </>
      )}

      {/* ── AREA OVERSIGHT TAB ── */}
      {activeTab==='areas' && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Area-wise Issue Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Red = neglected (reported but no action taken)</p>
          </div>
          <div className="divide-y divide-white/5">
            {areas.map(area => {
              const isNeglected = area.reported > 0 && area.in_progress === 0
              return (
                <div key={area.area} className="px-6 py-4 hover:bg-white/2 transition-all"
                  style={isNeglected ? {background:'rgba(239,68,68,.04)',borderLeft:'3px solid #ef4444'} : {}}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm">{area.area}</p>
                        {isNeglected && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{background:'rgba(239,68,68,.15)',color:'#f87171'}}>
                            ! Needs Attention
                          </span>
                        )}
                      </div>
                      {/* Progress bar showing resolution */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,.06)'}}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width:`${area.total ? Math.round(area.resolved/area.total*100) : 0}%`,
                              background:'#22c55e'
                            }}/>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {area.total ? Math.round(area.resolved/area.total*100) : 0}% resolved
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {[
                        {key:'reported',    color:'#ef4444', label:'New'        },
                        {key:'in_progress', color:'#facc15', label:'Active'     },
                        {key:'resolved',    color:'#22c55e', label:'Done'       },
                      ].map(({key,color,label}) => (
                        <div key={key} className="text-center w-12">
                          <p className="font-bold text-lg" style={{color}}>{area[key]||0}</p>
                          <p className="text-xs text-slate-600">{label}</p>
                        </div>
                      ))}
                      <div className="text-center w-12">
                        <p className="font-bold text-lg text-slate-400">{area.total}</p>
                        <p className="text-xs text-slate-600">Total</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {areas.length === 0 && (
              <p className="text-center text-slate-500 py-12 text-sm">No issues reported yet across any area</p>
            )}
          </div>
        </div>
      )}

      {/* ── AUTHORITY TRACKER TAB ── */}
      {activeTab==='authority' && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Authority Performance Tracker</h2>
            <p className="text-xs text-slate-500 mt-0.5">Who is resolving issues and who isn't</p>
          </div>
          {ranking.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">No authority accounts registered yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {ranking.map((auth, i) => {
                const isLazy = auth.assigned > 0 && auth.resolution_rate < 30
                return (
                  <div key={auth.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/2 transition-all"
                    style={isLazy ? {background:'rgba(239,68,68,.03)'} : {}}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      i===0 ? 'bg-yellow-400 text-slate-900' :
                      i===1 ? 'bg-slate-400 text-slate-900' :
                      i===2 ? 'bg-orange-400 text-slate-900' : 'bg-white/10 text-slate-400'}`}>
                      {i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white text-sm">{auth.name}</p>
                        {i===0 && <span className="text-xs text-yellow-400"> Top Performer</span>}
                        {isLazy && <span className="text-xs text-red-400">! Low Activity</span>}
                      </div>
                      <p className="text-xs text-slate-500">{auth.area || 'No area assigned'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,.06)'}}>
                          <div className="h-full rounded-full"
                            style={{width:`${auth.resolution_rate}%`, background: auth.resolution_rate>60?'#22c55e':auth.resolution_rate>30?'#facc15':'#ef4444'}}/>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{auth.resolution_rate}%</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-center flex-shrink-0">
                      <div><p className="font-bold text-white">{auth.assigned}</p><p className="text-xs text-slate-600">Assigned</p></div>
                      <div><p className="font-bold text-green-400">{auth.resolved}</p><p className="text-xs text-slate-600">Resolved</p></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ALL ISSUES TAB ── */}
      {activeTab==='issues' && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">All Issues — City Wide</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {allIssues.map(issue => (
              <div key={issue.id} className="px-5 py-3.5 hover:bg-white/2 transition-all flex items-center gap-4 cursor-pointer"
                onClick={() => navigate(`/issues/${issue.id}`)}>
                <span className="text-xl">{CAT_ICONS[issue.category]||''}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{issue.title}</p>
                  <p className="text-xs text-slate-500">{issue.area} · {issue.reporter_name}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{background:STATUS_CFG[issue.status]?.color+'22',color:STATUS_CFG[issue.status]?.color}}>
                  {STATUS_CFG[issue.status]?.label}
                </span>
                <span className="text-xs text-slate-500 flex-shrink-0"> {Math.round(issue.priority_score||0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab==='users' && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users size={16}/> Registered Users
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {users.map(u => (
              <div key={u.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-white/2 transition-all">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-slate-900 font-bold text-sm flex-shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="text-xs text-slate-500">{u.area || '—'}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: u.role==='admin' ? 'rgba(34,197,94,.15)' : u.role==='authority' ? 'rgba(168,85,247,.15)' : 'rgba(56,189,248,.12)',
                    color:      u.role==='admin' ? '#4ade80'             : u.role==='authority' ? '#c084fc'              : '#38bdf8'
                  }}>
                  {u.role}
                </span>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-slate-500 py-12 text-sm">No users found</p>}
          </div>
        </div>
      )}
    </div>
  )
}
