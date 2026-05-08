export interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  experience_required: string;
  skills_required: string;
  created_at: string;
}

export interface Candidate {
  id: number;
  job_id: number;
  name: string;
  email: string;
  phone: string;
  resume_text: string;
  score: number;
  skills: string;
  experience: string;
  education: string;
  ranking: number;
  strengths: string;
  weaknesses: string;
  fit_reason: string;
  best_fit_role: string;
  status: 'pending' | 'analyzed' | 'shortlisted' | 'rejected';
  created_at: string;
  // joined fields
  scheduled_date?: string;
  scheduled_time?: string;
  meeting_link?: string;
  interview_status?: string;
  email_count?: number;
}

export interface Interview {
  id: number;
  candidate_id: number;
  job_id: number;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  interview_type: string;
  meeting_link: string;
  status: string;
  notes: string;
  created_at: string;
  name?: string;
  email?: string;
  score?: number;
  ranking?: number;
}

export interface EmailLog {
  id: number;
  candidate_id: number;
  job_id: number;
  email_type: string;
  sent_to: string;
  subject: string;
  status: string;
  sent_at: string;
  name?: string;
}

export interface Report {
  job: Job;
  candidates: Candidate[];
  interviews: Interview[];
  emailLogs: EmailLog[];
  stats: {
    totalCandidates: number;
    analyzed: number;
    shortlisted: number;
    interviewsScheduled: number;
    emailsSent: number;
    avgScore: number;
  };
}
