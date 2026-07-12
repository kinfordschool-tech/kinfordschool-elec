import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/session';
import { query } from '@/lib/db';
import BallotFlowClient from './BallotFlowClient';

export const dynamic = 'force-dynamic';

export default async function BallotPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('voter_session')?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    redirect('/vote');
  }

  // Fetch all positions ordered by order_index
  const positions = await query('SELECT * FROM positions ORDER BY order_index ASC');

  // Fetch all candidates
  const candidates = await query(`
    SELECT id, name, class, photo_url, manifesto, position_id
    FROM candidates
    ORDER BY name ASC
  `);

  return (
    <BallotFlowClient
      initialPositions={positions}
      initialCandidates={candidates}
      voterName={session.name}
      voterClass={session.class}
    />
  );
}
