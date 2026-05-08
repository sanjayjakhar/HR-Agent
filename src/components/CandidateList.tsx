'use client';
import { useState } from 'react';
import {
  Trophy, Mail, Calendar, Star, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, User, Phone, GraduationCap, Briefcase,
  ThumbsUp, ThumbsDown, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Candidate } from '@/types';

interface Props {
  candidates: Candidate[];
  jobId: number;
  topN: number;
  onStatusChange: () => void;
  onEmailClick: (selected: Candidate[]) => void;
  onScheduleClick: (candidate: Candidate) => void;
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const scoreBar = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const rankBadge = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export default function CandidateList({
  candidates, jobId, topN, onStatusChange, onEmailClick, onScheduleClick
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [updating, setUpdating] = useState<number | null>(null);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectTopN = () => {
    const top = candidates.slice(0, topN).map((c) => c.id);
    setSelected(new Set(top));
    toast.success(`Top ${topN} candidates selected`);
  };

  const updateStatus = async (candidateId: number, status: string) => {
    setUpdating(candidateId);
    try {
      const res = await fetch('/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Candidate ${status}`);
      onStatusChange();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const selectedCandidates = candidates.filter((c) => selected.has(c.id));

  const parseJson = (val: string | unknown): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return [];
  };

  if (!candidates.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <User className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500">No candidates yet. Upload and analyze resumes first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600">
          {candidates.length} candidates · {selected.size} selected
        </span>
        <button
          onClick={selectTopN}
          className="flex items-center gap-1.5 text-sm bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium px-4 py-2 rounded-lg transition"
        >
          <Trophy className="w-4 h-4" /> Select Top {topN}
        </button>
        {selected.size > 0 && (
          <>
            <button
              onClick={() => onEmailClick(selectedCandidates)}
              className="flex items-center gap-1.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 font-medium px-4 py-2 rounded-lg transition"
            >
              <Mail className="w-4 h-4" /> Email Selected ({selected.size})
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg transition"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Candidate Cards */}
      {candidates.map((c) => {
        const skills = parseJson(c.skills);
        const strengths = parseJson(c.strengths);
        const weaknesses = parseJson(c.weaknesses);
        const isExpanded = expanded === c.id;
        const isSelected = selected.has(c.id);

        return (
          <div
            key={c.id}
            className={`bg-white rounded-2xl shadow-sm border transition ${
              isSelected ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-100'
            }`}
          >
            {/* Card Header */}
            <div className="p-5 flex items-center gap-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(c.id)}
                className="w-4 h-4 rounded accent-brand-600 cursor-pointer flex-shrink-0"
              />

              {/* Rank Badge */}
              <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-lg font-bold flex-shrink-0">
                {c.ranking ? rankBadge(c.ranking) : '–'}
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{c.name || 'Unknown Candidate'}</h3>
                  {c.status === 'shortlisted' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Shortlisted</span>
                  )}
                  {c.status === 'rejected' && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Rejected</span>
                  )}
                  {c.status === 'pending' && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Pending Analysis</span>
                  )}
                  {c.interview_status && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {c.scheduled_date
                        ? `${new Date(c.scheduled_date).toLocaleDateString()} ${c.scheduled_time ?? ''}`
                        : 'Interview Scheduled'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {c.email && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {c.email}
                    </span>
                  )}
                  {c.experience && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {c.experience}
                    </span>
                  )}
                </div>
                {/* Score Bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[200px]">
                    <div
                      className={`h-1.5 rounded-full transition-all ${scoreBar(c.score)}`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(c.score)}`}>
                    {c.score}/100
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onScheduleClick(c)}
                  className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition"
                  title="Schedule Interview"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEmailClick([c])}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateStatus(c.id, c.status === 'shortlisted' ? 'analyzed' : 'shortlisted')}
                  disabled={updating === c.id || c.status === 'pending'}
                  className={`p-2 rounded-lg transition ${
                    c.status === 'shortlisted'
                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title="Toggle Shortlist"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateStatus(c.id, c.status === 'rejected' ? 'analyzed' : 'rejected')}
                  disabled={updating === c.id || c.status === 'pending'}
                  className={`p-2 rounded-lg transition ${
                    c.status === 'rejected'
                      ? 'text-red-600 bg-red-50 hover:bg-red-100'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title="Reject Candidate"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-5 space-y-5">

                {/* Fit Analysis — full width, shown first */}
                {(c.fit_reason || c.best_fit_role) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.fit_reason && (
                      <div className={`rounded-xl p-4 border ${c.score >= 60 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${c.score >= 60 ? 'text-green-700' : 'text-red-600'}`}>
                          {c.score >= 60 ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                          {c.score >= 60 ? 'Why Suitable' : 'Why Not Suitable'}
                        </h4>
                        <p className={`text-sm leading-relaxed ${c.score >= 60 ? 'text-green-800' : 'text-red-700'}`}>{c.fit_reason}</p>
                      </div>
                    )}
                    {c.best_fit_role && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> Best Fit Role
                        </h4>
                        <p className="text-sm font-semibold text-blue-900">{c.best_fit_role}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.length > 0
                      ? skills.map((s, i) => (
                          <span key={i} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                            {s}
                          </span>
                        ))
                      : <span className="text-xs text-gray-400">No skills extracted</span>
                    }
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Education</h4>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    {c.education || 'Not specified'}
                  </p>
                </div>

                {strengths.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {strengths.map((s, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                          <Star className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Gaps</h4>
                    <ul className="space-y-1">
                      {weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.phone && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact</h4>
                    <p className="text-sm text-gray-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" /> {c.phone}
                    </p>
                  </div>
                )}

                {c.interview_status && (
                  <div className="md:col-span-2 bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">Interview Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {c.scheduled_date && (
                        <p className="text-gray-700 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          {new Date(c.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                      {c.scheduled_time && (
                        <p className="text-gray-700 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-purple-400" />
                          {c.scheduled_time}
                        </p>
                      )}
                      {c.meeting_link && (
                        <p className="col-span-2">
                          <a
                            href={c.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline break-all"
                          >
                            {c.meeting_link}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
