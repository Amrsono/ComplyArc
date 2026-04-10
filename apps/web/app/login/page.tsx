'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, User, Building2, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await api.register(email, password, fullName, organization || undefined);
      }
      await api.login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-in">
          <div style={{
            width: 64, height: 64, borderRadius: '16px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em',
            boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
          }}>
            CA
          </div>
          <h1 style={{
            fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ComplyArc
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            AI-Native AML & Risk Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card animate-in animate-in-delay-1" style={{ padding: '32px' }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: '28px', padding: '4px',
            background: 'var(--bg-elevated)', borderRadius: '10px',
          }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: mode === m ? 'var(--accent-primary)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text-secondary)',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label><User size={13} style={{ display: 'inline', marginRight: '6px' }} />Full Name</label>
                  <input
                    className="input" placeholder="Jane Doe"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label><Building2 size={13} style={{ display: 'inline', marginRight: '6px' }} />Organization</label>
                  <input
                    className="input" placeholder="Your company (optional)"
                    value={organization} onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label><Mail size={13} style={{ display: 'inline', marginRight: '6px' }} />Email</label>
              <input
                className="input" type="email" placeholder="you@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
              />
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label><Lock size={13} style={{ display: 'inline', marginRight: '6px' }} />Password</label>
              <input
                className="input" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444', fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', height: '46px', fontSize: '14px', fontWeight: 600 }}
            >
              {loading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: '24px', fontSize: '11px',
          color: 'var(--text-tertiary)',
        }} className="animate-in animate-in-delay-2">
          <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Enterprise-grade AML compliance · SOC 2 · GDPR
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
