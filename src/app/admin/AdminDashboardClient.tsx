'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import KinfordLogo from '@/components/KinfordLogo';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Award,
  TrendingUp,
  Layers,
  UserPlus,
  Printer,
  LogOut,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  UserCheck
} from 'lucide-react';

interface Position {
  id: string;
  name: string;
  order_index: number;
}

interface Candidate {
  id: string;
  name: string;
  class: string;
  photo_url: string;
  manifesto: string;
  vote_count: number;
  position_id: string;
  position_name?: string;
}

interface Voter {
  id: string;
  name: string;
  class: string;
  access_code: string;
  has_voted: boolean;
}

interface GroupedResult {
  id: string;
  name: string;
  order_index: number;
  candidates: {
    id: string;
    name: string;
    class: string;
    photo_url: string;
    vote_count: number;
  }[];
}

interface TurnoutItem {
  name: string;
  class: string;
  has_voted: boolean;
}

interface Stats {
  totalVoters: number;
  votedCount: number;
  turnoutPercentage: number;
}

interface AdminDashboardClientProps {
  initialPositions: Position[];
  initialCandidates: Candidate[];
  initialVoters: Voter[];
  initialResults: GroupedResult[];
  initialTurnout: TurnoutItem[];
  initialStats: Stats;
}

export default function AdminDashboardClient({
  initialPositions,
  initialCandidates,
  initialVoters,
  initialResults,
  initialTurnout,
  initialStats,
}: AdminDashboardClientProps) {
  const router = useRouter();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'positions' | 'candidates' | 'voters' | 'results' | 'turnout'>('results');

  // Database lists
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [voters, setVoters] = useState<Voter[]>(initialVoters);
  const [results, setResults] = useState<GroupedResult[]>(initialResults);
  const [turnout, setTurnout] = useState<TurnoutItem[]>(initialTurnout);
  const [stats, setStats] = useState<Stats>(initialStats);

  // Search states
  const [voterSearch, setVoterSearch] = useState('');
  const [turnoutSearch, setTurnoutSearch] = useState('');

  // Modals / Form states
  const [posName, setPosName] = useState('');
  const [editingPosId, setEditingPosId] = useState<string | null>(null);

  const [candForm, setCandForm] = useState({
    id: '',
    name: '',
    class: '',
    position_id: '',
    manifesto: '',
    photo_url: '',
  });
  const [candPhotoFile, setCandPhotoFile] = useState<File | null>(null);
  const [showCandModal, setShowCandModal] = useState(false);
  const [editingCandId, setEditingCandId] = useState<string | null>(null);

  const [voterForm, setVoterForm] = useState({ name: '', class: '' });
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState<string[]>([]);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Status / Loading states
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [lastPolled, setLastPolled] = useState<Date>(new Date());

  // Refreshes all data by fetching from the /api/admin/results (which contains latest results/turnout)
  const refreshData = async () => {
    try {
      const res = await fetch('/api/admin/results');
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setTurnout(data.turnout);
        setStats(data.stats);
        setLastPolled(new Date());
      }
      
      // Fetch fresh voters/positions/candidates
      const vRes = await fetch('/api/admin/voters');
      if (vRes.ok) {
        const vData = await vRes.json();
        setVoters(vData.voters);
      }

      const pRes = await fetch('/api/admin/positions');
      if (pRes.ok) {
        const pData = await pRes.json();
        setPositions(pData.positions);
      }

      const cRes = await fetch('/api/admin/candidates');
      if (cRes.ok) {
        const cData = await cRes.json();
        setCandidates(cData.candidates);
      }
    } catch (err) {
      console.error('Error refreshing dashboard data:', err);
    }
  };

  // Real-time polling for Live Results and Turnout (every 3 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollingActive && activeTab === 'results') {
      interval = setInterval(() => {
        refreshData();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingActive, activeTab]);

  // Handle Logout
  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out of the admin panel?')) {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    }
  };

  // ==========================================
  // POSITIONS CRUD OPERATIONS
  // ==========================================
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posName.trim()) return;

    setLoading(true);
    try {
      if (editingPosId) {
        // Edit position name
        const res = await fetch('/api/admin/positions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPosId, name: posName }),
        });
        if (res.ok) {
          setEditingPosId(null);
          setPosName('');
          refreshData();
        }
      } else {
        // Create new position
        const res = await fetch('/api/admin/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: posName }),
        });
        if (res.ok) {
          setPosName('');
          refreshData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPos = (pos: Position) => {
    setEditingPosId(pos.id);
    setPosName(pos.name);
  };

  const handleDeletePos = async (id: string) => {
    if (confirm('Warning: Deleting this position will also delete all candidates registered for it. Proceed?')) {
      try {
        const res = await fetch(`/api/admin/positions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          refreshData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMovePos = async (index: number, direction: 'up' | 'down') => {
    const list = [...positions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap indexes
    const tempIndex = list[index].order_index;
    list[index].order_index = list[targetIdx].order_index;
    list[targetIdx].order_index = tempIndex;

    list.sort((a, b) => a.order_index - b.order_index);
    setPositions(list); // Optimistic UI update

    try {
      await fetch('/api/admin/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: list }),
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // CANDIDATES CRUD OPERATIONS
  // ==========================================
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, class: className, position_id, manifesto, photo_url } = candForm;
    if (!name.trim() || !className.trim() || !position_id || !manifesto.trim()) {
      alert('All fields are required.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (editingCandId) {
      formData.append('id', editingCandId);
    }
    formData.append('name', name);
    formData.append('class', className);
    formData.append('position_id', position_id);
    formData.append('manifesto', manifesto);
    formData.append('photo_url', photo_url);
    if (candPhotoFile) {
      formData.append('photo', candPhotoFile);
    }

    try {
      const res = await fetch('/api/admin/candidates', {
        method: editingCandId ? 'PUT' : 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowCandModal(false);
        setEditingCandId(null);
        setCandPhotoFile(null);
        setCandForm({ id: '', name: '', class: '', position_id: '', manifesto: '', photo_url: '' });
        refreshData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save candidate.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving candidate.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCand = (cand: Candidate) => {
    setEditingCandId(cand.id);
    setCandForm({
      id: cand.id,
      name: cand.name,
      class: cand.class,
      position_id: cand.position_id,
      manifesto: cand.manifesto,
      photo_url: cand.photo_url,
    });
    setCandPhotoFile(null);
    setShowCandModal(true);
  };

  const handleDeleteCand = async (id: string) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      try {
        const res = await fetch(`/api/admin/candidates/${id}`, { method: 'DELETE' });
        if (res.ok) {
          refreshData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ==========================================
  // VOTERS OPERATIONS
  // ==========================================
  const handleAddSingleVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterForm.name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/voters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: voterForm.name.trim() }),
      });

      if (res.ok) {
        setVoterForm({ name: '', class: '' });
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBulkVoters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setLoading(true);
    setBulkError([]);
    setBulkSuccessMsg('');

    try {
      const res = await fetch('/api/admin/voters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkText }),
      });

      const data = await res.json();
      if (res.ok) {
        setBulkSuccessMsg(`Successfully registered ${data.count} voters.`);
        setBulkText('');
        if (data.errors && data.errors.length > 0) {
          setBulkError(data.errors);
        }
        refreshData();
      } else {
        setBulkError([data.error || 'Failed to bulk import voters.']);
      }
    } catch (err) {
      console.error(err);
      setBulkError(['A network error occurred.']);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoter = async (id: string) => {
    if (confirm('Are you sure you want to delete this voter?')) {
      try {
        const res = await fetch(`/api/admin/voters/${id}`, { method: 'DELETE' });
        if (res.ok) {
          refreshData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePrintVoters = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filtered = voters.filter(
      (v) =>
        v.name.toLowerCase().includes(voterSearch.toLowerCase()) ||
        v.access_code.toLowerCase().includes(voterSearch.toLowerCase())
    );

    const rows = filtered
      .map(
        (v) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-family: sans-serif;">${v.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 1.2rem; font-weight: bold; color: #a22538; letter-spacing: 2px;">${v.access_code}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-family: sans-serif;">${v.has_voted ? 'YES' : 'NO'}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kinford School of Guidance - Access Codes</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; text-align: left; padding: 12px 10px; border-bottom: 2px solid #ddd; }
          </style>
        </head>
        <body onload="window.print();">
          <h2>Kinford School of Guidance</h2>
          <h3>Voter Registrations & Access Codes</h3>
          <p>Total Print Count: ${filtered.length} students. Hand out these codes to students individually.</p>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Access Code</th>
                <th>Voted?</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filtered = voters.filter(
      (v) =>
        v.name.toLowerCase().includes(voterSearch.toLowerCase()) ||
        v.access_code.toLowerCase().includes(voterSearch.toLowerCase())
    );

    const rows = filtered
      .map(
        (v) => `
      <div class="voter-row">
        <span class="voter-name">${v.name}</span>
        <span class="voter-dot-leader"></span>
        <span class="voter-code">${v.access_code}</span>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kinford School of Guidance - Access Codes PDF</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              padding: 40px;
              background-color: #fff;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #a22538;
              padding-bottom: 24px;
            }
            .logo-crest {
              margin-bottom: 12px;
            }
            .brand-title {
              font-size: 20px;
              font-weight: 800;
              color: #a22538;
              letter-spacing: 1px;
              margin: 0;
              text-transform: uppercase;
            }
            .brand-subtitle {
              font-size: 11px;
              font-weight: 600;
              color: #eeb540;
              letter-spacing: 2px;
              margin: 4px 0 0 0;
              text-transform: uppercase;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #0f172a;
              margin: 20px 0 6px 0;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin: 0 0 10px 0;
            }
            .voter-list {
              margin-top: 20px;
            }
            .voter-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px 0;
              border-bottom: 1px dashed #e2e8f0;
              page-break-inside: avoid;
            }
            .voter-name {
              font-size: 15px;
              font-weight: 600;
              color: #1e293b;
            }
            .voter-dot-leader {
              flex-grow: 1;
              border-bottom: 1px dotted #cbd5e1;
              margin: 0 16px;
              height: 12px;
              display: inline-block;
            }
            .voter-code {
              font-family: monospace;
              font-size: 18px;
              font-weight: 700;
              color: #a22538;
              letter-spacing: 2px;
              background-color: #f8fafc;
              padding: 4px 12px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            @media print {
              body { padding: 20px; }
              .voter-row { border-bottom: 1px dashed #94a3b8; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="header">
            <div class="logo-crest">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20 H90 V30 H10 Z" fill="#EEB540"/>
                <path d="M20 40 C20 40 50 15 80 40 C80 40 50 25 20 40 Z" fill="#A22538"/>
                <circle cx="50" cy="65" r="15" fill="#A22538" stroke="#EEB540" stroke-width="4"/>
              </svg>
            </div>
            <h1 class="brand-title">Kinford School of Guidance</h1>
            <p class="brand-subtitle">Official Voting System 2026</p>
            
            <h2 class="title">Student Access Codes Directory</h2>
            <p class="subtitle">Secure in-person ballot verification credentials. Keep confidential.</p>
          </div>
          
          <div class="voter-list">
            ${rows}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter lists
  const filteredVoters = voters.filter(
    (v) =>
      v.name.toLowerCase().includes(voterSearch.toLowerCase()) ||
      v.access_code.toLowerCase().includes(voterSearch.toLowerCase())
  );

  const filteredTurnout = turnout.filter(
    (v) =>
      v.name.toLowerCase().includes(turnoutSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Admin Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <KinfordLogo size={36} showText={true} />

          <div className="flex items-center gap-4">
            <button
              onClick={refreshData}
              className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-900"
              title="Refresh database records"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-red-900/20"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main admin dashboard workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        {/* Navigation Tabs list (sidebar) */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[#EEB540] tracking-widest px-3 mb-2 block">
            ELECTION STATS
          </span>
          <button
            onClick={() => setActiveTab('results')}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer text-sm ${
              activeTab === 'results'
                ? 'bg-[#A22538] text-white shadow-lg shadow-[#A22538]/15'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-slate-900/50'
            }`}
          >
            <TrendingUp size={16} />
            Live Results
          </button>

          <button
            onClick={() => setActiveTab('turnout')}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer text-sm ${
              activeTab === 'turnout'
                ? 'bg-[#A22538] text-white shadow-lg shadow-[#A22538]/15'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-slate-900/50'
            }`}
          >
            <UserCheck size={16} />
            Voter Turnout
          </button>

          <span className="text-[10px] font-bold text-[#EEB540] tracking-widest px-3 mt-6 mb-2 block">
            DATA CONFIG
          </span>
          <button
            onClick={() => setActiveTab('positions')}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer text-sm ${
              activeTab === 'positions'
                ? 'bg-[#A22538] text-white shadow-lg shadow-[#A22538]/15'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-slate-900/50'
            }`}
          >
            <Layers size={16} />
            Positions
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer text-sm ${
              activeTab === 'candidates'
                ? 'bg-[#A22538] text-white shadow-lg shadow-[#A22538]/15'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-slate-900/50'
            }`}
          >
            <Award size={16} />
            Candidates
          </button>

          <button
            onClick={() => setActiveTab('voters')}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer text-sm ${
              activeTab === 'voters'
                ? 'bg-[#A22538] text-white shadow-lg shadow-[#A22538]/15'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-slate-900/50'
            }`}
          >
            <Users size={16} />
            Voters Directory
          </button>
        </aside>

        {/* Tab content space */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: LIVE RESULTS */}
          {activeTab === 'results' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-100">Live Election Results</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Auto-polling active. Last update: {lastPolled.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EEB540] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EEB540]"></span>
                  </span>
                  <span className="text-xs text-[#EEB540] font-bold uppercase tracking-wider">Live Updates Active</span>
                  <button
                    onClick={() => setPollingActive(!pollingActive)}
                    className={`ml-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border cursor-pointer transition ${
                      pollingActive 
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'bg-[#EEB540]/10 border-[#EEB540]/20 text-[#EEB540] hover:bg-[#EEB540]/20'
                    }`}
                  >
                    {pollingActive ? 'Pause Stream' : 'Resume Stream'}
                  </button>
                </div>
              </div>

              {/* Turnout metrics box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Voters</span>
                  <p className="text-3xl font-extrabold text-slate-100">{stats.totalVoters}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Votes Polled</span>
                  <p className="text-3xl font-extrabold text-[#EEB540]">{stats.votedCount}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Voter Turnout</span>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-3xl font-extrabold text-[#EEB540]">{stats.turnoutPercentage}%</p>
                    <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="bg-[#EEB540] h-full rounded-full" style={{ width: `${stats.turnoutPercentage}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Results cards */}
              <div className="space-y-8">
                {results.length === 0 ? (
                  <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
                    No ballot data available. Initialize positions and candidates to start.
                  </div>
                ) : (
                  results.map((pos) => (
                    <div key={pos.id} className="glass-panel rounded-3xl p-6 border-slate-800">
                      <h3 className="text-xl font-bold text-slate-200 mb-6 border-b border-slate-900 pb-4">
                        {pos.name}
                      </h3>

                      <div className="space-y-4">
                        {pos.candidates.map((cand, idx) => {
                          const totalVotesForPos = pos.candidates.reduce((sum, c) => sum + c.vote_count, 0);
                          const percentage = totalVotesForPos > 0 ? Math.round((cand.vote_count / totalVotesForPos) * 100) : 0;
                          const isLeader = idx === 0 && cand.vote_count > 0;

                          return (
                            <div
                              key={cand.id}
                              className={`p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border transition ${
                                isLeader
                                  ? 'bg-[#EEB540]/5 border-[#EEB540]/30'
                                  : 'bg-slate-900/30 border-slate-900/80'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cand.photo_url}
                                  alt={cand.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-850"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-200">{cand.name}</h4>
                                    <span className="text-[10px] font-bold text-slate-500">({cand.class})</span>
                                    {isLeader && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EEB540]/10 text-[#EEB540] border border-[#EEB540]/20">
                                        Leader
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">{percentage}% of position votes</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="w-32 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900 hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${isLeader ? 'bg-[#EEB540]' : 'bg-slate-700'}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="text-right">
                                  <span className="text-xl font-black text-slate-100 font-mono">
                                    {cand.vote_count}
                                  </span>
                                  <span className="text-xs text-slate-500 ml-1">votes</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VOTER TURNOUT LIST */}
          {activeTab === 'turnout' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-100">Voter Turnout Log</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Shows which students have cast their ballots. Keep strictly separate from selections to maintain secrecy.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-slate-400">
                    Turnout: <span className="text-[#EEB540] font-bold">{stats.votedCount} / {stats.totalVoters}</span> ({stats.turnoutPercentage}%)
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={turnoutSearch}
                  onChange={(e) => setTurnoutSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all"
                />
              </div>

              <div className="glass-panel rounded-3xl overflow-hidden border-slate-800 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <th className="py-4 px-6">Student Name</th>
                        <th className="py-4 px-6 text-center">Voted?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTurnout.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-12 px-6 text-center text-slate-500 text-sm">
                            No matching students found.
                          </td>
                        </tr>
                      ) : (
                        filteredTurnout.map((t, idx) => (
                          <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition">
                            <td className="py-4 px-6 font-bold text-slate-200">{t.name}</td>
                            <td className="py-4 px-6 text-center">
                              {t.has_voted ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEB540]/10 text-[#EEB540] border border-[#EEB540]/20">
                                  <Check size={12} /> Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-850 text-slate-500 border border-slate-800">
                                  <X size={12} /> No
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POSITIONS CONFIGURATION */}
          {activeTab === 'positions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
                <h2 className="text-2xl font-extrabold text-slate-100">Election Positions</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage election offices. Use ordering arrows to arrange their order on the voter ballot.
                </p>
              </div>

              {/* Add/Edit form */}
              <form onSubmit={handleSavePosition} className="glass-panel p-6 rounded-2xl border-slate-800 flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="posName" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    {editingPosId ? 'Edit Position Name' : 'New Position Name'}
                  </label>
                  <input
                    id="posName"
                    type="text"
                    value={posName}
                    onChange={(e) => setPosName(e.target.value)}
                    placeholder="e.g. Students' Editor"
                    className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !posName.trim()}
                    className="px-6 py-3 rounded-xl font-bold bg-[#A22538] hover:bg-[#8A1B2C] active:scale-[0.98] text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none border border-[#A22538]/10"
                  >
                    {editingPosId ? 'Update' : <><Plus size={16} /> Add Position</>}
                  </button>
                  {editingPosId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPosId(null);
                        setPosName('');
                      }}
                      className="px-4 py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Positions List */}
              <div className="glass-panel rounded-3xl overflow-hidden border-slate-800 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <th className="py-4 px-6 w-16 text-center">Order</th>
                        <th className="py-4 px-6">Position Title</th>
                        <th className="py-4 px-6 w-36 text-center">Sort Order</th>
                        <th className="py-4 px-6 w-32 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 px-6 text-center text-slate-500 text-sm">
                            No positions registered. Add one above.
                          </td>
                        </tr>
                      ) : (
                        positions.map((pos, idx) => (
                          <tr key={pos.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition">
                            <td className="py-4 px-6 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-4 px-6 font-bold text-slate-200">{pos.name}</td>
                            <td className="py-4 px-6">
                              <div className="flex justify-center items-center gap-1">
                                <button
                                  onClick={() => handleMovePos(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() => handleMovePos(idx, 'down')}
                                  disabled={idx === positions.length - 1}
                                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditPos(pos)}
                                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeletePos(pos.id)}
                                  className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition cursor-pointer border border-red-900/10"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CANDIDATES MANAGEMENT */}
          {activeTab === 'candidates' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-100">Candidates</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Add, edit, or delete candidates and write their manifesto.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCandId(null);
                    setCandForm({
                      id: '',
                      name: '',
                      class: '',
                      position_id: positions[0]?.id || '',
                      manifesto: '',
                      photo_url: '',
                    });
                    setCandPhotoFile(null);
                    setShowCandModal(true);
                  }}
                  className="px-5 py-3 rounded-xl font-bold bg-[#A22538] hover:bg-[#8A1B2C] text-white flex items-center gap-2 cursor-pointer transition shadow-lg shadow-[#A22538]/15 border border-[#A22538]/10"
                >
                  <Plus size={16} />
                  Add Candidate
                </button>
              </div>

              {/* Candidates Grid */}
              <div className="space-y-8">
                {positions.map((pos) => {
                  const posCands = candidates.filter((c) => c.position_id === pos.id);
                  return (
                    <div key={pos.id} className="glass-panel p-6 rounded-3xl border-slate-800">
                      <h3 className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-4 mb-6">
                        {pos.name} <span className="text-xs text-slate-500 font-normal ml-2">({posCands.length} registered)</span>
                      </h3>

                      {posCands.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4 italic">No candidates registered for this position.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {posCands.map((cand) => (
                            <div key={cand.id} className="bg-slate-950/40 rounded-2xl overflow-hidden border border-slate-900 flex flex-col justify-between">
                              <div>
                                <div className="aspect-[4/3] w-full relative bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-900">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cand.photo_url}
                                    alt={cand.name}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                <div className="p-5">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-bold text-slate-200 text-base">{cand.name}</h4>
                                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-705">{cand.class}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-2 font-mono">Current Votes: {cand.vote_count}</p>
                                  <div className="mt-3 pt-3 border-t border-slate-900">
                                    <span className="text-[9px] font-bold text-[#EEB540] uppercase tracking-widest block mb-1">Manifesto</span>
                                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{cand.manifesto}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-5 pt-0 flex gap-2">
                                <button
                                  onClick={() => handleEditCand(cand)}
                                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold flex justify-center items-center gap-1 border border-slate-800"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCand(cand.id)}
                                  className="px-3 py-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition cursor-pointer border border-red-900/10"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CANDIDATE MODAL FORM */}
              {showCandModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="max-w-lg w-full bg-slate-950 border border-slate-850 rounded-3xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in">
                    <button
                      onClick={() => setShowCandModal(false)}
                      className="absolute top-6 right-6 p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={16} />
                    </button>

                    <h3 className="text-xl font-bold text-slate-200 mb-6">
                      {editingCandId ? 'Edit Candidate Details' : 'Register New Candidate'}
                    </h3>

                    <form onSubmit={handleSaveCandidate} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Candidate Name
                        </label>
                        <input
                          type="text"
                          required
                          value={candForm.name}
                          onChange={(e) => setCandForm({ ...candForm, name: e.target.value })}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            Class
                          </label>
                          <input
                            type="text"
                            required
                            value={candForm.class}
                            onChange={(e) => setCandForm({ ...candForm, class: e.target.value })}
                            placeholder="e.g. Grade 12-A"
                            className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            Position Office
                          </label>
                          <select
                            value={candForm.position_id}
                            required
                            onChange={(e) => setCandForm({ ...candForm, position_id: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all"
                          >
                            <option value="" disabled className="bg-slate-950">Select Position</option>
                            {positions.map((pos) => (
                              <option key={pos.id} value={pos.id} className="bg-slate-950 text-white">
                                {pos.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Candidate Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCandPhotoFile(e.target.files[0]);
                            }
                          }}
                          className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-slate-300 file:cursor-pointer hover:file:bg-slate-800 transition"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Recommending square aspect ratio. Leave empty to keep existing/default avatar.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Manifesto Agenda
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={candForm.manifesto}
                          onChange={(e) => setCandForm({ ...candForm, manifesto: e.target.value })}
                          placeholder="What will this candidate do if elected to the school council?"
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all font-light leading-relaxed font-sans"
                        />
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-3.5 rounded-xl font-bold bg-[#A22538] hover:bg-[#8A1B2C] text-white transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none border border-[#A22538]/10"
                        >
                          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Candidate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCandModal(false)}
                          className="px-6 py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-850 text-slate-400 transition cursor-pointer border border-slate-850"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VOTERS REGISTRATION */}
          {activeTab === 'voters' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
                <h2 className="text-2xl font-extrabold text-slate-100">Voters Directory</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage student credentials, view unique codes, and perform bulk entries.
                </p>
              </div>

              {/* Input forms grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Single voter add */}
                <form onSubmit={handleAddSingleVoter} className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <UserPlus size={16} /> Add Single Student
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Student Name
                        </label>
                        <input
                          type="text"
                          required
                          value={voterForm.name}
                          onChange={(e) => setVoterForm({ ...voterForm, name: e.target.value })}
                          placeholder="e.g. James Miller"
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !voterForm.name.trim()}
                    className="w-full mt-6 py-3 rounded-xl font-bold bg-[#A22538] hover:bg-[#8A1B2C] text-white transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none border border-[#A22538]/10"
                  >
                    Add Voter
                  </button>
                </form>

                {/* Bulk voter add */}
                <form onSubmit={handleAddBulkVoters} className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={16} /> Bulk Upload Voters
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-4">Input format: one student name per line (just name, no class)</p>
                    
                    <textarea
                      rows={4}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="James Miller&#10;Sarah Jenkins&#10;David Croft"
                      className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all font-mono text-xs"
                    />
                  </div>
                  
                  {bulkSuccessMsg && (
                    <div className="mt-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-center">
                      {bulkSuccessMsg}
                    </div>
                  )}

                  {bulkError.length > 0 && (
                    <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20 text-left max-h-24 overflow-y-auto">
                      {bulkError.map((err, i) => <p key={i}>{err}</p>)}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !bulkText.trim()}
                    className="w-full mt-4 py-3 rounded-xl font-bold bg-[#A22538] hover:bg-[#8A1B2C] text-white transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none border border-[#A22538]/10"
                  >
                    Import Batch
                  </button>
                </form>
              </div>

              {/* Table of all voters */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search voters by name or code..."
                      value={voterSearch}
                      onChange={(e) => setVoterSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-900 bg-slate-900/30 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EEB540] focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-center">
                    <button
                      onClick={handlePrintVoters}
                      className="px-5 py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white transition flex items-center gap-2 cursor-pointer border border-slate-850 justify-center w-full sm:w-auto"
                    >
                      <Printer size={16} /> Print Access Codes
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="px-5 py-3 rounded-xl font-bold bg-[#A22538] hover:bg-[#8A1B2C] text-white transition flex items-center gap-2 cursor-pointer border border-[#A22538]/10 justify-center w-full sm:w-auto"
                    >
                      <FileText size={16} /> Download PDF
                    </button>
                  </div>
                </div>

                <div className="glass-panel rounded-3xl overflow-hidden border-slate-800 shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-900/30 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Access Code</th>
                          <th className="py-4 px-6 text-center">Voted?</th>
                          <th className="py-4 px-6 w-20 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVoters.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 px-6 text-center text-slate-500 text-sm">
                              No voters found. Add students above.
                            </td>
                          </tr>
                        ) : (
                          filteredVoters.map((v) => (
                            <tr key={v.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition">
                              <td className="py-4 px-6 font-bold text-slate-200">{v.name}</td>
                              <td className="py-4 px-6 font-mono text-sm tracking-wider font-bold text-[#EEB540]">{v.access_code}</td>
                              <td className="py-4 px-6 text-center">
                                {v.has_voted ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEB540]/15 text-[#EEB540] border border-[#EEB540]/10">Voted</span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500">Pending</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => handleDeleteVoter(v.id)}
                                  className="p-1.5 rounded bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition cursor-pointer border border-red-900/10"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-950 py-6 text-center text-xs text-slate-600 sticky bottom-0 bg-slate-950/80 backdrop-blur-md">
        <p>© 2026 Kinford School of Guidance. All rights reserved.</p>
      </footer>
    </div>
  );
}
