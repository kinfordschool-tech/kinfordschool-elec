import Link from 'next/link';
import KinfordLogo from '@/components/KinfordLogo';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />

      {/* Top Navbar: Crest + Name ONLY (no admin links) */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-4">
          <KinfordLogo size={42} />
          <div>
            <h1 className="font-semibold text-slate-100 tracking-wide text-lg">KINFORD SCHOOL</h1>
            <p className="text-xs text-amber-500 font-medium tracking-wider uppercase">Official Voting Terminal</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-2xl w-full text-center glass-panel rounded-3xl p-12 md:p-16 border-slate-800 shadow-2xl relative">
          {/* Subtle gold badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-8 uppercase tracking-widest">
            Kinford Election System 2026
          </span>

          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-full bg-slate-900/50 border border-slate-800 shadow-inner">
              <KinfordLogo size={80} />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-none mb-6">
            School Council <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">Election 2026</span>
          </h2>
          
          <p className="text-base md:text-lg text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Welcome to the Kinford School digital voting terminal. Please have your unique 6-character access code ready to cast your vote.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vote"
              className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all text-lg tracking-wide"
            >
              Start Election Voting
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 py-6 text-center text-xs text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Kinford School. All rights reserved.</p>
          <p className="font-medium">Secure, anonymous voting session</p>
        </div>
      </footer>
    </div>
  );
}
