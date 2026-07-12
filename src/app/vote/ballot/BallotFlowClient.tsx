'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import KinfordLogo from '@/components/KinfordLogo';

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
  position_id: string;
}

interface BallotFlowClientProps {
  initialPositions: Position[];
  initialCandidates: Candidate[];
  voterName: string;
  voterClass: string;
}

export default function BallotFlowClient({
  initialPositions,
  initialCandidates,
  voterName,
  voterClass,
}: BallotFlowClientProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0); // Index of positions, or review step
  const [selections, setSelections] = useState<{ [positionId: string]: Candidate }>({});
  const [isReview, setIsReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [submitError, setSubmitError] = useState('');

  // Handle auto-redirect countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (finished && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (finished && countdown === 0) {
      router.push('/vote');
    }
    return () => clearTimeout(timer);
  }, [finished, countdown, router]);

  const activePosition = initialPositions[currentStep];
  const activeCandidates = initialCandidates.filter(
    (c) => c.position_id === activePosition?.id
  );

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelections((prev) => ({
      ...prev,
      [activePosition.id]: candidate,
    }));

    if (currentStep < initialPositions.length - 1) {
      // Auto advance
      setCurrentStep((prev) => prev + 1);
    } else {
      // Go to review screen
      setIsReview(true);
    }
  };

  const handleJumpToPosition = (index: number) => {
    setCurrentStep(index);
    setIsReview(false);
  };

  const handleSubmitBallot = async () => {
    setSubmitting(true);
    setSubmitError('');

    const formattedVotes = initialPositions.map((pos) => ({
      positionId: pos.id,
      candidateId: selections[pos.id]?.id,
    }));

    try {
      const res = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votes: formattedVotes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit ballot. Please contact the administrator.');
        setSubmitting(false);
      } else {
        setFinished(true);
      }
    } catch (err) {
      console.error(err);
      setSubmitError('A network error occurred. Please check connectivity and try again.');
      setSubmitting(false);
    }
  };

  // SUCCESS STEP: Render checkmark and countdown redirect
  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#A22538]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#EEB540]/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-md w-full glass-panel rounded-3xl p-12 text-center border-slate-800 shadow-2xl flex flex-col items-center">
          {/* Animated CSS Checkmark */}
          <div className="mb-8 flex justify-center items-center">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-100 mb-4 tracking-tight">
            Vote Submitted!
          </h2>
          
          <p className="text-slate-400 mb-8 max-w-sm">
            Thank you, your ballot has been securely and anonymously recorded.
          </p>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-slate-900/50 px-4 py-2.5 rounded-xl border border-slate-900">
            Resetting terminal in <span className="text-[#EEB540] font-mono text-sm font-bold">{countdown}</span> seconds...
          </div>
        </div>
      </div>
    );
  }

  // REVIEW STEP: Render ballot selections review list
  if (isReview) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-900/60 bg-slate-950/60 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <KinfordLogo size={36} showText={true} />
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-[#EEB540] tracking-widest uppercase bg-[#EEB540]/5 px-3 py-1 rounded-full border border-[#EEB540]/10 hidden sm:inline-block">
                Ballot Review
              </span>
              <div className="text-right">
                <p className="text-xs text-slate-400">Voter: <span className="text-slate-200 font-medium">{voterName}</span></p>
                <p className="text-[10px] text-slate-500">Class: {voterClass}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center animate-fade-in">
          <div className="glass-panel rounded-3xl p-8 md:p-12 border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Review Your Ballot</h2>
            <p className="text-sm text-slate-400 mb-8">
              Verify your picks for each position. If you wish to change a selection, click the &quot;Change&quot; link next to the position.
            </p>

            <div className="space-y-4 mb-8">
              {initialPositions.map((pos, idx) => {
                const picked = selections[pos.id];
                return (
                  <div
                    key={pos.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl bg-slate-900/20 border border-slate-800/80 gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#EEB540] uppercase tracking-widest block mb-1">
                        Position {idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-200 text-lg leading-none">{pos.name}</h3>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      {picked ? (
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-[#EEB540] text-base">{picked.name}</p>
                          <p className="text-xs text-slate-500">Class: {picked.class}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-red-400 font-semibold italic">No selection</span>
                      )}

                      <button
                        onClick={() => handleJumpToPosition(idx)}
                        className="text-xs font-bold text-[#EEB540] hover:text-[#EEB540]/80 underline cursor-pointer uppercase tracking-wider"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {submitError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold text-center">
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmitBallot}
              disabled={submitting || initialPositions.some((p) => !selections[p.id])}
              className="w-full py-4 rounded-xl font-extrabold text-white text-lg tracking-wide bg-[#A22538] hover:bg-[#8A1B2C] transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-[#A22538]/15 border border-[#A22538]/10 cursor-pointer"
            >
              {submitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Final Submit Vote'
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ACTIVE BALLOT STEP: Voting screen per position
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-900/60 bg-slate-950/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <KinfordLogo size={36} showText={true} />
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#EEB540] tracking-widest uppercase bg-[#EEB540]/5 px-3 py-1 rounded-full border border-[#EEB540]/10 hidden sm:inline-block">
              Position {currentStep + 1} of {initialPositions.length}
            </span>
            <div className="text-right">
              <p className="text-xs text-slate-400">Voter: <span className="text-slate-200 font-medium">{voterName}</span></p>
              <p className="text-[10px] text-slate-500">Class: {voterClass}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Ballot Flow */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Progress indicator */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full mb-10 overflow-hidden border border-slate-950">
          <div
            className="bg-[#EEB540] h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentStep) / initialPositions.length) * 100}%` }}
          />
        </div>

        <div className="mb-8">
          <span className="text-xs font-bold text-[#EEB540] uppercase tracking-widest block mb-1">
            Now Voting For
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            {activePosition?.name}
          </h2>
        </div>

        {activeCandidates.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
            <p className="mb-4">No candidates registered for this position.</p>
            <button
              onClick={() => {
                if (currentStep < initialPositions.length - 1) {
                  setCurrentStep((prev) => prev + 1);
                } else {
                  setIsReview(true);
                }
              }}
              className="px-6 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 transition cursor-pointer"
            >
              Skip Position
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCandidates.map((candidate) => {
              const isSelected = selections[activePosition.id]?.id === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(candidate)}
                  className={`glass-panel rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between border-2 transition-all ${
                    isSelected
                      ? 'border-[#EEB540] ring-2 ring-[#EEB540]/20 shadow-2xl scale-[1.01]'
                      : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/10'
                  }`}
                >
                  <div>
                    {/* Candidate Photo */}
                    <div className="aspect-[4/3] w-full relative bg-slate-900 border-b border-slate-900 overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={candidate.photo_url}
                        alt={candidate.name}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Class: {candidate.class}</span>
                      </div>
                    </div>

                    {/* Candidate Details */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-100 mb-1 leading-tight">{candidate.name}</h3>
                      <p className="text-xs text-[#EEB540] font-semibold tracking-wider uppercase mb-4">Candidate</p>
                      
                      <div className="border-t border-slate-900 pt-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Manifesto</span>
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-6 whitespace-pre-line font-light font-sans">
                          {candidate.manifesto}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <button
                      className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#A22538] border-[#A22538] text-white hover:bg-[#8A1B2C]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Candidate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
