import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import toast from 'react-hot-toast'
import { MapPin, Send, AlertTriangle, Cpu, CheckCircle, Loader } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const AREAS = ['Patia','Saheed Nagar','Nayapalli','Chandrasekharpur','Bhubaneswar Old Town','Khandagiri','Mancheswar','Rasulgarh','Jaydev Vihar','Bomikhal','Unit-9','Master Canteen','Tamando','Infocity','Aiginia','Downtown']

const CATEGORIES = [
  { value:'road',        label:'Road Issue',        defaultTitle:'Road/pothole problem',       desc:'Potholes, cracks, cave-ins', icon:'🛣️',  custom:false },
  { value:'water',       label:'Water Problem',      defaultTitle:'Water supply issue',         desc:'Leaks, contamination, no supply', icon:'💧', custom:false },
  { value:'electricity', label:'Electricity Fault',  defaultTitle:'Electricity/street light fault', desc:'Outage, sparking, broken lights', icon:'⚡', custom:false },
  { value:'garbage',     label:'Garbage Issue',      defaultTitle:'Uncollected garbage complaint', desc:'Waste, dumping, overflowing bins', icon:'🗑️', custom:false },
  { value:'sewage',      label:'Sewage Problem',     defaultTitle:'Sewage/drainage overflow',   desc:'Drain blockage, overflow', icon:'🔧', custom:false },
  { value:'parks',       label:'Park Maintenance',   defaultTitle:'Park facility needs repair', desc:'Broken equipment, overgrown areas', icon:'🌳', custom:false },
  { value:'other',       label:'Other Issue',        defaultTitle:'',                           desc:'Any other civic problem', icon:'📌', custom:true  },
]

const SEV_COLOR = { low:'#22c55e', medium:'#facc15', high:'#fb923c', critical:'#ef4444' }

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]) } })
  return position ? <Marker position={position}/> : null
}

