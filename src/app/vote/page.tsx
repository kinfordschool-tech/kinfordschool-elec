'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import KinfordLogo from '@/components/KinfordLogo';

export default function VoteAccess() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear any errors when the user types
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    // Normalize to uppercase and strip whitespaces
    setAccessCode(e.target.value.toUpperCase().replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Please enter your access code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vote/access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid access code. Please try again.');
        setLoading(false);
      } else {
        // Redirect to ballot page if valid
        router.push('/vote/ballot');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please check the network and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#A22538]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#EEB540]/5 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-900/60 bg-slate-950/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <KinfordLogo size={40} showText={true} />
          <span className="text-[10px] font-bold text-[#EEB540] tracking-widest uppercase bg-[#EEB540]/5 px-3 py-1 rounded-full border border-[#EEB540]/10">
            Voting Terminal
          </span>
        </div>
      </header>

      {/* Center Card */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-md w-full glass-panel rounded-3xl p-10 border-slate-800 shadow-2xl relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Voter Identification</h2>
            <p className="text-sm text-slate-400">
              Enter your unique access code below to verify your ballot.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                maxLength={12}
                value={accessCode}
                onChange={handleCodeChange}
                placeholder="KF-XXXXX"
                disabled={loading}
                className="w-full text-center px-4 py-4 rounded-xl border border-slate-800 bg-slate-900/60 text-white placeholder-slate-700 font-mono text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#EEB540] focus:border-transparent transition-all uppercase"
                autoComplete="off"
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
              disabled={loading || !accessCode.trim()}
              className="w-full py-4 rounded-xl font-bold text-white bg-[#A22538] hover:bg-[#8A1B2C] active:scale-[0.98] transition-all text-base tracking-wide flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-[#A22538]/15 border border-[#A22538]/10 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 py-6 text-center text-xs text-slate-600 relative z-10">
        <p>© 2026 Kinford School of Guidance. All rights reserved.</p>
      </footer>
    </div>
  );
}
