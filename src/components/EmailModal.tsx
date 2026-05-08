'use client';
import { useState } from 'react';
import { Mail, X, Loader2, Send, Calendar, Clock, Link } from 'lucide-react';
import toast from 'react-hot-toast';
import { Candidate } from '@/types';

interface Props {
  candidates: Candidate[];
  jobId: number;
  onClose: () => void;
  onSent: () => void;
}

const EMAIL_TYPES = [
  { value: 'interview', label: 'Interview Invitation', desc: 'Send interview schedule details' },
  { value: 'shortlist', label: 'Shortlist Notification', desc: 'Notify candidate of shortlisting' },
  { value: 'custom', label: 'Custom Message', desc: 'Write your own message' },
];

export default function EmailModal({ candidates, jobId, onClose, onSent }: Props) {
  const [emailType, setEmailType] = useState('interview');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [interviewLink, setInterviewLink] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (emailType === 'custom' && !customMessage.trim()) {
      return toast.error('Please write a message');
    }
    if (emailType === 'interview' && !interviewDate) {
      return toast.error('Please select an interview date');
    }

    const withEmail = candidates.filter((c) => c.email);
    if (!withEmail.length) {
      return toast.error('None of the selected candidates have email addresses');
    }

    if (!withEmail.length && candidates.length) {
      toast.error(`${candidates.length - withEmail.length} candidates have no email — skipping`);
    }

    setSending(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: candidates.map((c) => c.id),
          jobId,
          emailType,
          customSubject,
          customMessage,
          interviewDate,
          interviewTime,
          interviewLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${data.sent}/${data.total} emails sent successfully`);
      onSent();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Send Emails</h2>
              <p className="text-sm text-gray-500">To {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Recipient List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recipients</h3>
            <div className="max-h-28 overflow-y-auto space-y-1.5">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800">{c.name || 'Unknown'}</span>
                  {c.email ? (
                    <span className="text-gray-500">— {c.email}</span>
                  ) : (
                    <span className="text-red-400 text-xs">No email</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email Type */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Email Type</h3>
            <div className="space-y-2">
              {EMAIL_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    emailType === t.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="emailType"
                    value={t.value}
                    checked={emailType === t.value}
                    onChange={() => setEmailType(t.value)}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Interview Date/Time Picker (shown for interview type) */}
          {emailType === 'interview' && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-purple-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Interview Schedule
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Time *</label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3" /> Meeting Link (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/... or Zoom link"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                />
              </div>
            </div>
          )}

          {/* Custom Message */}
          {emailType === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="Email subject..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                  placeholder="Write your message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending...' : 'Send Emails'}
          </button>
        </div>
      </div>
    </div>
  );
}
