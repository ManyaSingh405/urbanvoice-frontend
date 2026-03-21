import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import TeamOrbit from '../components/TeamOrbit'
import {
  Zap, MapPin, Shield, BarChart3, Bell, Users, ArrowRight,
  CheckCircle, Sun, Moon, TrendingUp, Clock, AlertCircle,
  ChevronRight, Star, Building, Activity, Lock, Cpu, GitMerge
} from 'lucide-react'

const FEATURES = [
  { icon:MapPin,    title:'Geo-tagged Reports',        desc:'Pin the exact location of any civic problem directly on the live city map.',  color:'#22c55e'  },
  { icon:Cpu,       title:'Groq AI Categorization',    desc:'Describe your issue in plain words — AI auto-categorizes, titles, and assesses severity in real time.', color:'#a855f7' },
  { icon:Shield,    title:'Authority Accountability',  desc:'Every authority is publicly tracked. Resolution rates, SLA breaches, and neglected areas are visible to all.',   color:'#38bdf8'  },
  { icon:Bell,      title:'Instant Notifications',     desc:'Get real-time alerts the moment your issue status changes or nearby issues are reported.', color:'#facc15' },
  { icon:Users,     title:'Community Upvoting',        desc:'Neighbours upvote to escalate. The priority algorithm automatically surfaces the most critical issues.', color:'#fb923c' },
  { icon:Activity,  title:'Live City Heatmap',         desc:'A visual density map shows problem zones across the city updated in real time via WebSockets.', color:'#f43f5e' },
]

const STEPS = [
  { num:'01', title:'Citizen Reports',      desc:'Select area, describe the issue. Groq AI instantly suggests the category and severity — no manual tagging needed.', icon:MapPin     },
  { num:'02', title:'Authority Notified',   desc:'The ward officer for that exact area is instantly notified. Issue enters their priority queue automatically.',       icon:Bell       },
  { num:'03', title:'Tracked to Resolution',desc:'Every status change — In Progress → Resolved — is broadcast live. Citizen gets a notification at each step.',       icon:CheckCircle},
]

const STATS = [
  { val:'< 0.5s', label:'AI Response Time',    color:'#a855f7' },
  { val:'89%',    label:'Resolution Rate',     color:'#22c55e' },
  { val:'3',      label:'Role-based Dashboards', color:'#38bdf8' },
  { val:'Live',   label:'WebSocket Updates',   color:'#facc15' },
]

const TESTIMONIALS = [
  { name:'Riya Panda',     role:'Resident, Patia',         text:'My pothole complaint was fixed in 3 days. I tracked every update in real time. This is what civic tech should look like.' },
  { name:'Subash Mohanty', role:'Ward Officer, Nayapalli', text:'The AI priority dashboard changed how I manage my queue. I resolve 40% more issues now. The authority brief saves me hours.' },
  { name:'Deepika Sahu',   role:'Resident, Saheed Nagar',  text:'Reported a broken streetlight. The authority acknowledged within hours. Finally a platform that actually creates accountability.' },
]

const PORTALS = [
  { name:'Janasunani',   desc:'Odisha State Grievance Portal', url:'https://janasunani.odisha.gov.in' },
  { name:'SUJOG',        desc:'Urban Local Body Complaints',   url:'https://sujog.odisha.gov.in'      },
  { name:'BMC Helpdesk', desc:'Bhubaneswar Municipal Corp.',   url:'https://bmc.gov.in'               },
  { name:'CPGRAMS',      desc:'Central Govt Grievances',       url:'https://pgportal.gov.in'          },
]

// ── Animated cursor glow ──────────────────────────────────────────────────────
function CursorGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const move = (e) => {
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px'
        ref.current.style.top  = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <div ref={ref} style={{
      position:'fixed', pointerEvents:'none', zIndex:0,
      width:400, height:400, borderRadius:'50%',
      background:'radial-gradient(circle,rgba(34,197,94,0.18) 0%,transparent 70%)',
      transform:'translate(-50%,-50%)',
      transition:'left 0.15s ease, top 0.15s ease',
    }}/>
  )
}

