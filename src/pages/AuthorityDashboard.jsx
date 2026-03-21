import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Shield, Clock, CheckCircle, AlertCircle, TrendingUp, MapPin, User, Bell, ChevronRight, Pause, Cpu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CAT_ICONS  = { road:'', water:'', electricity:'', garbage:'', sewage:'', parks:'', other:'' }
const STATUS_CFG = {
  reported:    { label:'Reported',    color:'#ef4444', bg:'rgba(239,68,68,.12)'   },
  in_progress: { label:'In Progress', color:'#facc15', bg:'rgba(250,204,21,.12)'  },
  resolved:    { label:'Resolved',    color:'#22c55e', bg:'rgba(34,197,94,.12)'   },
  rejected:    { label:'Rejected',    color:'#64748b', bg:'rgba(100,116,139,.12)' },
}

function PriorityBadge({ score }) {
  const s = Math.round(score || 0)
  const color = s > 60 ? '#ef4444' : s > 35 ? '#facc15' : '#22c55e'
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:18, fontWeight:800, color, fontFamily:'monospace' }}>{s}</div>
      <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Priority</div>
    </div>
  )
}

export default function AuthorityDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [issues,  setIssues]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [filter,  setFilter]  = useState('reported')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [aiBrief, setAiBrief] = useState('')
  const [briefLoading, setBriefLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [issueRes, statsRes] = await Promise.all([
        axios.get(`/api/issues/?status=${filter}&limit=50`),
        axios.get('/api/issues/stats'),
      ])
      const raw = issueRes.data
      // handle both old array and new paginated shape
      setIssues(Array.isArray(raw) ? raw : (raw.items ?? []))
      setStats(statsRes.data)
    } catch(e) {
      toast.error('Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filter])

  const fetchAiBrief = async (issueList) => {
    if (!issueList.length || !user?.area) return
    setBriefLoading(true)
    try {
      const res = await axios.post('/api/issues/ai/area-brief', {
        name: user?.name, area: user?.area || 'your area',
        issues: issueList.slice(0,10).map(i=>({title:i.title,status:i.status,priority_score:i.priority_score}))
      })
      setAiBrief(res.data.brief || '')
    } catch {} finally { setBriefLoading(false) }
  }

  const updateStatus = async (issueId, newStatus) => {
    setUpdating(issueId + newStatus)
    try {
      await axios.patch(`/api/issues/${issueId}`, { status: newStatus })
      const labels = { in_progress:'Marked In Progress', resolved:'Marked Resolved ✓', rejected:'Issue Rejected', reported:'Reset to Reported' }
      toast.success(labels[newStatus] || 'Updated!')
      // optimistic update — remove from current filter list
      setIssues(prev => prev.filter(i => i.id !== issueId))
      // refresh stats
      const s = await axios.get('/api/issues/stats')
      setStats(s.data)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const filterTabs = [
    { key:'reported',    label:' New',         count: stats?.reported    },
    { key:'in_progress', label:' In Progress',  count: stats?.in_progress },
    { key:'resolved',    label:' Resolved',     count: stats?.resolved    },
    { key:'rejected',    label:' Rejected',     count: null               },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="glass rounded-2xl p-6 border border-white/5"
        style={{ background:'linear-gradient(135deg,rgba(168,85,247,.08),rgba(99,102,241,.05))' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <Shield size={28} className="text-purple-400" /> Authority Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              You manage issues for area: <span className="text-purple-300 font-semibold">{user?.area || 'All Areas'}</span>
            </p>
          </div>
          {/* How it works — quick explainer */}
          <div className="glass rounded-xl p-4 border border-purple-500/20 max-w-sm text-xs text-slate-400 space-y-1.5">
            <p className="text-purple-300 font-semibold text-sm mb-2"> Your Workflow</p>
            <p> <strong className="text-white">New</strong> — Citizen reported, needs your attention</p>
            <p> <strong className="text-white">In Progress</strong> — You accepted, work is ongoing</p>
            <p> <strong className="text-white">Resolved</strong> — Fixed, citizen gets notified</p>
            <p> <strong className="text-white">Rejected</strong> — Invalid / out of jurisdiction</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon:AlertCircle, label:'New Issues',      val:stats.reported,         color:'text-red-400',    bg:'rgba(239,68,68,.08)'   },
            { icon:Clock,       label:'In Progress',     val:stats.in_progress,      color:'text-yellow-400', bg:'rgba(250,204,21,.08)'  },
            { icon:CheckCircle, label:'Resolved',        val:stats.resolved,         color:'text-green-400',  bg:'rgba(34,197,94,.08)'   },
            { icon:TrendingUp,  label:'Resolution Rate', val:`${stats.resolution_rate}%`, color:'text-cyan-400', bg:'rgba(34,211,238,.08)' },
          ].map(({ icon:Icon, label, val, color, bg }) => (
            <div key={label} className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all"
              style={{ background:bg }}>
              <Icon size={18} className={`${color} mb-3`} />
              <p className="font-display font-bold text-3xl text-white">{val}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Brief */}
      {(aiBrief || briefLoading) && (
        <div style={{background:'rgba(168,85,247,0.07)',border:'1px solid rgba(168,85,247,0.25)',borderRadius:14,padding:16,display:'flex',gap:10,alignItems:'flex-start'}}>
          <Cpu size={15} color="#a855f7" style={{flexShrink:0,marginTop:2}}/>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'#a855f7',marginBottom:4}}>AI AUTHORITY BRIEF</p>
            {briefLoading ? <p style={{fontSize:13,color:'var(--text2)'}}>Generating brief...</p>
              : <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.7}}>{aiBrief}</p>}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterTabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: filter === key ? STATUS_CFG[key].bg : 'rgba(255,255,255,.04)',
              color:      filter === key ? STATUS_CFG[key].color : '#64748b',
              border:     filter === key ? `1px solid ${STATUS_CFG[key].color}44` : '1px solid rgba(255,255,255,.07)',
            }}>
            {label}
            {count != null && (
              <span style={{
                background: filter === key ? STATUS_CFG[key].color : 'rgba(255,255,255,.1)',
                color: filter === key ? '#0f172a' : '#94a3b8',
                borderRadius:999, padding:'1px 7px', fontSize:11, fontWeight:700
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Issues list */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            {STATUS_CFG[filter]?.label} Issues
            <span style={{ background:STATUS_CFG[filter]?.bg, color:STATUS_CFG[filter]?.color,
              borderRadius:999, padding:'1px 8px', fontSize:12 }}>
              {issues.length}
            </span>
          </h2>
          <button onClick={fetchData} className="text-xs text-slate-500 hover:text-white transition-colors">
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">
              {filter === 'resolved' ? '' : filter === 'reported' ? '' : ''}
            </p>
            <p className="text-slate-400 font-medium">
              {filter === 'resolved' ? 'Great work! Issues resolved.' :
               filter === 'reported' ? 'No new issues — all caught up!' :
               'Nothing here yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {issues.map(issue => (
              <div key={issue.id} className="p-5 hover:bg-white/2 transition-all group">
                <div className="flex items-start gap-4">

                  {/* Category icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)' }}>
                    {CAT_ICONS[issue.category] || ''}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(`/issues/${issue.id}`)}
                      className="text-sm font-semibold text-white hover:text-green-400 transition-colors text-left leading-tight">
                      {issue.title}
                    </button>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={10}/> {issue.area}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <User size={10}/> {issue.reporter_name}
                      </span>
                      <span className="text-xs text-slate-600">
                        {new Date(issue.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                      <span className="text-xs text-slate-500">▲ {issue.upvotes_count} upvotes</span>
                    </div>
                    {issue.description && (
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-1">{issue.description}</p>
                    )}
                  </div>

                  {/* Priority + Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <PriorityBadge score={issue.priority_score} />

                    <div className="flex flex-col gap-1.5">
                      {filter === 'reported' && <>
                        <button
                          disabled={!!updating}
                          onClick={() => updateStatus(issue.id, 'in_progress')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background:'rgba(250,204,21,.15)', color:'#facc15', border:'1px solid rgba(250,204,21,.3)' }}>
                          <Clock size={11}/> Start Work
                        </button>
                        <button
                          disabled={!!updating}
                          onClick={() => updateStatus(issue.id, 'rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background:'rgba(239,68,68,.08)', color:'#f87171', border:'1px solid rgba(239,68,68,.2)' }}>
                          Reject ✗
                        </button>
                      </>}

                      {filter === 'in_progress' && <>
                        <button
                          disabled={!!updating}
                          onClick={() => updateStatus(issue.id, 'resolved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background:'rgba(34,197,94,.15)', color:'#4ade80', border:'1px solid rgba(34,197,94,.3)' }}>
                          <CheckCircle size={11}/> Mark Resolved
                        </button>
                        <button
                          disabled={!!updating}
                          onClick={() => updateStatus(issue.id, 'reported')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background:'rgba(100,116,139,.1)', color:'#94a3b8', border:'1px solid rgba(100,116,139,.2)' }}>
                          <Pause size={11}/> Put on Hold
                        </button>
                      </>}

                      {(filter === 'resolved' || filter === 'rejected') && (
                        <button onClick={() => navigate(`/issues/${issue.id}`)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all"
                          style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)' }}>
                          View <ChevronRight size={11}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
