import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-light), #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>⚡ ProjectFlow</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Sign in to your workspace</p>
        </div>

        <div className="card" style={{ border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-glow)' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ justifyContent: 'center', marginTop: 8, padding: '13px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-light)', fontWeight: 500 }}>Create one</Link>
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Demo credentials</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Admin: admin@demo.com / demo123</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>PM: pm@demo.com / demo123</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Member: member@demo.com / demo123</div>
        </div>
      </div>
    </div>
  );
}
