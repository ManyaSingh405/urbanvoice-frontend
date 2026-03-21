import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, User, Mail, Lock, MapPin, Shield } from 'lucide-react'

const AREAS = ['Patia', 'Saheed Nagar', 'Nayapalli', 'Chandrasekharpur', 'Bhubaneswar Old Town', 'Khandagiri', 'Mancheswar', 'Rasulgarh', 'Jaydev Vihar', 'Bomikhal', 'Unit-9', 'Master Canteen', 'Tamando', 'Infocity', 'Aiginia']

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen', area: 'Patia' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Welcome to UrbanVoice, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center">
              <Zap size={20} className="text-slate-900" />
            </div>
            <span className="font-display font-bold text-2xl text-gradient">UrbanVoice</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Join UrbanVoice</h1>
          <p className="text-slate-500 mt-2 font-body">Make your city better, together</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 font-medium mb-2 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 font-medium mb-2 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 transition-all text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-400 font-medium mb-2 block">Role</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-green-500/50 transition-all text-sm appearance-none">
                    <option value="citizen" className="bg-slate-900">Citizen</option>
                    <option value="authority" className="bg-slate-900">Authority</option>
                    <option value="admin" className="bg-slate-900">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 font-medium mb-2 block">Area</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-green-500/50 transition-all text-sm appearance-none">
                    {AREAS.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-slate-900 font-semibold rounded-xl transition-all glow-green flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
