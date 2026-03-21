import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  LayoutDashboard, Map, PlusCircle, Bell, Shield, Settings,
  LogOut, Menu, X, ChevronRight, Sun, Moon, CheckCheck,
  AlertCircle, Clock, CheckCircle, Info, User, FileText, ChevronDown
} from 'lucide-react'

// Notification icon based on message content
function NotifIcon({ message }) {
  const m = message.toLowerCase()
  if (m.includes('resolved'))    return <CheckCircle size={13} color="#22c55e" style={{flexShrink:0}}/>
  if (m.includes('in progress')) return <Clock size={13} color="#facc15" style={{flexShrink:0}}/>
  if (m.includes('new issue') || m.includes('near you')) return <AlertCircle size={13} color="#f97316" style={{flexShrink:0}}/>
  if (m.includes('rejected'))    return <X size={13} color="#ef4444" style={{flexShrink:0}}/>
  return <Info size={13} color="#94a3b8" style={{flexShrink:0}}/>
}

function formatNotifTime(d) {
  const date = new Date(d)
  const now  = Date.now()
  const diff = Math.floor((now - date.getTime()) / 1000) // seconds

  if (diff < 10)   return 'just now'
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) {
    const h = Math.floor(diff/3600)
    const m = Math.floor((diff % 3600)/60)
    return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`
  }
  // More than a day — show actual date + time
  return date.toLocaleString('en-IN', {
    day:'numeric', month:'short',
    hour:'2-digit', minute:'2-digit', hour12:true
  })
}

// Keep short alias for notification list
const timeAgo = formatNotifTime

export default function Layout() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [notifications,  setNotifications]  = useState([])
  const [showNotifs,     setShowNotifs]     = useState(false)
  const [showProfile,    setShowProfile]    = useState(false)
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  const fetchNotifs = () => {
    axios.get('/api/notifications/').then(r => setNotifications(r.data)).catch(() => {})
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 10000)  // poll every 10s
    return () => clearInterval(interval)
  }, [])

  // Close notif panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter(n => !n.is_read).length

  const markAllRead = async () => {
    await axios.post('/api/notifications/mark-all-read')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markOneRead = async (id) => {
    await axios.post(`/api/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/map',       icon: Map,             label: 'City Map'   },
    { to: '/report',    icon: PlusCircle,       label: 'Report Issue' },
    ...(user?.role === 'authority' || user?.role === 'admin'
      ? [{ to: '/authority', icon: Shield,   label: 'Authority Panel' }] : []),
    ...(user?.role === 'admin'
      ? [{ to: '/admin',     icon: Settings, label: 'Admin Panel' }] : []),
  ]

  const handleLogout = () => { logout(); navigate('/') }

  // Theme-aware colors
  const sidebarBg   = dark ? '#0f172a' : '#f0f7f0'
  const sidebarBdr  = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const topbarBg    = dark ? 'rgba(10,15,30,0.9)' : 'rgba(240,247,240,0.92)'
  const textColor   = dark ? '#f1f5f9' : '#0f172a'
  const subColor    = dark ? '#64748b' : '#64748b'

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 60,
        transition: 'width 0.25s ease',
        background: sidebarBg,
        borderRight: `1px solid ${sidebarBdr}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100%', zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding:'14px 14px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${sidebarBdr}` }}>
          <img src="/logo.svg" alt="UV" style={{ width:32, height:32, borderRadius:8, flexShrink:0 }}/>
          {sidebarOpen && (
            <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:16,
              background:'linear-gradient(135deg,#4ade80,#22d3ee)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              UrbanVoice
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 10,
              textDecoration: 'none',
              background: isActive ? 'rgba(34,197,94,0.12)' : 'transparent',
              color: isActive ? '#22c55e' : subColor,
              border: isActive ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
              transition: 'all 0.15s',
              fontSize: 13, fontWeight: 600,
            })}>
              <Icon size={17} style={{ flexShrink:0 }}/>
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && <ChevronRight size={12} style={{ marginLeft:'auto', opacity:0.4 }}/>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding:'10px 8px', borderTop:`1px solid ${sidebarBdr}` }}>
          {sidebarOpen && (
            <div style={{ padding:'6px 10px', marginBottom:4 }}>
              <p style={{ fontSize:12, fontWeight:700, color:textColor, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize:11, color:subColor, textTransform:'capitalize' }}>{user?.role}</p>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10,
            color: subColor, background:'none', border:'none', cursor:'pointer', width:'100%',
            fontSize:13, fontWeight:500, transition:'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color=subColor}>
            <LogOut size={16}/>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: sidebarOpen ? 240 : 60, flex:1, transition:'margin-left 0.25s ease', minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          position:'sticky', top:0, zIndex:10,
          background: topbarBg,
          backdropFilter:'blur(20px)',
          borderBottom: `1px solid ${sidebarBdr}`,
          padding:'0 20px', height:56,
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ padding:7, borderRadius:8, background:'transparent', border:'none', cursor:'pointer', color:subColor }}>
            {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Theme toggle */}
            <button onClick={toggle} style={{
              width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
              background:'var(--surface)', border:`1px solid ${sidebarBdr}`, cursor:'pointer', color:subColor,
            }}>
              {dark ? <Sun size={15}/> : <Moon size={15}/>}
            </button>

            {/* Notifications */}
            <div style={{ position:'relative' }} ref={notifRef}>
              <button onClick={() => { setShowNotifs(v => !v); fetchNotifs() }} style={{
                width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
                background:'var(--surface)', border:`1px solid ${sidebarBdr}`, cursor:'pointer', color:subColor,
                position:'relative',
              }}>
                <Bell size={15}/>
                {unread > 0 && (
                  <span style={{
                    position:'absolute', top:5, right:5,
                    width:8, height:8, borderRadius:'50%',
                    background:'#22c55e', animation:'pulse 2s infinite',
                  }}/>
                )}
              </button>

              {showNotifs && (
                <div style={{
                  position:'absolute', right:0, top:42, width:340,
                  background: dark ? '#0f172a' : '#ffffff',
                  border:`1px solid ${dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.12)'}`,
                  borderRadius:14, boxShadow:'0 16px 48px rgba(0,0,0,0.25)',
                  zIndex:9999, overflow:'hidden',
                }} className="animate-slide-up">
                  {/* Header */}
                  <div style={{
                    padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
                    borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div>
                        <span style={{ fontSize:14, fontWeight:700, color:textColor }}>Notifications</span>
                        <p style={{ fontSize:10, color:dark?'#475569':'#94a3b8', marginTop:1 }}>{new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})}</p>
                      </div>
                      {unread > 0 && (
                        <span style={{ fontSize:11, padding:'2px 7px', borderRadius:999, background:'rgba(34,197,94,0.15)', color:'#22c55e', fontWeight:700 }}>
                          {unread} new
                        </span>
                      )}
                    </div>
                    {unread > 0 && (
                      <button onClick={markAllRead} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#22c55e', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                        <CheckCheck size={12}/> Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding:'28px 16px', textAlign:'center' }}>
                        <Bell size={24} color={dark?'#334155':'#cbd5e1'} style={{ margin:'0 auto 8px' }}/>
                        <p style={{ fontSize:13, color:dark?'#475569':'#94a3b8' }}>No notifications yet</p>
                      </div>
                    ) : notifications.slice(0, 15).map(n => (
                      <div key={n.id}
                        onClick={() => { markOneRead(n.id); if(n.issue_id) navigate(`/issues/${n.issue_id}`) }}
                        style={{
                          padding:'11px 16px',
                          borderBottom:`1px solid ${dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'}`,
                          background: !n.is_read ? (dark?'rgba(34,197,94,0.05)':'rgba(34,197,94,0.04)') : 'transparent',
                          cursor: n.issue_id ? 'pointer' : 'default',
                          display:'flex', gap:10, alignItems:'flex-start',
                          transition:'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background=dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background=!n.is_read?(dark?'rgba(34,197,94,0.05)':'rgba(34,197,94,0.04)'):'transparent'}>
                        <div style={{ marginTop:1 }}><NotifIcon message={n.message}/></div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12, color:textColor, lineHeight:1.5 }}>{n.message}</p>
                          <p style={{ fontSize:10, color:dark?'#475569':'#94a3b8', marginTop:3 }}>{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.is_read && <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', flexShrink:0, marginTop:4 }}/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + Profile dropdown */}
            <div style={{ position:'relative' }} ref={profileRef}>
              <button
                onClick={() => setShowProfile(v => !v)}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'none', border:'none', cursor:'pointer', padding:0,
                }}>
                <div style={{
                  width:34, height:34, borderRadius:'50%',
                  background:'linear-gradient(135deg,#22c55e,#22d3ee)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#0f172a', fontWeight:800, fontSize:14,
                  boxShadow: showProfile ? '0 0 0 3px rgba(34,197,94,0.35)' : 'none',
                  transition:'box-shadow .2s',
                }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              </button>

              {showProfile && (
                <div style={{
                  position:'absolute', right:0, top:42, width:220,
                  background: dark ? '#0f172a' : '#ffffff',
                  border:`1px solid ${dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.12)'}`,
                  borderRadius:14, boxShadow:'0 16px 48px rgba(0,0,0,0.3)',
                  zIndex:9999, overflow:'hidden',
                }} className="animate-slide-up">

                  {/* Profile header */}
                  <div style={{
                    padding:'14px 16px',
                    borderBottom:`1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`,
                    background: dark ? 'rgba(34,197,94,0.05)' : 'rgba(34,197,94,0.04)',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:40, height:40, borderRadius:'50%',
                        background:'linear-gradient(135deg,#22c55e,#22d3ee)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontWeight:800, fontSize:17, color:'#0f172a', flexShrink:0,
                      }}>
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontWeight:700, fontSize:13, color:textColor, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
                        <p style={{ fontSize:11, color:subColor, textTransform:'capitalize' }}>{user?.role} · {user?.area || 'All areas'}</p>
                        <p style={{ fontSize:10, color:subColor, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding:'6px 0' }}>
                    {[
                      { icon:User,      label:'My Profile',      action:() => { setShowProfile(false) } },
                      { icon:FileText,  label:'My Issues',        action:() => { navigate('/dashboard'); setShowProfile(false) } },
                      { icon:Map,       label:'City Map',         action:() => { navigate('/map'); setShowProfile(false) } },
                      { icon:Bell,      label:'Notifications',    action:() => { setShowProfile(false); setShowNotifs(true) } },
                      ...(user?.role==='authority'||user?.role==='admin' ? [{ icon:Shield, label:'Authority Panel', action:()=>{ navigate('/authority'); setShowProfile(false) } }] : []),
                      ...(user?.role==='admin' ? [{ icon:Settings, label:'Admin Center', action:()=>{ navigate('/admin'); setShowProfile(false) } }] : []),
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        style={{
                          display:'flex', alignItems:'center', gap:10,
                          width:'100%', padding:'9px 16px', background:'none', border:'none',
                          cursor:'pointer', color:textColor, fontSize:13, fontWeight:500,
                          transition:'background .15s', textAlign:'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background=dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background='none'}>
                        <item.icon size={14} color={subColor}/>
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  <div style={{ borderTop:`1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)'}`, padding:'6px 0' }}>
                    <button onClick={() => { handleLogout(); setShowProfile(false) }}
                      style={{
                        display:'flex', alignItems:'center', gap:10,
                        width:'100%', padding:'9px 16px', background:'none', border:'none',
                        cursor:'pointer', color:'#ef4444', fontSize:13, fontWeight:600, textAlign:'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>
                      <LogOut size={14}/>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding:24 }} className="animate-fade-in">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}
