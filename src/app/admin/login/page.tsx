'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import KinfordLogo from '@/components/KinfordLogo';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect password. Please try again.');
        setLoading(false);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please check connectivity.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-slate-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-950/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-4">
          <KinfordLogo size={42} />
          <div>
            <h1 className="font-semibold text-slate-100 tracking-wide text-lg">KINFORD SCHOOL</h1>
            <p className="text-xs text-amber-500 font-medium tracking-wider uppercase">System Administration</p>
          </div>
        </div>
      </header>

      {/* Main card */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-md w-full glass-panel rounded-3xl p-10 border-slate-800 shadow-2xl relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Admin Portal</h2>
            <p className="text-sm text-slate-400">
              Enter the administration password to configure the election.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setError('');
                  setPassword(e.target.value);
                }}
                placeholder="••••••••••••"
                disabled={loading}
                className="w-full text-center px-4 py-4 rounded-xl border border-slate-800 bg-slate-900/60 text-white placeholder-slate-700 tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-4 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all text-base tracking-wide flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-amber-500/15"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                'Authenticate'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 py-6 text-center text-xs text-slate-600 relative z-10">
        <p>© 2026 Kinford School. All rights reserved.</p>
      </footer>
    </div>
  );
}
