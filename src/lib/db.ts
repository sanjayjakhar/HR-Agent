import dns from 'dns';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WSDefault from 'ws';
import type { ClientOptions } from 'ws';

// Custom DNS resolver using Google DNS to bypass router's block on *.neon.tech
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);

// Node.js 22+ lookup callback expects array format: cb(err, [{address, family}])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function googleLookup(hostname: string, opts: dns.LookupOptions, cb: any): void {
  resolver.resolve4(hostname, (err, addrs) => {
    if (err || !addrs?.length) {
      dns.lookup(hostname, opts, cb);
      return;
    }
    cb(null, [{ address: addrs[0], family: 4 }]);
  });
}

// Subclass ws to inject our lookup — cleaner than overriding global dns.lookup
class NeonWS extends WSDefault {
  constructor(address: string | URL, protocols?: string | string[], options?: ClientOptions) {
    super(address, protocols as string[], { ...(options ?? {}), lookup: googleLookup } as ClientOptions);
  }
}

neonConfig.webSocketConstructor = NeonWS;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Tagged template literal — same API as neon()
async function sql<T extends object = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  let text = '';
  strings.forEach((s, i) => {
    text += s;
    if (i < values.length) text += `$${i + 1}`;
  });
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, values);
    return result.rows;
  } finally {
    client.release();
  }
}

export default sql;

export async function resetDB() {
  await sql`DROP TABLE IF EXISTS email_logs CASCADE`;
  await sql`DROP TABLE IF EXISTS interviews CASCADE`;
  await sql`DROP TABLE IF EXISTS candidates CASCADE`;
  await sql`DROP TABLE IF EXISTS job_descriptions CASCADE`;
  await initDB();
}

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS job_descriptions (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT DEFAULT '',
      experience_required VARCHAR(100) DEFAULT '',
      skills_required TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES job_descriptions(id) ON DELETE CASCADE,
      name VARCHAR(255) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      resume_text TEXT DEFAULT '',
      score INTEGER DEFAULT 0,
      skills TEXT DEFAULT '[]',
      experience VARCHAR(200) DEFAULT '',
      education TEXT DEFAULT '',
      ranking INTEGER,
      strengths TEXT DEFAULT '[]',
      weaknesses TEXT DEFAULT '[]',
      fit_reason TEXT DEFAULT '',
      best_fit_role VARCHAR(300) DEFAULT '',
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS interviews (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES job_descriptions(id) ON DELETE CASCADE,
      scheduled_date DATE,
      scheduled_time TIME,
      duration INTEGER DEFAULT 60,
      interview_type VARCHAR(50) DEFAULT 'online',
      meeting_link VARCHAR(500) DEFAULT '',
      status VARCHAR(50) DEFAULT 'scheduled',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS email_logs (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES job_descriptions(id) ON DELETE CASCADE,
      email_type VARCHAR(50) DEFAULT '',
      sent_to VARCHAR(255) DEFAULT '',
      subject VARCHAR(500) DEFAULT '',
      body TEXT DEFAULT '',
      status VARCHAR(50) DEFAULT 'sent',
      sent_at TIMESTAMP DEFAULT NOW()
    )
  `;
}
