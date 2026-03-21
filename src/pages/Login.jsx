import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, Eye, EyeOff, User, Shield, Settings } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { label:'Citizen',   email:'citizen@demo.com',   password:'demo1234', icon:User,     color:'#22c55e', desc:'Reports issues, tracks status' },
  { label:'Authority', email:'auth1@demo.com',      password:'demo1234', icon:Shield,   color:'#a855f7', desc:'Patia ward officer'            },
  { label:'Admin',     email:'admin@demo.com',       password:'demo1234', icon:Settings, color:'#38bdf8', desc:'City-wide oversight'           },
]

export default function Login() {
  const [form,     setForm]     = useState({ email:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  const quickLogin = (acc) => {
    setForm({ email: acc.email, password: acc.password })
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'20%', left:'20%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,197,94,0.06),transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'20%', right:'20%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.05),transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420 }} className="animate-slide-up">
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:16 }}>
            <img src="/logo.svg" alt="UrbanVoice" style={{width:38,height:38,borderRadius:11}} />
            <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:20, background:'linear-gradient(135deg,#4ade80,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>UrbanVoice</span>
          </Link>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Sign in to your account</p>
        </div>

        {/* Quick login shortcuts */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginBottom:16 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
            Quick Demo Login
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.label} onClick={() => quickLogin(acc)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                  background: form.email === acc.email ? `${acc.color}15` : 'rgba(255,255,255,0.03)',
                  border:`1px solid ${form.email === acc.email ? acc.color+'44' : 'var(--border)'}`,
                  borderRadius:10, cursor:'pointer', transition:'all .15s', textAlign:'left',
                  width:'100%',
                }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${acc.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <acc.icon size={15} color={acc.color}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:1 }}>{acc.label}</p>
                  <p style={{ fontSize:11, color:'var(--text3)' }}>{acc.desc}</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'monospace' }}>{acc.email}</p>
                  <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'monospace' }}>demo1234</p>
                </div>
              </button>
            ))}
          </div>
          <p style={{ fontSize:11, color:'var(--text3)', marginTop:10, textAlign:'center' }}>
            Click any role above to auto-fill credentials, then hit Sign In
          </p>
        </div>

        {/* Login form */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:7 }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }}/>
                <input type="email" required value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})}
                  placeholder="you@example.com"
                  className="uv-input" style={{ paddingLeft:38 }}
                />
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:7 }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }}/>
                <input type={showPass?'text':'password'} required value={form.password}
                  onChange={e => setForm({...form, password:e.target.value})}
                  placeholder="••••••••"
                  className="uv-input" style={{ paddingLeft:38, paddingRight:42 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:0 }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'13px', background:'var(--accent,#22c55e)', border:'none',
                borderRadius:12, color:'#fff', fontWeight:700, fontSize:15, cursor: loading?'not-allowed':'pointer',
                opacity: loading ? 0.6 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:'0 0 24px var(--glow)',
              }}>
              {loading
                ? <div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                : 'Sign In'
              }
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text2)', marginTop:16 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--accent,#22c55e)', fontWeight:600, textDecoration:'none' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
