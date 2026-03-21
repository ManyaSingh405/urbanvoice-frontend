import { useEffect, useRef, useState } from 'react'

const TEAM = [
  { name:'Manya Singh',      roll:'2330311' },
  { name:'Ansh Raj',         roll:'2330289' },
  { name:'Preetush Bhowmik', roll:'2330175' },
  { name:'Labani Sen',       roll:'2330309' },
  { name:'Ananya Roy',       roll:'2330140' },
]

const AVATAR_COLORS = [
  ['#22c55e','#22d3ee'],
  ['#a855f7','#38bdf8'],
  ['#fb923c','#facc15'],
  ['#f43f5e','#55f786'],
  ['#22d3ee','#22c55e'],
]

// ── 3D Globe — only moves when mouse is over it ───────────────────────────────
function UV3DGlobe({ dark }) {
  const canvasRef = useRef(null)
  const rot    = useRef({ x: 0.3, y: 0 })
  const vel    = useRef({ x: 0,   y: 0 })
  const active = useRef(false)   // only animates when hovered
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 300, H = 300
    canvas.width = W; canvas.height = H

    const LETTERS = 'URBANVOICE'.split('')
    const pts = LETTERS.map((ch, i) => {
      const phi   = Math.acos(1 - 2*(i+0.5)/LETTERS.length)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      return { ch,
        ox: Math.sin(phi)*Math.cos(theta),
        oy: Math.cos(phi),
        oz: Math.sin(phi)*Math.sin(theta),
      }
    })

    // Only meridian dots — no orbit ring dots
    const gridPts = []
    for (let lat = -75; lat <= 75; lat += 25) {
      for (let lng = 0; lng < 360; lng += 10) {
        const phi   = (90-lat) * Math.PI/180
        const theta = lng * Math.PI/180
        gridPts.push({ ox:Math.sin(phi)*Math.cos(theta), oy:Math.cos(phi), oz:Math.sin(phi)*Math.sin(theta) })
      }
    }

    const rotate3D = ({ ox, oy, oz }, rx, ry) => {
      const y1 = oy*Math.cos(rx) - oz*Math.sin(rx)
      const z1 = oy*Math.sin(rx) + oz*Math.cos(rx)
      const x2 = ox*Math.cos(ry) + z1*Math.sin(ry)
      return { x:x2, y:y1, z:-ox*Math.sin(ry)+z1*Math.cos(ry) }
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const cx = W/2, cy = H/2, R = 105

      // Damp velocity — stop spinning when mouse leaves
      vel.current.x *= 0.92
      vel.current.y *= 0.92
      rot.current.x += vel.current.x
      rot.current.y += vel.current.y

      const { x:rx, y:ry } = rot.current

      // Grid dots (faint)
      gridPts.forEach(pt => {
        const r = rotate3D(pt, rx, ry)
        if (r.z < 0) return
        const alpha = r.z * 0.18
        ctx.beginPath()
        ctx.arc(cx + r.x*R, cy + r.y*R, 1.2, 0, Math.PI*2)
        ctx.fillStyle = dark ? `rgba(74,222,128,${alpha})` : `rgba(22,163,74,${alpha})`
        ctx.fill()
      })

      // Letters sorted back-to-front
      pts.map(p => ({ ...p, ...rotate3D(p, rx, ry) }))
        .sort((a, b) => a.z - b.z)
        .forEach(pt => {
          const sx    = cx + pt.x * R
          const sy    = cy + pt.y * R
          const depth = (pt.z + 1) / 2
          const size  = 10 + depth * 9
          const alpha = 0.25 + depth * 0.75

          if (pt.z > 0) {
            const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 20)
            g.addColorStop(0, dark ? `rgba(34,197,94,${alpha*0.3})` : `rgba(22,163,74,${alpha*0.18})`)
            g.addColorStop(1, 'transparent')
            ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI*2)
            ctx.fillStyle = g; ctx.fill()
          }

          ctx.font = `700 ${size.toFixed(1)}px 'Outfit',sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillStyle = dark
            ? `rgba(${pt.z>0?'74,222,128':'147,197,164'},${alpha})`
            : `rgba(${pt.z>0?'22,163,74':'110,170,100'},${alpha})`
          ctx.fillText(pt.ch, sx, sy)
        })

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const dx = (e.clientX - rect.left  - W/2) / W
      const dy = (e.clientY - rect.top   - H/2) / H
      // Only respond to mouse — no auto-spin at all
      vel.current.x = dy * 0.07
      vel.current.y = dx * 0.07
    }

    canvas.addEventListener('mousemove', onMove)
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener('mousemove', onMove) }
  }, [dark])

  return (
    <canvas ref={canvasRef} style={{
      cursor: 'grab',
      filter: dark ? 'drop-shadow(0 0 16px rgba(34,197,94,0.3))' : 'drop-shadow(0 0 12px rgba(22,163,74,0.18))',
    }}/>
  )
}

// ── Static team cards at fixed positions ──────────────────────────────────────
function TeamCards({ dark }) {
  const [hovered, setHovered] = useState(null)
  const textMain = dark ? '#f1f5f9' : '#0f172a'
  const textSub  = dark ? '#94a3b8' : '#64748b'
  const cardBg   = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const cardBdr  = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)'

  // Fixed positions evenly spaced around a 230px radius circle
  const R  = 230
  const cx = 300, cy = 300

  return (
    <div style={{ position:'relative', width:600, height:600, flexShrink:0 }}>
      {/* NO orbit ring — removed completely */}

      {/* Globe center */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:2 }}>
        <UV3DGlobe dark={dark}/>
      </div>

      {/* Team cards at fixed positions */}
      {TEAM.map((m, i) => {
        const angle   = (i * 360 / TEAM.length - 90) * Math.PI / 180
        const x       = cx + R * Math.cos(angle) - 80   // -80 = half card width
        const y       = cy + R * Math.sin(angle) - 24   // -24 = half card height
        const [c1,c2] = AVATAR_COLORS[i]
        const isHov   = hovered === i

        return (
          <div key={m.roll}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position:'absolute', left:x, top:y,
              width:172,
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 14px', borderRadius:999,
              background: isHov ? (dark?'rgba(34,197,94,0.12)':'rgba(22,163,74,0.08)') : cardBg,
              border:`1px solid ${isHov ? (dark?'rgba(34,197,94,0.5)':'rgba(22,163,74,0.4)') : cardBdr}`,
              boxShadow: isHov ? `0 0 22px ${c1}55` : 'none',
              backdropFilter:'blur(14px)',
              transition:'all .2s ease',
              cursor:'default', zIndex:3,
              whiteSpace:'nowrap',
            }}>
            <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${c1},${c2})` }}/>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:textMain, lineHeight:1.2 }}>{m.name}</p>
              <p style={{ fontSize:10, color:textSub, marginTop:1 }}>{m.roll}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function TeamOrbit({ dark }) {
  const textSub = dark ? '#475569' : '#94a3b8'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'16px 0' }}>
      <p style={{ fontSize:11, fontWeight:700, color:textSub, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>
        Built by
      </p>
      <TeamCards dark={dark}/>
      <p style={{ fontSize:12, color:textSub, marginTop:4 }}>
        UrbanVoice · Web Application © 2026 · Bhubaneswar, Odisha
      </p>
    </div>
  )
}
