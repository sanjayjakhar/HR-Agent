'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Users, BarChart3, Plus, ChevronRight,
  Loader2, Database, RefreshCw, Trash2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import JobForm from '@/components/JobForm';
import ResumeUpload from '@/components/ResumeUpload';
import CandidateList from '@/components/CandidateList';
import EmailModal from '@/components/EmailModal';
import ScheduleModal from '@/components/ScheduleModal';
import ReportView from '@/components/ReportView';
import { Job, Candidate } from '@/types';

type Tab = 'jobs' | 'candidates' | 'report';

export default function Home() {
  const [tab, setTab] = useState<Tab>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [topN, setTopN] = useState(3);
  const [dbInit, setDbInit] = useState(false);
  const [dbIniting, setDbIniting] = useState(false);

  // Email & Schedule modal state
  const [emailCandidates, setEmailCandidates] = useState<Candidate[] | null>(null);
  const [scheduleCanddidate, setScheduleCandidate] = useState<Candidate | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const jobList: Job[] = data.jobs ?? [];
      setJobs(jobList);
      return jobList;
    } catch {
      toast.error('Failed to load jobs');
      return [];
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!selectedJob) return;
    setLoadingCandidates(true);
    try {
      const res = await fetch(`/api/candidates?jobId=${selectedJob.id}`);
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setLoadingCandidates(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchJobs().then((jobList) => {
      if (jobList.length > 0) {
        const savedId = localStorage.getItem('selectedJobId');
        if (savedId) {
          const found = jobList.find((j) => j.id === parseInt(savedId));
          if (found) setSelectedJob(found);
        }
      }
    });
  }, [fetchJobs]);

  useEffect(() => {
    if (selectedJob) {
      localStorage.setItem('selectedJobId', String(selectedJob.id));
      fetchCandidates();
    }
  }, [selectedJob, fetchCandidates]);

  const initDB = async () => {
    setDbIniting(true);
    try {
      const res = await fetch('/api/init-db?reset=true', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbInit(true);
      toast.success('Database initialized!');
      fetchJobs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'DB init failed');
    } finally {
      setDbIniting(false);
    }
  };

  const deleteJob = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this job and all its candidates?')) return;
    try {
      await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
      toast.success('Job deleted');
      if (selectedJob?.id === id) { setSelectedJob(null); setCandidates([]); }
      fetchJobs();
    } catch {
      toast.error('Delete failed');
    }
  };

  const analyzed = candidates.filter((c) => c.status !== 'pending');
  const shortlisted = candidates.filter((c) => c.status === 'shortlisted');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'jobs',       label: 'Jobs & Upload',  icon: Briefcase },
    { id: 'candidates', label: 'Candidates',      icon: Users },
    { id: 'report',     label: 'Final Report',    icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">HR Agent</h1>
              <p className="text-xs text-gray-400">AI Recruitment Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={initDB}
              disabled={dbIniting}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 bg-gray-100 hover:bg-brand-50 px-4 py-2 rounded-xl transition"
              title="Initialize / reset database tables"
            >
              {dbIniting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Init DB
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Tab: Jobs & Upload ── */}
        {tab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Job List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Job Positions</h2>
                <div className="flex gap-2">
                  <button onClick={fetchJobs} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setShowJobForm(!showJobForm)}
                    className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" /> New Job
                  </button>
                </div>
              </div>

              {loadingJobs ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No jobs yet. Click &quot;Init DB&quot; first, then create a job.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => { setSelectedJob(job); setTab('candidates'); }}
                    className={`w-full text-left bg-white rounded-2xl border p-5 hover:border-brand-300 transition group cursor-pointer ${
                      selectedJob?.id === job.id ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(job as Job & { candidate_count?: number }).candidate_count ?? 0} candidates
                          <Clock className="w-3 h-3 ml-2" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </p>
                        {job.skills_required && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{job.skills_required}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => deleteJob(job.id, e)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Job Form + Resume Upload */}
            <div className="lg:col-span-2 space-y-6">
              {showJobForm || jobs.length === 0 ? (
                <JobForm
                  onJobCreated={(job) => {
                    setJobs((prev) => [job, ...prev]);
                    setSelectedJob(job);
                    setShowJobForm(false);
                    toast.success('Now upload resumes →');
                  }}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <Plus className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">Click <strong>New Job</strong> to create a position, or select an existing job to upload resumes.</p>
                </div>
              )}

              {selectedJob && (
                <ResumeUpload
                  job={selectedJob}
                  onAnalyzed={() => {
                    setTab('candidates');
                    fetchCandidates();
                    toast.success('Analysis complete! View rankings →');
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Candidates ── */}
        {tab === 'candidates' && (
          <div className="space-y-4">
            {/* Job Selector Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Selected Job:</label>
              <select
                className="flex-1 max-w-xs px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                value={selectedJob?.id ?? ''}
                onChange={(e) => {
                  const job = jobs.find((j) => j.id === parseInt(e.target.value));
                  if (job) setSelectedJob(job);
                }}
              >
                <option value="">Select a job...</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>

              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-gray-600">Top N:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={topN}
                  onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
                />
                <button
                  onClick={fetchCandidates}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Summary Pills */}
            {candidates.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Total', value: candidates.length, color: 'bg-gray-100 text-gray-700' },
                  { label: 'Analyzed', value: analyzed.length, color: 'bg-purple-100 text-purple-700' },
                  { label: 'Shortlisted', value: shortlisted.length, color: 'bg-green-100 text-green-700' },
                  { label: 'Pending', value: candidates.length - analyzed.length, color: 'bg-yellow-100 text-yellow-700' },
                ].map(({ label, value, color }) => (
                  <span key={label} className={`text-sm font-medium px-4 py-1.5 rounded-full ${color}`}>
                    {label}: {value}
                  </span>
                ))}
              </div>
            )}

            {!selectedJob ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">Select a job to view candidates</p>
              </div>
            ) : loadingCandidates ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
            ) : (
              <CandidateList
                candidates={candidates}
                jobId={selectedJob.id}
                topN={topN}
                onStatusChange={fetchCandidates}
                onEmailClick={(sel) => setEmailCandidates(sel)}
                onScheduleClick={(c) => setScheduleCandidate(c)}
              />
            )}
          </div>
        )}

        {/* ── Tab: Report ── */}
        {tab === 'report' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Job:</label>
              <select
                className="flex-1 max-w-xs px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                value={selectedJob?.id ?? ''}
                onChange={(e) => {
                  const job = jobs.find((j) => j.id === parseInt(e.target.value));
                  if (job) setSelectedJob(job);
                }}
              >
                <option value="">Select a job...</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            {selectedJob ? (
              <ReportView jobId={selectedJob.id} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">Select a job to generate the final report</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {emailCandidates && selectedJob && (
        <EmailModal
          candidates={emailCandidates}
          jobId={selectedJob.id}
          onClose={() => setEmailCandidates(null)}
          onSent={fetchCandidates}
        />
      )}

      {scheduleCanddidate && selectedJob && (
        <ScheduleModal
          candidate={scheduleCanddidate}
          jobId={selectedJob.id}
          onClose={() => setScheduleCandidate(null)}
          onScheduled={fetchCandidates}
        />
      )}
    </div>
  );
}
