import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/session';
import { query } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role !== 'admin') {
    redirect('/admin/login');
  }

  // 1. Fetch positions
  const positions = await query('SELECT * FROM positions ORDER BY order_index ASC');

  // 2. Fetch candidates
  const candidates = await query(`
    SELECT c.id, c.name, c.class, c.photo_url, c.manifesto, c.vote_count, c.position_id,
           p.name as position_name, p.order_index as position_order
    FROM candidates c
    JOIN positions p ON c.position_id = p.id
    ORDER BY p.order_index ASC, c.name ASC
  `);

  // 3. Fetch voters (including access codes)
  const voters = await query('SELECT id, name, class, access_code, has_voted FROM voters ORDER BY name ASC');

  // 4. Fetch results
  const candidateResults = await query(`
    SELECT c.id, c.name, c.class, c.photo_url, c.vote_count, c.position_id,
           p.name as position_name, p.order_index as position_order
    FROM candidates c
    JOIN positions p ON c.position_id = p.id
    ORDER BY p.order_index ASC, c.vote_count DESC, c.name ASC
  `);

  // Group candidate results by position
  const positionsMap: { [key: string]: { id: string; name: string; order_index: number; candidates: any[] } } = {};
  candidateResults.forEach((row) => {
    const { position_id, position_name, position_order, ...candidate } = row;
    if (!positionsMap[position_id]) {
      positionsMap[position_id] = {
        id: position_id,
        name: position_name,
        order_index: position_order,
        candidates: []
      };
    }
    positionsMap[position_id].candidates.push(candidate);
  });
  const results = Object.values(positionsMap).sort((a, b) => a.order_index - b.order_index);

  // 5. Fetch turnout & stats (decoupled query path)
  const turnout = await query('SELECT name, class, has_voted FROM voters ORDER BY class ASC, name ASC');
  
  const statsRes = await query(`
    SELECT 
      COUNT(*) as total_voters,
      SUM(CASE WHEN has_voted THEN 1 ELSE 0 END) as voted_voters
    FROM voters
  `);
  
  const stats = {
    totalVoters: parseInt(statsRes[0]?.total_voters || '0', 10),
    votedCount: parseInt(statsRes[0]?.voted_voters || '0', 10),
    turnoutPercentage: 0,
  };
  
  stats.turnoutPercentage = stats.totalVoters > 0 
    ? Math.round((stats.votedCount / stats.totalVoters) * 100)
    : 0;

  return (
    <AdminDashboardClient
      initialPositions={positions}
      initialCandidates={candidates}
      initialVoters={voters}
      initialResults={results}
      initialTurnout={turnout}
      initialStats={stats}
    />
  );
}
