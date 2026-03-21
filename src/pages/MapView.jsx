import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Flame, RefreshCw, Wifi, Plus, X, MapPin, Clock, ThumbsUp, AlertTriangle, ChevronRight, Navigation } from 'lucide-react'
import { useRealtimeIssues } from '../hooks/useRealtimeIssues'

const CATS = {
  road:        { emoji: '🛣️', color: '#f97316', label: 'Road' },
  water:       { emoji: '💧', color: '#38bdf8', label: 'Water' },
  electricity: { emoji: '⚡', color: '#facc15', label: 'Electricity' },
  garbage:     { emoji: '🗑️', color: '#22c55e', label: 'Garbage' },
  sewage:      { emoji: '🔧', color: '#a855f7', label: 'Sewage' },
  parks:       { emoji: '🌳', color: '#22d3ee', label: 'Parks' },
  other:       { emoji: '📌', color: '#94a3b8', label: 'Other' },
}

const STATUS_COLORS = {
  reported:    '#ef4444',
  in_progress: '#facc15',
  resolved:    '#22c55e',
  rejected:    '#475569',
}

// Demo issues seeded around Bhubaneswar localities
// These show on map even when DB is empty, so it always looks live
const DEMO_ISSUES = [
  { id:'d1', title:'Pothole on NH-16 near Patia', category:'road', status:'reported', area:'Patia', latitude:20.3548, longitude:85.8189, upvotes_count:14, priority_score:52, created_at: new Date(Date.now()-3600000).toISOString(), reporter_name:'Rahul Panda', description:'Large pothole causing accidents near Patia Square.' },
  { id:'d2', title:'Water pipe burst near Saheed Nagar', category:'water', status:'in_progress', area:'Saheed Nagar', latitude:20.2938, longitude:85.8432, upvotes_count:28, priority_score:71, created_at: new Date(Date.now()-7200000).toISOString(), reporter_name:'Priya Das', description:'Water gushing out since last night, road flooded.' },
  { id:'d3', title:'Street light out — Nayapalli', category:'electricity', status:'reported', area:'Nayapalli', latitude:20.2936, longitude:85.8149, upvotes_count:9, priority_score:38, created_at: new Date(Date.now()-86400000).toISOString(), reporter_name:'Amit Mohanty', description:'Entire stretch dark after 8pm, safety concern.' },
  { id:'d4', title:'Garbage pile near Khandagiri', category:'garbage', status:'reported', area:'Khandagiri', latitude:20.2522, longitude:85.7760, upvotes_count:19, priority_score:44, created_at: new Date(Date.now()-43200000).toISOString(), reporter_name:'Smita Rath', description:'Uncollected garbage for 5 days, foul smell.' },
  { id:'d5', title:'Drainage overflow — Chandrasekharpur', category:'sewage', status:'in_progress', area:'Chandrasekharpur', latitude:20.3229, longitude:85.8156, upvotes_count:33, priority_score:78, created_at: new Date(Date.now()-1800000).toISOString(), reporter_name:'Deepak Sahu', description:'Sewage overflowing into road near CDA colony.' },
  { id:'d6', title:'Park benches broken — Jaydev Vihar', category:'parks', status:'reported', area:'Jaydev Vihar', latitude:20.3014, longitude:85.8360, upvotes_count:7, priority_score:29, created_at: new Date(Date.now()-172800000).toISOString(), reporter_name:'Anita Nayak', description:'All benches near children play area damaged.' },
  { id:'d7', title:'Road crack near Rasulgarh flyover', category:'road', status:'reported', area:'Rasulgarh', latitude:20.2803, longitude:85.8396, upvotes_count:21, priority_score:58, created_at: new Date(Date.now()-5400000).toISOString(), reporter_name:'Suresh Barik', description:'Major crack running across road near flyover.' },
  { id:'d8', title:'No water supply — Unit 9', category:'water', status:'reported', area:'Unit-9', latitude:20.2644, longitude:85.8416, upvotes_count:41, priority_score:85, created_at: new Date(Date.now()-900000).toISOString(), reporter_name:'Kabita Mishra', description:'No water for 2 days in entire Unit-9 area.' },
  { id:'d9', title:'Transformer fault — Mancheswar', category:'electricity', status:'in_progress', area:'Mancheswar', latitude:20.2734, longitude:85.8616, upvotes_count:16, priority_score:49, created_at: new Date(Date.now()-21600000).toISOString(), reporter_name:'Raju Behera', description:'Transformer sparking, residents scared.' },
  { id:'d10', title:'Illegal dumping — Bomikhal', category:'garbage', status:'reported', area:'Bomikhal', latitude:20.2867, longitude:85.8521, upvotes_count:12, priority_score:41, created_at: new Date(Date.now()-64800000).toISOString(), reporter_name:'Neha Tripathy', description:'Construction waste dumped on footpath.' },
  { id:'d11', title:'Sewage blockage — Old Town', category:'sewage', status:'reported', area:'Bhubaneswar Old Town', latitude:20.2390, longitude:85.8384, upvotes_count:25, priority_score:66, created_at: new Date(Date.now()-10800000).toISOString(), reporter_name:'Bipin Das', description:'Main sewer line blocked near Old Town market.' },
  { id:'d12', title:'Pothole cluster — Infocity', category:'road', status:'in_progress', area:'Infocity', latitude:20.3468, longitude:85.8136, upvotes_count:37, priority_score:82, created_at: new Date(Date.now()-2700000).toISOString(), reporter_name:'Tech Park Resident', description:'Multiple potholes on main Infocity access road.' },
]

