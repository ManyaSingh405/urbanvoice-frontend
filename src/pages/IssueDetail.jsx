import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, ThumbsUp, AlertTriangle, Clock, CheckCircle, MapPin, User, Calendar, Zap, Copy } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CAT_ICONS = { road: '', water: '', electricity: '', garbage: '', sewage: '', parks: '', other: '' }

export default function IssueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upvoting, setUpvoting] = useState(false)
  const [hasUpvoted, setHasUpvoted] = useState(false)

  useEffect(() => {
    axios.get(`/api/issues/${id}`).then(r => setIssue(r.data)).finally(() => setLoading(false))
  }, [id])

  const handleUpvote = async () => {
    setUpvoting(true)
    try {
      const res = await axios.post(`/api/issues/${id}/upvote`)
      setIssue(prev => ({ ...prev, upvotes_count: res.data.upvotes, priority_score: res.data.priority_score }))
      setHasUpvoted(res.data.action === 'added')
      toast.success(res.data.action === 'added' ? 'Upvoted!' : 'Upvote removed')
    } catch {
      toast.error('Failed to upvote')
    } finally {
      setUpvoting(false)
    }
  }

  const updateStatus = async (status) => {
    try {
      const res = await axios.patch(`/api/issues/${id}`, { status })
      setIssue(prev => ({ ...prev, status: res.data.status, resolved_at: res.data.resolved_at }))
      toast.success('Status updated!')
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!issue) return <div className="text-center text-slate-500 py-20">Issue not found</div>

  const priorityColor = issue.priority_score > 50 ? 'text-red-400' : issue.priority_score > 25 ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-xl p-6 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{CAT_ICONS[issue.category] || ''}</div>
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold text-white">{issue.title}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium badge-${issue.category}`}>{issue.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium status-${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                  {issue.similar_issue_id && (
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs flex items-center gap-1">
                      <Copy size={10} /> Similar issue exists
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-slate-400 mt-4 leading-relaxed font-body">{issue.description}</p>

            {issue.photo_url && (
              <img src={issue.photo_url} alt="Issue" className="mt-4 rounded-xl w-full object-cover max-h-64 border border-white/10" />
            )}

            <div className="grid grid-cols-2 gap-4 mt-5">
              {[
                { icon: MapPin, label: 'Area', val: issue.area },
                { icon: User, label: 'Reported by', val: issue.reporter_name },
                { icon: Calendar, label: 'Reported', val: new Date(issue.created_at).toLocaleDateString() },
                { icon: CheckCircle, label: 'Resolved', val: issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString() : 'Pending' },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon size={14} className="text-slate-500 flex-shrink-0" />
                  <span className="text-slate-500">{label}:</span>
                  <span className="text-slate-300 truncate">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          {issue.latitude && issue.longitude && (
            <div className="glass rounded-xl p-5 border border-white/5">
              <h3 className="font-display font-semibold text-white mb-3 text-sm flex items-center gap-2">
                <MapPin size={14} className="text-green-400" /> Issue Location
              </h3>
              <div className="rounded-xl overflow-hidden h-48 border border-white/5">
                <MapContainer center={[issue.latitude, issue.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[issue.latitude, issue.longitude]} />
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Priority + Upvote */}
          <div className="glass rounded-xl p-5 border border-white/5">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={14} className={priorityColor} />
                <span className="text-xs text-slate-500 uppercase tracking-wider">AI Priority Score</span>
              </div>
              <p className={`font-display text-4xl font-bold ${priorityColor}`}>{Math.round(issue.priority_score)}</p>
              <p className="text-xs text-slate-600 mt-1">Based on severity + votes + time</p>
            </div>
            <button onClick={handleUpvote} disabled={upvoting}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm ${hasUpvoted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'glass-light text-white hover:bg-white/10 border border-white/10'}`}>
              <ThumbsUp size={15} /> {issue.upvotes_count} Upvotes
            </button>
          </div>

          {/* Status update - authority/admin */}
          {(user?.role === 'authority' || user?.role === 'admin') && (
            <div className="glass rounded-xl p-5 border border-white/5">
              <h3 className="font-display font-semibold text-white text-sm mb-3">Update Status</h3>
              <div className="space-y-2">
                {['reported', 'in_progress', 'resolved', 'rejected'].map(s => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${issue.status === s ? `status-${s}` : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    {s.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {issue.ai_summary && (
            <div className="glass rounded-xl p-5 border border-white/5">
              <h3 className="font-display font-semibold text-white text-sm mb-2 flex items-center gap-2">
                <Zap size={13} className="text-green-400" /> AI Summary
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{issue.ai_summary}</p>
            </div>
          )}

          {/* Similar issue warning */}
          {issue.similar_issue_id && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-yellow-400">Similar Issue Detected</p>
                  <p className="text-xs text-slate-500 mt-1">A similar issue has already been reported. Consider upvoting that one instead.</p>
                  <button onClick={() => navigate(`/issues/${issue.similar_issue_id}`)} className="text-xs text-yellow-400 hover:text-yellow-300 mt-2 underline">
                    View similar issue →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
