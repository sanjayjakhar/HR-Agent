'use client';
import { useState, useEffect } from 'react';
import { FileText, Download, Users, Mail, Calendar, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { Report } from '@/types';

interface Props {
  jobId: number;
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
};

export default function ReportView({ jobId }: Props) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/report?jobId=${jobId}`)
      .then((r) => r.json())
      .then((data) => setReport(data))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleDownload = () => {
    if (!report) return;

    const rows = report.candidates.map((c) => {
      const interview = report.interviews.find((i) => i.candidate_id === c.id);
      const emailSent = report.emailLogs.some((e) => e.candidate_id === c.id && e.status === 'sent');
      return [
        c.ranking ?? '-',
        c.name || 'Unknown',
        c.email || '-',
        c.score,
        c.experience || '-',
        c.status,
        interview ? `${interview.scheduled_date} ${interview.scheduled_time}` : '-',
        emailSent ? 'Yes' : 'No',
      ];
    });

    const csvHeaders = ['Rank', 'Name', 'Email', 'Score', 'Experience', 'Status', 'Interview', 'Email Sent'];
    const csvContent = [
      `HR Recruitment Report — ${report.job.title}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      csvHeaders.join(','),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.job.title.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!report?.job) return <p className="text-center text-gray-500">Failed to load report.</p>;

  const { job, candidates, interviews, emailLogs, stats } = report;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 opacity-80" />
            <div>
              <h2 className="text-xl font-bold">HR Final Report</h2>
              <p className="opacity-80">{job.title}</p>
              <p className="opacity-60 text-sm mt-0.5">Generated {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Users, label: 'Total', value: stats.totalCandidates, color: 'blue' },
          { icon: TrendingUp, label: 'Analyzed', value: stats.analyzed, color: 'purple' },
          { icon: Trophy, label: 'Shortlisted', value: stats.shortlisted, color: 'green' },
          { icon: Calendar, label: 'Interviews', value: stats.interviewsScheduled, color: 'orange' },
          { icon: Mail, label: 'Emails Sent', value: stats.emailsSent, color: 'teal' },
          { icon: TrendingUp, label: 'Avg Score', value: `${stats.avgScore}%`, color: 'indigo' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-2 text-${color}-500`} />
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Candidate Rankings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Rank', 'Name', 'Score', 'Experience', 'Status', 'Interview', 'Email'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {candidates.map((c) => {
                const interview = interviews.find((i) => i.candidate_id === c.id);
                const emailSent = emailLogs.some((e) => e.candidate_id === c.id && e.status === 'sent');
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-bold text-gray-700">
                      {c.ranking === 1 ? '🥇' : c.ranking === 2 ? '🥈' : c.ranking === 3 ? '🥉' : `#${c.ranking ?? '-'}`}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{c.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{c.email || '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-lg ${scoreColor(c.score)}`}>{c.score}</span>
                      <span className="text-gray-400 text-xs">/100</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{c.experience || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        c.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                        c.status === 'rejected'   ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {interview
                        ? `${new Date(interview.scheduled_date).toLocaleDateString()} ${interview.scheduled_time}`
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {emailSent
                        ? <span className="text-xs text-green-600 font-medium">Sent</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interview Schedule */}
      {interviews.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" /> Interview Schedule
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {interviews.map((i) => (
              <div key={i.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-sm font-bold text-purple-600">
                  #{i.ranking}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{i.name}</p>
                  <p className="text-xs text-gray-500">{i.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(i.scheduled_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                  <p className="text-xs text-gray-500">{i.scheduled_time} · {i.duration} min · {i.interview_type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Log */}
      {emailLogs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" /> Email Activity Log
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {emailLogs.slice(0, 10).map((e) => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  e.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {e.status}
                </span>
                <span className="text-sm text-gray-700 flex-1">{e.name} — {e.sent_to}</span>
                <span className="text-xs text-gray-400 capitalize">{e.email_type}</span>
                <span className="text-xs text-gray-400">{new Date(e.sent_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
