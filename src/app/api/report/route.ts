import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    const [job] = await sql`SELECT * FROM job_descriptions WHERE id = ${parseInt(jobId)}`;
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const candidates = await sql`
      SELECT * FROM candidates
      WHERE job_id = ${parseInt(jobId)}
      ORDER BY ranking ASC NULLS LAST, score DESC
    `;

    const interviews = await sql`
      SELECT i.*, c.name, c.email, c.score, c.ranking
      FROM interviews i
      JOIN candidates c ON c.id = i.candidate_id
      WHERE i.job_id = ${parseInt(jobId)}
      ORDER BY i.scheduled_date ASC, i.scheduled_time ASC
    `;

    const emailLogs = await sql`
      SELECT el.*, c.name
      FROM email_logs el
      JOIN candidates c ON c.id = el.candidate_id
      WHERE el.job_id = ${parseInt(jobId)}
      ORDER BY el.sent_at DESC
    `;

    const total = candidates.length;
    const analyzed = candidates.filter((c: Record<string, unknown>) => c.status !== 'pending').length;
    const shortlisted = candidates.filter((c: Record<string, unknown>) => c.status === 'shortlisted').length;
    const avgScore =
      total > 0
        ? Math.round(candidates.reduce((sum: number, c: Record<string, unknown>) => sum + ((c.score as number) || 0), 0) / total)
        : 0;

    return NextResponse.json({
      job,
      candidates,
      interviews,
      emailLogs,
      stats: {
        totalCandidates: total,
        analyzed,
        shortlisted,
        interviewsScheduled: interviews.length,
        emailsSent: emailLogs.filter((e: Record<string, unknown>) => e.status === 'sent').length,
        avgScore,
      },
    });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