function makeIcon(issue) {
  const cat   = CATS[issue.category] || CATS.other
  const color = cat.color
  const isNew = (Date.now() - new Date(issue.created_at).getTime()) < 7200000
  const isHot = (issue.priority_score || 0) > 50

  const pulse = (isNew || isHot) ? `
    <div style="position:absolute;top:0;left:50%;
      width:50px;height:50px;border-radius:50%;
      background:${color}40;
      transform:translateX(-50%);
      animation:uvp 2s ease-out infinite;">
    </div>` : ''

  return L.divIcon({
    className: '',
    iconSize:  [38, 50],
    iconAnchor:[19, 48],
    html: `
      <style>
        @keyframes uvp{0%{transform:translateX(-50%) scale(.4);opacity:1}100%{transform:translateX(-50%) scale(2.4);opacity:0}}
      </style>
      <div style="position:relative;width:38px;height:50px;">
        ${pulse}
        <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
          width:10px;height:5px;border-radius:50%;background:rgba(0,0,0,.5);filter:blur(2px);"></div>
        <div style="position:absolute;top:0;left:50%;
          width:34px;height:34px;
          transform:translateX(-50%) rotate(-45deg);
          border-radius:50% 50% 0 50%;
          background:linear-gradient(135deg,${color} 0%,${color}99 60%,${color}55 100%);
          box-shadow:0 6px 18px ${color}88,0 2px 6px rgba(0,0,0,.6),inset 0 2px 4px rgba(255,255,255,.3);
          border:2px solid rgba(255,255,255,.25);">
        </div>
        <div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);
          font-size:15px;line-height:1;z-index:2;
          filter:drop-shadow(0 1px 3px rgba(0,0,0,.7));">
          ${cat.emoji}
        </div>
      </div>`
  })
}

function makeReportPin() {
  return L.divIcon({
    className:'', iconSize:[22,22], iconAnchor:[11,11],
    html:`<div style="width:22px;height:22px;border-radius:50%;
      background:linear-gradient(135deg,#22c55e,#16a34a);
      border:3px solid #fff;
      box-shadow:0 0 0 4px #22c55e55,0 4px 14px rgba(0,0,0,.4);
      animation:uvb .8s ease infinite alternate;">
    </div>
    <style>@keyframes uvb{0%{transform:translateY(0)}100%{transform:translateY(-7px)}}</style>`
  })
}

