import Link from 'next/link';
import KinfordLogo from '@/components/KinfordLogo';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#A22538]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#EEB540]/5 blur-[120px] pointer-events-none" />

      {/* Top Navbar: Brand logo with wordmark */}
      <header className="border-b border-slate-900/60 bg-slate-950/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <KinfordLogo size={40} showText={true} />
          <span className="text-[10px] font-bold text-[#EEB540] tracking-widest uppercase bg-[#EEB540]/5 px-3 py-1 rounded-full border border-[#EEB540]/10">
            Voting Terminal
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-2xl w-full text-center glass-panel rounded-3xl p-12 md:p-16 border-slate-800 shadow-2xl relative">
          {/* Brand gold badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EEB540]/10 text-[#EEB540] border border-[#EEB540]/20 mb-8 uppercase tracking-widest">
            Kinford School of Guidance
          </span>

          <div className="flex justify-center mb-8">
            <div className="p-5 rounded-full bg-slate-950/50 border border-slate-900 shadow-inner">
              <KinfordLogo size={80} showText={false} />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-none mb-6">
            School Council <span className="bg-gradient-to-r from-[#EEB540] to-[#A22538] bg-clip-text text-transparent">Election 2026</span>
          </h2>
          
          <p className="text-base md:text-lg text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Welcome to the Kinford School digital voting terminal. Please have your unique 6-character access code ready to cast your vote.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vote"
              className="px-8 py-4 rounded-xl font-bold bg-[#A22538] hover:bg-[#8A1B2C] text-white shadow-lg shadow-[#A22538]/15 active:scale-[0.98] transition-all text-lg tracking-wide border border-[#A22538]/10 cursor-pointer"
            >
              Start Election Voting
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 py-6 text-center text-xs text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Kinford School of Guidance. All rights reserved.</p>
          <p className="font-semibold text-slate-500">Secure, anonymous voting session</p>
        </div>
      </footer>
    </div>
  );
}
