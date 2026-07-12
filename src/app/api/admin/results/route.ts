import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Live Results Query - Candidates joined with position, sorted by position order then votes DESC
    const candidateResults = await query(`
      SELECT c.id, c.name, c.class, c.photo_url, c.vote_count, c.position_id,
             p.name as position_name, p.order_index as position_order
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      ORDER BY p.order_index ASC, c.vote_count DESC, c.name ASC
    `);

    // Group candidates by position
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

    // 2. Turnout Queries (STRICTLY separate query path, no joins or links with votes)
    const turnoutList = await query(`
      SELECT name, class, has_voted 
      FROM voters 
      ORDER BY class ASC, name ASC
    `);

    // 3. Overall stats
    const statsRes = await query(`
      SELECT 
        COUNT(*) as total_voters,
        SUM(CASE WHEN has_voted THEN 1 ELSE 0 END) as voted_voters
      FROM voters
    `);

    const stats = {
      totalVoters: parseInt(statsRes[0]?.total_voters || '0', 10),
      votedCount: parseInt(statsRes[0]?.voted_voters || '0', 10),
    };

    const turnoutPercentage = stats.totalVoters > 0 
      ? Math.round((stats.votedCount / stats.totalVoters) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      results,
      turnout: turnoutList,
      stats: {
        ...stats,
        turnoutPercentage
      }
    });
  } catch (err) {
    console.error('Error fetching results and turnout:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