function timeAgo(d) {
  const m = Math.floor((Date.now()-new Date(d).getTime())/60000)
  if (m<1) return 'just now'
  if (m<60) return `${m}m ago`
  const h=Math.floor(m/60)
  if (h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function FlyTo({coords}){
  const map=useMap()
  useEffect(()=>{ if(coords) map.flyTo(coords,16,{animate:true,duration:1.2}) },[coords,map])
  return null
}

function MapClickHandler({onMapClick,active}){
  useMapEvents({ click:(e)=>{ if(active) onMapClick(e.latlng) } })
  return null
}

function HeatmapLayer({data}){
  const map=useMap(); const ref=useRef(null)
  useEffect(()=>{
    if(!data.length) return
    import('leaflet.heat').then(()=>{
      if(ref.current) map.removeLayer(ref.current)
      ref.current=L.heatLayer(data.map(p=>[p.lat,p.lng,p.weight/100]),{
        radius:40,blur:20,maxZoom:17,
        gradient:{0.2:'#22c55e',0.5:'#facc15',0.8:'#f97316',1.0:'#ef4444'}
      }).addTo(map)
    }).catch(()=>{})
    return ()=>{ if(ref.current) map.removeLayer(ref.current) }
  },[data,map]); return null
}

// Force dark style on OSM tiles via CSS filter
function DarkTileLayer() {
  const map = useMap()
  useEffect(() => {
    const pane = map.getPane('tilePane')
    if (pane) {
      pane.style.filter = 'invert(100%) hue-rotate(180deg) brightness(0.85) contrast(1.1) saturate(0.6)'
    }
  }, [map])
  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      maxZoom={19}
    />
  )
}

export default function MapView() {
  const [dbIssues,    setDbIssues]    = useState([])
  const [heatData,    setHeatData]    = useState([])
  const [filters,     setFilters]     = useState({category:'',status:''})
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [reportMode,  setReportMode]  = useState(false)
  const [reportPin,   setReportPin]   = useState(null)
  const [flyTo,       setFlyTo]       = useState(null)
  const [liveNew,     setLiveNew]     = useState(0)
  const navigate = useNavigate()

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filters.category) p.set('category', filters.category)
      if (filters.status)   p.set('status',   filters.status)
      p.set('limit','200')
      const [iRes, hRes] = await Promise.all([
        axios.get(`/api/issues/?${p.toString()}`),
        axios.get('/api/issues/heatmap'),
      ])
      const raw = iRes.data
      setDbIssues(Array.isArray(raw) ? raw : (raw.items ?? []))
      setHeatData(hRes.data)
    } catch(e) {
      console.error('fetch error', e)
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchIssues() }, [fetchIssues])

  useRealtimeIssues({
    onNewIssue:     (i) => { setDbIssues(p=>[i,...p]); setLiveNew(c=>c+1) },
    onIssueUpdated: (i) => setDbIssues(p=>p.map(x=>x.id===i.id?i:x)),
  })

  // Merge DB issues + demo issues (demo only shows if no DB issues yet)
  const allIssues = dbIssues.length > 0 ? dbIssues : DEMO_ISSUES

  const visible = allIssues.filter(i => {
    if (filters.category && i.category !== filters.category) return false
    if (filters.status   && i.status   !== filters.status)   return false
    return i.latitude && i.longitude
  })

  const goReport = () => {
    if (!reportPin) return
    navigate(`/report?lat=${reportPin.lat.toFixed(6)}&lng=${reportPin.lng.toFixed(6)}`)
  }

  const locateMe = () => {
    navigator.geolocation?.getCurrentPosition(pos =>
      setFlyTo([pos.coords.latitude, pos.coords.longitude])
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16,height:'100%'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="font-display text-3xl font-bold text-white" style={{display:'flex',alignItems:'center',gap:8}}>
            <MapPin size={26} className="text-green-400"/> Live Issue Map
          </h1>
          <p className="text-slate-500 text-sm" style={{marginTop:2}}>
            {visible.length} issues · Bhubaneswar
            {dbIssues.length === 0 && <span style={{marginLeft:8,fontSize:11,color:'#facc15'}}>⚡ demo data</span>}
            {liveNew>0 && <span style={{marginLeft:8,color:'#4ade80',fontWeight:600,fontSize:12}}>
              <Wifi size={11} style={{display:'inline',marginRight:3}}/>{liveNew} new live
            </span>}
          </p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>{setReportMode(!reportMode);setReportPin(null)}}
            style={{
              display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:12,
              fontSize:13,fontWeight:700,cursor:'pointer',border:'none',
              background: reportMode ? '#22c55e' : 'rgba(255,255,255,.07)',
              color: reportMode ? '#0f172a' : '#cbd5e1',
              boxShadow: reportMode ? '0 0 20px rgba(34,197,94,.4)' : 'none',
            }}>
            <Plus size={14}/> {reportMode ? 'Click map to pin' : 'Report on Map'}
          </button>
          <button onClick={()=>setShowHeatmap(!showHeatmap)} style={{
            display:'flex',alignItems:'center',gap:6,padding:'8px 12px',borderRadius:12,
            fontSize:13,cursor:'pointer',border:'1px solid rgba(255,255,255,.1)',fontWeight:600,
            background: showHeatmap ? 'rgba(249,115,22,.15)' : 'rgba(255,255,255,.05)',
            color: showHeatmap ? '#fb923c' : '#94a3b8',
          }}>
            <Flame size={14}/> Heatmap
          </button>
          <button onClick={locateMe} title="Locate me" style={{
            padding:'8px',borderRadius:12,border:'1px solid rgba(255,255,255,.1)',
            background:'rgba(255,255,255,.05)',color:'#94a3b8',cursor:'pointer'}}>
            <Navigation size={15}/>
          </button>
          <button onClick={fetchIssues} style={{
            padding:'8px',borderRadius:12,border:'1px solid rgba(255,255,255,.1)',
            background:'rgba(255,255,255,.05)',color:'#94a3b8',cursor:'pointer'}}>
            <RefreshCw size={15} style={loading?{animation:'spin 1s linear infinite'}:{}}/>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl border border-white/5" style={{padding:'12px 16px',display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
        <span style={{fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>Filter</span>
        <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))}
          style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,padding:'6px 12px',color:'white',fontSize:13,outline:'none'}}>
          <option value="" style={{background:'#0f172a'}}>All Categories</option>
          {Object.entries(CATS).map(([k,v])=>
            <option key={k} value={k} style={{background:'#0f172a'}}>{v.emoji} {v.label}</option>
          )}
        </select>
        <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}
          style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,padding:'6px 12px',color:'white',fontSize:13,outline:'none'}}>
          <option value="" style={{background:'#0f172a'}}>All Status</option>
          {Object.keys(STATUS_COLORS).map(s=>
            <option key={s} value={s} style={{background:'#0f172a'}}>{s.replace('_',' ')}</option>
          )}
        </select>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginLeft:'auto'}}>
          {Object.entries(CATS).map(([k,v])=>(
            <button key={k} onClick={()=>setFilters(f=>({...f,category:f.category===k?'':k}))}
              style={{
                padding:'4px 10px',borderRadius:999,fontSize:12,fontWeight:600,cursor:'pointer',
                border: filters.category===k ? 'none' : '1px solid rgba(255,255,255,.12)',
                background: filters.category===k ? v.color : 'rgba(255,255,255,.05)',
                color: filters.category===k ? '#0f172a' : '#94a3b8',
              }}>
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Side panel */}
      <div style={{display:'flex',gap:16,flex:1,minHeight:500}}>
        <div style={{
          flex:1,borderRadius:16,overflow:'hidden',position:'relative',
          boxShadow:'0 0 0 1px rgba(255,255,255,.08),0 16px 48px rgba(0,0,0,.7)',
        }}>
          {reportMode && (
            <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',
              zIndex:1000,background:'#22c55e',color:'#0f172a',padding:'8px 20px',borderRadius:12,
              fontWeight:700,fontSize:13,boxShadow:'0 4px 20px rgba(34,197,94,.5)',pointerEvents:'none'}}>
              📍 Click anywhere on the map to pin your issue
            </div>
          )}

          <MapContainer center={[20.2961, 85.8245]} zoom={13}
            style={{height:'100%',width:'100%'}} zoomControl={true}>

            {/* OSM tiles + CSS dark filter = works on any network */}
            <DarkTileLayer />

            {flyTo && <FlyTo coords={flyTo}/>}
            {showHeatmap && <HeatmapLayer data={heatData}/>}
            <MapClickHandler onMapClick={setReportPin} active={reportMode}/>

            {reportPin && (
              <Marker position={[reportPin.lat, reportPin.lng]} icon={makeReportPin()}>
                <Popup>
                  <div style={{fontFamily:'system-ui',minWidth:160,textAlign:'center'}}>
                    <p style={{fontWeight:700,marginBottom:6,fontSize:14}}>📍 Report here?</p>
                    <p style={{fontSize:11,color:'#64748b',marginBottom:10,fontFamily:'monospace'}}>
                      {reportPin.lat.toFixed(5)}, {reportPin.lng.toFixed(5)}
                    </p>
                    <button onClick={goReport} style={{
                      background:'#22c55e',color:'#0f172a',padding:'7px 0',borderRadius:8,
                      fontSize:13,fontWeight:700,border:'none',cursor:'pointer',width:'100%'}}>
                      Continue →
                    </button>
                  </div>
                </Popup>
              </Marker>
            )}

            {!showHeatmap && visible.map(issue=>(
              <Marker key={issue.id} position={[issue.latitude, issue.longitude]}
                icon={makeIcon(issue)}
                eventHandlers={{click:()=>setSelected(issue)}}>
                <Popup>
                  <div style={{fontFamily:'system-ui',minWidth:210}}>
                    <div style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8}}>
                      <span style={{fontSize:22}}>{CATS[issue.category]?.emoji}</span>
                      <div>
                        <p style={{fontWeight:700,fontSize:14,margin:0,color:'#1e293b'}}>{issue.title}</p>
                        <p style={{fontSize:11,color:'#64748b',margin:0}}>{issue.area}</p>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
                      <span style={{background:STATUS_COLORS[issue.status]+'22',color:STATUS_COLORS[issue.status],padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:600}}>
                        {issue.status?.replace('_',' ')}
                      </span>
                      <span style={{background:'#f0fdf4',color:'#16a34a',padding:'2px 8px',borderRadius:999,fontSize:11}}>▲ {issue.upvotes_count}</span>
                      <span style={{background:'#fef9ec',color:'#b45309',padding:'2px 8px',borderRadius:999,fontSize:11}}>🔥 {Math.round(issue.priority_score||0)}</span>
                    </div>
                    <p style={{fontSize:11,color:'#94a3b8',marginBottom:10}}>{timeAgo(issue.created_at)}</p>
                    {issue.id?.toString().startsWith('d') ? (
                      <p style={{fontSize:11,color:'#64748b',textAlign:'center',padding:'4px 0'}}>📋 Demo issue</p>
                    ) : (
                      <button onClick={()=>navigate(`/issues/${issue.id}`)} style={{
                        background:'#22c55e',color:'#0f172a',padding:'7px 0',width:'100%',
                        borderRadius:8,fontSize:12,fontWeight:700,border:'none',cursor:'pointer'}}>
                        View Details →
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Side panel */}
        {selected && (
          <div className="glass animate-slide-up" style={{
            width:300,flexShrink:0,borderRadius:16,overflow:'hidden',display:'flex',flexDirection:'column',
            border:'1px solid rgba(255,255,255,.08)',boxShadow:'0 12px 40px rgba(0,0,0,.5)',
          }}>
            <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{width:40,height:40,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
                  background:(CATS[selected.category]?.color||'#94a3b8')+'22'}}>
                  {CATS[selected.category]?.emoji}
                </div>
                <div>
                  <p style={{fontWeight:700,color:'white',fontSize:13,margin:0,lineHeight:1.3}}>{selected.title}</p>
                  <p style={{fontSize:11,color:'#64748b',margin:0}}>{selected.area}</p>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',padding:4}}><X size={15}/></button>
            </div>
            <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',gap:6}}>
              <span style={{padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:700,
                background:STATUS_COLORS[selected.status]+'22',color:STATUS_COLORS[selected.status]}}>
                {selected.status?.replace('_',' ')}
              </span>
              <span style={{padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:700,
                background:(CATS[selected.category]?.color||'#94a3b8')+'22',color:CATS[selected.category]?.color||'#94a3b8'}}>
                {CATS[selected.category]?.label}
              </span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
              {[
                {icon:<ThumbsUp size={13}/>,label:'Upvotes',val:selected.upvotes_count},
                {icon:<AlertTriangle size={13}/>,label:'Priority',val:Math.round(selected.priority_score||0)},
                {icon:<Clock size={13}/>,label:'Age',val:timeAgo(selected.created_at)},
              ].map(({icon,label,val},i)=>(
                <div key={i} style={{padding:'10px 8px',textAlign:'center',borderRight:i<2?'1px solid rgba(255,255,255,.05)':'none'}}>
                  <div style={{color:'#475569',display:'flex',justifyContent:'center',marginBottom:3}}>{icon}</div>
                  <p style={{fontWeight:700,color:'white',fontSize:14,margin:0}}>{val}</p>
                  <p style={{fontSize:10,color:'#475569',margin:0}}>{label}</p>
                </div>
              ))}
            </div>
            <div style={{padding:16,flex:1,overflowY:'auto'}}>
              {selected.description && <p style={{fontSize:12,color:'#94a3b8',lineHeight:1.6,marginBottom:12}}>{selected.description}</p>}
              {selected.reporter_name && (
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#475569',marginBottom:12}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#22d3ee)',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#0f172a'}}>
                    {selected.reporter_name[0]}
                  </div>
                  By {selected.reporter_name}
                </div>
              )}
              <div style={{padding:'6px 10px',background:'rgba(255,255,255,.03)',borderRadius:8,fontSize:10,color:'#475569',fontFamily:'monospace'}}>
                {selected.latitude?.toFixed(5)}, {selected.longitude?.toFixed(5)}
              </div>
            </div>
            <div style={{padding:16,borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',flexDirection:'column',gap:8}}>
              {!selected.id?.toString().startsWith('d') && (
                <button onClick={()=>navigate(`/issues/${selected.id}`)} style={{
                  background:'#22c55e',color:'#0f172a',padding:'10px 0',borderRadius:12,
                  fontSize:13,fontWeight:700,border:'none',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  View Full Details <ChevronRight size={14}/>
                </button>
              )}
              <button onClick={()=>setFlyTo([selected.latitude,selected.longitude])} style={{
                background:'rgba(255,255,255,.04)',color:'#94a3b8',padding:'8px 0',borderRadius:12,
                fontSize:12,border:'1px solid rgba(255,255,255,.08)',cursor:'pointer'}}>
                📍 Fly to on map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="glass rounded-xl border border-white/5" style={{padding:'12px 16px',display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
        <span style={{fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:700}}>Legend</span>
        {Object.entries(CATS).map(([k,v])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#94a3b8'}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:v.color,boxShadow:`0 0 7px ${v.color}99`,flexShrink:0}}/>
            {v.emoji} {v.label}
          </div>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#475569'}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:'rgba(74,222,128,.35)',border:'1px solid rgba(74,222,128,.6)'}}/>
          Pulse = new / high priority
        </div>
      </div>
    </div>
  )
}