export default function ReportIssue() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initLat = parseFloat(searchParams.get('lat'))
  const initLng = parseFloat(searchParams.get('lng'))
  const initPos = (!isNaN(initLat) && !isNaN(initLng)) ? [initLat, initLng] : null

  const [form,      setForm]      = useState({ title:'', description:'', category:'', area:'Patia', photo_url:'' })
  const [position,  setPosition]  = useState(initPos)
  const [loading,   setLoading]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult,  setAiResult]  = useState(null)

  const selectedCat = CATEGORIES.find(c => c.value === form.category)

  // When category changes, auto-fill title (unless custom)
  const handleCategoryChange = (val) => {
    const cat = CATEGORIES.find(c => c.value === val)
    setForm(f => ({
      ...f,
      category: val,
      title: cat && !cat.custom ? cat.defaultTitle : f.title,
    }))
    setAiResult(null)
  }

  // Debounced Groq AI on description change (for "other" or custom title)
  useEffect(() => {
    if (!form.description || form.description.length < 10) { setAiResult(null); return }
    const timer = setTimeout(async () => {
      setAiLoading(true)
      try {
        const res = await axios.post('/api/issues/ai/categorize', {
          title: form.title, description: form.description
        })
        if (res.data?.suggested_category) setAiResult(res.data)
      } catch {} finally { setAiLoading(false) }
    }, 900)
    return () => clearTimeout(timer)
  }, [form.description, form.title])

  const applyAi = () => {
    if (!aiResult) return
    setForm(f => ({
      ...f,
      category: aiResult.suggested_category || f.category,
      title:    aiResult.suggested_title    || f.title,
    }))
    toast.success('AI suggestion applied')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!position)     { toast.error('Please pin a location on the map'); return }
    if (!form.category){ toast.error('Please select a category'); return }
    if (!form.title.trim()){ toast.error('Please enter a title'); return }
    setLoading(true)
    try {
      const res = await axios.post('/api/issues/', {
        ...form, latitude:position[0], longitude:position[1],
      })
      if (res.data.duplicate_warning) toast(`Note: ${res.data.duplicate_warning}`, { icon:'ℹ️' })
      toast.success('Issue reported!')
      navigate(`/issues/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to report issue')
    } finally { setLoading(false) }
  }

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      p => { setPosition([p.coords.latitude, p.coords.longitude]); toast.success('Location detected') },
      ()  => toast.error('Location access denied')
    )
  }

  const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:22 }
  const inp  = {
    width:'100%', background:'var(--surface)', border:'1px solid var(--border2)',
    borderRadius:11, padding:'11px 14px', color:'var(--text)', fontSize:13,
    outline:'none', fontFamily:'Inter,sans-serif',
  }

  return (
    <div style={{ maxWidth:980, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }} className="animate-fade-in">
      <div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Report an Issue</h1>
        <p style={{ fontSize:13, color:'var(--text2)' }}>Select a category, describe the problem, and pin the location on the map</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* STEP 1: Category first — drives title */}
          <div style={card}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Step 1 — Select Category *</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => handleCategoryChange(cat.value)}
                  style={{
                    padding:'10px 12px', borderRadius:11, textAlign:'left', cursor:'pointer',
                    background: form.category===cat.value ? 'rgba(34,197,94,0.1)' : 'var(--surface)',
                    border: `1px solid ${form.category===cat.value ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                    transition:'all .15s',
                  }}>
                  <p style={{ fontSize:18, marginBottom:3 }}>{cat.icon}</p>
                  <p style={{ fontSize:12, fontWeight:700, color: form.category===cat.value ? '#22c55e' : 'var(--text)' }}>{cat.label}</p>
                  <p style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Details */}
          <div style={card}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Step 2 — Issue Details *</p>

            {/* Title — auto-filled or editable for "other" */}
            <div style={{ marginBottom:13 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>Title</p>
                {selectedCat && !selectedCat.custom && (
                  <span style={{ fontSize:10, color:'#22c55e', background:'rgba(34,197,94,0.1)', padding:'2px 8px', borderRadius:999 }}>Auto-filled</span>
                )}
              </div>
              <input
                value={form.title}
                onChange={e => setForm({...form, title:e.target.value})}
                placeholder={selectedCat?.custom ? 'Describe the issue briefly...' : 'Select a category above to auto-fill'}
                readOnly={!!(selectedCat && !selectedCat.custom)}
                style={{
                  ...inp,
                  background: (selectedCat && !selectedCat.custom) ? (document.documentElement.getAttribute('data-theme')==='light'?'rgba(0,0,0,0.04)':'rgba(255,255,255,0.03)') : 'var(--surface)',
                  color: (selectedCat && !selectedCat.custom) ? '#22c55e' : 'var(--text)',
                  cursor: (selectedCat && !selectedCat.custom) ? 'default' : 'text',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>Description *</p>
                {aiLoading && <Loader size={11} color="#a855f7" style={{ animation:'spin 1s linear infinite' }}/>}
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description:e.target.value})}
                required rows={3}
                placeholder="Describe the problem in detail — location, severity, how long it's been there..."
                style={{...inp, resize:'none'}}
              />
            </div>

            {/* Area */}
            <div style={{ marginBottom:13 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:7 }}>Area *</p>
              <select value={form.area} onChange={e => setForm({...form, area:e.target.value})} className="uv-select">
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Photo URL */}
            <div>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:7 }}>Photo URL (optional)</p>
              <input value={form.photo_url} onChange={e => setForm({...form, photo_url:e.target.value})}
                placeholder="https://..." style={inp}/>
            </div>
          </div>

          {/* AI Suggestion box */}
          {aiResult && (
            <div style={{ background:'rgba(168,85,247,0.07)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:13, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <Cpu size={14} color="#a855f7"/>
                <p style={{ fontSize:12, fontWeight:700, color:'#a855f7' }}>Groq AI Suggestion</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:'var(--text3)', marginBottom:2 }}>Suggested Category</p>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--text)', textTransform:'capitalize' }}>{aiResult.suggested_category}</p>
                </div>
                <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:'var(--text3)', marginBottom:2 }}>Severity</p>
                  <p style={{ fontSize:13, fontWeight:700, color:SEV_COLOR[aiResult.severity]||'#94a3b8', textTransform:'capitalize' }}>{aiResult.severity}</p>
                </div>
              </div>
              {aiResult.summary && <p style={{ fontSize:11, color:'var(--text2)', lineHeight:1.6, marginBottom:10, fontStyle:'italic' }}>"{aiResult.summary}"</p>}
              <button onClick={applyAi} style={{ width:'100%', padding:'8px', background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:9, color:'#a855f7', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                Apply Suggestion
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Map */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Step 3 — Pin Location *</p>
              <button type="button" onClick={useMyLocation} style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#22c55e', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                <MapPin size={12}/> Use my location
              </button>
            </div>
            <div style={{ borderRadius:11, overflow:'hidden', height:340, border:'1px solid var(--border)' }}>
              {/* Map always dark regardless of theme */}
              <MapContainer center={initPos||[20.2961,85.8245]} zoom={initPos?16:13} style={{ height:'100%', width:'100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap"/>
                <LocationPicker position={position} setPosition={setPosition}/>
              </MapContainer>
            </div>
            <div style={{ marginTop:10 }}>
              {position ? (
                <div style={{ padding:'9px 13px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:9, display:'flex', gap:7, alignItems:'center' }}>
                  <CheckCircle size={13} color="#22c55e"/>
                  <div>
                    <p style={{ fontSize:11, color:'#22c55e', fontWeight:600 }}>Location pinned</p>
                    <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'monospace' }}>{position[0].toFixed(5)}, {position[1].toFixed(5)}</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding:'9px 13px', background:'rgba(250,204,21,0.07)', border:'1px solid rgba(250,204,21,0.2)', borderRadius:9, display:'flex', gap:7, alignItems:'center' }}>
                  <AlertTriangle size={13} color="#facc15"/>
                  <p style={{ fontSize:11, color:'#facc15' }}>Click on the map to pin the issue location</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="button" onClick={handleSubmit}
            disabled={loading || !position || !form.category || !form.title.trim()}
            style={{
              padding:'14px', borderRadius:13, border:'none', fontWeight:700, fontSize:15,
              cursor: (loading||!position||!form.category||!form.title.trim()) ? 'not-allowed' : 'pointer',
              background: (loading||!position||!form.category||!form.title.trim()) ? 'rgba(34,197,94,0.3)' : '#22c55e',
              color: (loading||!position||!form.category||!form.title.trim()) ? 'rgba(255,255,255,0.5)' : '#fff',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow: (!loading&&position&&form.category&&form.title.trim()) ? '0 0 24px rgba(34,197,94,0.4)' : 'none',
              transition:'all .15s',
            }}>
            {loading
              ? <><div style={{ width:17, height:17, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Submitting...</>
              : <><Send size={15}/> Submit Issue Report</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