// ── Floating particle canvas ──────────────────────────────────────────────────
function ParticleField({ dark }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const DOTS = Array.from({length:55}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }))

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      DOTS.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0) d.x = canvas.width
        if (d.x > canvas.width) d.x = 0
        if (d.y < 0) d.y = canvas.height
        if (d.y > canvas.height) d.y = 0
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = dark ? 'rgba(74,222,128,0.75)' : 'rgba(22,163,74,0.5)'
        ctx.fill()
      })
      // Draw connecting lines
      for (let i=0;i<DOTS.length;i++) {
        for (let j=i+1;j<DOTS.length;j++) {
          const dx = DOTS[i].x - DOTS[j].x, dy = DOTS[i].y - DOTS[j].y
          const dist = Math.sqrt(dx*dx+dy*dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(DOTS[i].x, DOTS[i].y)
            ctx.lineTo(DOTS[j].x, DOTS[j].y)
            ctx.strokeStyle = dark
              ? `rgba(74,222,128,${0.45*(1-dist/110)})`
              : `rgba(22,163,74,${0.3*(1-dist/110)})`
            ctx.lineWidth = 1.0
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [dark])
  return <canvas ref={canvasRef} style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0}}/>
}

// ── Tilt card on hover ────────────────────────────────────────────────────────
function TiltCard({ children, style={}, className='' }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current; if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x*8}deg) rotateX(${-y*8}deg) scale(1.02)`
  }
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1)' }
  return (
    <div ref={ref} className={className}
      style={{ transition:'transform 0.2s ease', ...style }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimCounter({ target, suffix='' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const num = parseInt(target)
        if (isNaN(num)) { setVal(target); return }
        let start = 0
        const step = num / 40
        const t = setInterval(() => {
          start += step
          if (start >= num) { setVal(num); clearInterval(t) }
          else setVal(Math.floor(start))
        }, 30)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{typeof val === 'number' ? val + suffix : val}</span>
}

// ── Scroll reveal wrapper ─────────────────────────────────────────────────────
function Reveal({ children, delay=0 }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  const accent   = dark ? '#22c55e' : '#16a34a'
  const textMain = dark ? '#f1f5f9' : '#0f172a'
  const textSub  = dark ? '#94a3b8' : '#475569'
  const bg       = dark ? '#0a0f1e' : '#f8fafc'
  const bg2      = dark ? '#0f172a' : '#f1f5f9'
  const cardBg   = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const cardBdr  = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'

  const Card = ({ children, style={} }) => (
    <div style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:16, ...style }}>
      {children}
    </div>
  )

  return (
    <div style={{ background:bg, color:textMain, minHeight:'100vh', overflowX:'hidden' }}>
      <CursorGlow />

      {/* ── NAV ── */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        background: dark ? 'rgba(10,15,30,0.88)' : 'rgba(248,250,252,0.9)',
        backdropFilter:'blur(20px)', borderBottom:`1px solid ${cardBdr}`,
        padding:'0 5%', display:'flex', alignItems:'center', justifyContent:'space-between', height:64,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/logo.svg" alt="UrbanVoice" style={{width:36,height:36,borderRadius:10}} />
          <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:18, color:textMain }}>UrbanVoice</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={toggle} style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:cardBg, border:`1px solid ${cardBdr}`, cursor:'pointer', color:textSub }}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
          <button onClick={() => navigate('/login')} style={{ padding:'8px 16px', borderRadius:10, background:'transparent', border:`1px solid ${cardBdr}`, color:textSub, fontSize:14, fontWeight:500, cursor:'pointer' }}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')} style={{ padding:'8px 20px', borderRadius:10, background:accent, border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:`0 0 20px ${accent}44` }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', padding:'100px 5% 80px', textAlign:'center', overflow:'hidden', minHeight:'90vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <ParticleField dark={dark} />
        <div style={{ position:'absolute', top:'15%', left:'10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,197,94,0.07),transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'10%', right:'8%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.06),transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1 }}>


          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(44px,8vw,88px)', fontWeight:900, lineHeight:1.02, marginBottom:24, color:textMain }}>
            Raise Your Voice.<br/>
            <span style={{ background:'linear-gradient(135deg,#4ade80,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Fix Your City.
            </span>
          </h1>

          <p style={{ fontSize:18, color:textSub, maxWidth:580, margin:'0 auto 44px', lineHeight:1.75 }}>
            AI-powered civic grievance platform — report urban issues, track resolutions in real time,
            and hold local authorities publicly accountable.
          </p>

          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:64 }}>
            <button onClick={() => navigate('/register')}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'15px 32px', background:accent, border:'none', borderRadius:12, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:`0 0 32px ${accent}55`, transition:'transform .15s,box-shadow .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 0 44px ${accent}77`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 0 32px ${accent}55`}}>
              Report an Issue <ArrowRight size={16}/>
            </button>
            <button onClick={() => navigate('/login')}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'15px 28px', background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:12, color:textMain, fontWeight:600, fontSize:15, cursor:'pointer', transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              Explore Dashboard <BarChart3 size={16}/>
            </button>
          </div>

          {/* Animated stats */}
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            {STATS.map(s => (
              <TiltCard key={s.label} style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:14, padding:'20px 28px', textAlign:'center', minWidth:140 }}>
                <p style={{ fontSize:26, fontWeight:800, fontFamily:'Outfit,sans-serif', color:s.color, marginBottom:4 }}>{s.val}</p>
                <p style={{ fontSize:12, color:textSub }}>{s.label}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding:'80px 5%', background:bg2 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <p style={{ fontSize:11, fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>The Problem</p>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,4vw,42px)', fontWeight:800, color:textMain, marginBottom:14 }}>Urban problems go unheard for too long</h2>
              <p style={{ fontSize:15, color:textSub, maxWidth:520, margin:'0 auto' }}>Citizens report through calls and emails — only to never hear back. Accountability is missing at every step.</p>
            </div>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:18 }}>
            {[
              {stat:'67%',  label:'Of complaints go unresolved beyond 30 days',         color:'#ef4444'},
              {stat:'14d',  label:'Average before authority acknowledges an issue',      color:'#facc15'},
              {stat:'3/5',  label:'Citizens don\'t know the right portal to use',        color:'#fb923c'},
              {stat:'0',    label:'Public visibility into authority performance today',  color:'#a855f7'},
            ].map((p,i) => (
              <Reveal key={p.label} delay={i*80}>
                <TiltCard style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:14, padding:28 }}>
                  <p style={{ fontSize:40, fontWeight:900, fontFamily:'Outfit,sans-serif', color:p.color, marginBottom:8 }}>{p.stat}</p>
                  <p style={{ fontSize:13, color:textSub, lineHeight:1.6 }}>{p.label}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'80px 5%' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <p style={{ fontSize:11, fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>How It Works</p>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,4vw,42px)', fontWeight:800, color:textMain }}>Three steps to accountability</h2>
            </div>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:22 }}>
            {STEPS.map((step,i) => (
              <Reveal key={step.num} delay={i*100}>
                <TiltCard style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:16, padding:32, height:'100%' }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:`${accent}15`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                    <step.icon size={21} color={accent}/>
                  </div>
                  <p style={{ fontSize:10, fontWeight:700, color:accent, letterSpacing:'0.1em', marginBottom:8 }}>STEP {step.num}</p>
                  <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:17, fontWeight:700, color:textMain, marginBottom:10 }}>{step.title}</h3>
                  <p style={{ fontSize:13, color:textSub, lineHeight:1.7 }}>{step.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:'80px 5%', background:bg2 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <p style={{ fontSize:11, fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Platform Capabilities</p>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,4vw,42px)', fontWeight:800, color:textMain }}>Built different from day one</h2>
            </div>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:18 }}>
            {FEATURES.map((f,i) => (
              <Reveal key={f.title} delay={i*60}>
                <TiltCard style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:14, padding:28 }}>
                  <div style={{ width:42, height:42, borderRadius:11, background:`${f.color}15`, border:`1px solid ${f.color}25`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <f.icon size={19} color={f.color}/>
                  </div>
                  <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:textMain, marginBottom:7 }}>{f.title}</h3>
                  <p style={{ fontSize:13, color:textSub, lineHeight:1.7 }}>{f.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section style={{ padding:'80px 5%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:52, alignItems:'center' }}>
          <Reveal>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>Three-Role System</p>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(24px,3.5vw,38px)', fontWeight:800, color:textMain, marginBottom:16 }}>A dashboard for every role</h2>
              <p style={{ fontSize:15, color:textSub, lineHeight:1.75, marginBottom:28 }}>Citizens, Authorities, and Admins each get a completely separate, role-specific interface — purpose-built for their exact needs.</p>
              {[
                {label:'Citizen', desc:'Track your reports, upvote issues, timeline progress', color:'#22c55e'},
                {label:'Authority', desc:'AI brief, ward queue, SLA tracking, one-click resolution', color:'#a855f7'},
                {label:'Admin', desc:'City-wide command center, area neglect alerts, authority rankings', color:'#38bdf8'},
              ].map(item => (
                <div key={item.label} style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:item.color, marginTop:6, flexShrink:0 }}/>
                  <div>
                    <p style={{ fontWeight:700, fontSize:14, color:textMain }}>{item.label} Dashboard</p>
                    <p style={{ fontSize:12, color:textSub }}>{item.desc}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/register')} style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', background:accent, border:'none', borderRadius:12, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                Try it now <ArrowRight size={14}/>
              </button>
            </div>
          </Reveal>

          {/* Mock UI card */}
          <Reveal delay={100}>
            <TiltCard style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:18, padding:24, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:18 }}>
                {['#ef4444','#facc15','#22c55e'].map(c=><div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}
                <span style={{ fontSize:11, color:textSub, marginLeft:6, fontFamily:'monospace' }}>authority-panel · Patia Ward</span>
              </div>
              {/* AI Brief bar */}
              <div style={{ background:dark?'rgba(168,85,247,0.1)':'rgba(168,85,247,0.07)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', gap:8, alignItems:'flex-start' }}>
                <Cpu size={13} color="#a855f7" style={{marginTop:2,flexShrink:0}}/>
                <p style={{ fontSize:11, color:textSub, lineHeight:1.5 }}>
                  <span style={{color:'#a855f7',fontWeight:600}}>AI Brief:</span> Patia has 3 critical road issues and 1 ongoing water supply complaint. Recommend prioritising ID #47 — 28 upvotes, 3 days old.
                </p>
              </div>
              {/* Stats row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                {[{n:14,l:'New',c:'#ef4444'},{n:6,l:'Active',c:'#facc15'},{n:89,l:'Done',c:'#22c55e'},{n:'94%',l:'Rate',c:'#22d3ee'}].map(s=>(
                  <div key={s.l} style={{ background:dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', borderRadius:9, padding:'10px 8px', textAlign:'center' }}>
                    <p style={{ fontSize:18, fontWeight:800, color:s.c, fontFamily:'Outfit,sans-serif' }}>{s.n}</p>
                    <p style={{ fontSize:10, color:textSub, marginTop:1 }}>{s.l}</p>
                  </div>
                ))}
              </div>
              {/* Issue rows */}
              {[
                {t:'Pothole cluster — NH-16',  s:'reported',    p:82},
                {t:'Water pipe burst',          s:'in_progress', p:71},
                {t:'Street light fault — C4',  s:'resolved',    p:38},
              ].map(({t,s,p})=>(
                <div key={t} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:`1px solid ${cardBdr}` }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background:s==='reported'?'#ef4444':s==='in_progress'?'#facc15':'#22c55e' }}/>
                  <p style={{ fontSize:12, color:textMain, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t}</p>
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:999, background:s==='reported'?'rgba(239,68,68,0.12)':s==='in_progress'?'rgba(250,204,21,0.12)':'rgba(34,197,94,0.12)', color:s==='reported'?'#ef4444':s==='in_progress'?'#facc15':'#22c55e', flexShrink:0 }}>
                    {s.replace('_',' ')}
                  </span>
                  <span style={{ fontSize:10, color:'#a855f7', flexShrink:0, fontWeight:600 }}>{p}</span>
                </div>
              ))}
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding:'80px 5%', background:bg2 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <p style={{ fontSize:11, fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Community Voice</p>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,4vw,42px)', fontWeight:800, color:textMain }}>Heard from the ground</h2>
            </div>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:18 }}>
            {TESTIMONIALS.map((t,i) => (
              <Reveal key={t.name} delay={i*80}>
                <TiltCard style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:14, padding:28 }}>
                  <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                    {Array(5).fill(0).map((_,i)=><Star key={i} size={13} fill="#facc15" color="#facc15"/>)}
                  </div>
                  <p style={{ fontSize:13, color:textSub, lineHeight:1.75, marginBottom:20, fontStyle:'italic' }}>"{t.text}"</p>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${accent},#22d3ee)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#0f172a' }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight:600, fontSize:13, color:textMain }}>{t.name}</p>
                      <p style={{ fontSize:11, color:textSub }}>{t.role}</p>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOVT PORTALS ── */}
      <section style={{ padding:'80px 5%' }}>
        <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
          <Reveal>
            <p style={{ fontSize:11, fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Official Ecosystem</p>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(24px,3.5vw,36px)', fontWeight:800, color:textMain, marginBottom:12 }}>Part of Odisha's civic infrastructure</h2>
            <p style={{ fontSize:14, color:textSub, marginBottom:40 }}>UrbanVoice complements — not replaces — the official government portals.</p>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14 }}>
            {PORTALS.map((p,i) => (
              <Reveal key={p.name} delay={i*60}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                  <TiltCard style={{ background:cardBg, border:`1px solid ${cardBdr}`, borderRadius:14, padding:22, textAlign:'center', cursor:'pointer' }}>
                    <Lock size={15} color={accent} style={{ marginBottom:8 }}/>
                    <p style={{ fontWeight:700, fontSize:14, color:textMain, marginBottom:4 }}>{p.name}</p>
                    <p style={{ fontSize:11, color:textSub }}>{p.desc}</p>
                  </TiltCard>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'80px 5%', background:bg2 }}>
        <Reveal>
          <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center', background: dark ? 'linear-gradient(135deg,rgba(34,197,94,0.09),rgba(168,85,247,0.06))' : 'linear-gradient(135deg,rgba(22,163,74,0.06),rgba(168,85,247,0.04))', border:`1px solid ${cardBdr}`, borderRadius:24, padding:'64px 40px' }}>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:textMain, marginBottom:16 }}>Be part of a smarter city</h2>
            <p style={{ fontSize:15, color:textSub, marginBottom:36, lineHeight:1.75 }}>
              Join thousands of Bhubaneswar citizens already making their neighbourhoods better — one report at a time.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={() => navigate('/register')}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 30px', background:accent, border:'none', borderRadius:12, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:`0 0 28px ${accent}44` }}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                Create Free Account <ArrowRight size={16}/>
              </button>
              <button onClick={() => navigate('/login')}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 24px', background:'transparent', border:`1px solid ${cardBdr}`, borderRadius:12, color:textMain, fontWeight:600, fontSize:15, cursor:'pointer' }}>
                Sign In
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:`1px solid ${cardBdr}`, padding:'52px 5% 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:40, marginBottom:48 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#22c55e,#22d3ee)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Zap size={15} color="#0f172a"/>
                </div>
                <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:17, color:textMain }}>UrbanVoice</span>
              </div>
              <p style={{ fontSize:13, color:textSub, lineHeight:1.75, maxWidth:300 }}>
                AI-powered smart city grievance platform — making Bhubaneswar more transparent, responsive, and citizen-driven.
              </p>
              <div style={{ display:'flex', gap:8, marginTop:16 }}>
                {['React 18','FastAPI','PostgreSQL','Groq AI','WebSockets'].map(t => (
                  <span key={t} style={{ fontSize:10, padding:'3px 8px', background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)', border:`1px solid ${cardBdr}`, borderRadius:6, color:textSub }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:13, color:textMain, marginBottom:14 }}>Platform</p>
              {['Report Issue','City Map','Dashboard','Authority Panel','Admin Center'].map(l => (
                <p key={l} onClick={() => navigate('/login')} style={{ fontSize:13, color:textSub, marginBottom:9, cursor:'pointer' }}>{l}</p>
              ))}
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:13, color:textMain, marginBottom:14 }}>Official Portals</p>
              {PORTALS.map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{ display:'block', fontSize:13, color:textSub, marginBottom:9, textDecoration:'none' }}>{p.name}</a>
              ))}
            </div>
          </div>

          {/* Team — 3D orbiting */}
          <div style={{ borderTop:`1px solid ${cardBdr}`, paddingTop:48 }}>
            <TeamOrbit dark={dark}/>
          </div>
        </div>
      </footer>
    </div>
  )
}
