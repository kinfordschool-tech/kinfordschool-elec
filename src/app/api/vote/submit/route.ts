import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifySessionToken } from '@/lib/session';

interface VoteSelection {
  positionId: string;
  candidateId: string;
}

export async function POST(request: NextRequest) {
  // 1. Get and verify the voter session cookie
  const voterCookie = request.cookies.get('voter_session')?.value;
  const session = await verifySessionToken(voterCookie);

  if (!session || !session.voterId) {
    return NextResponse.json(
      { error: 'Unauthorized: Session missing or expired' },
      { status: 401 }
    );
  }

  const { voterId } = session;

  try {
    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { votes } = body as { votes: VoteSelection[] };

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ballot submission: No votes provided' },
        { status: 400 }
      );
    }

    // 3. Connect to client and perform SQL transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check has_voted status with row lock (FOR UPDATE) to prevent race conditions
      const voterRes = await client.query(
        'SELECT has_voted FROM voters WHERE id = $1 FOR UPDATE',
        [voterId]
      );

      if (voterRes.rows.length === 0) {
        throw new Error('Voter not found');
      }

      if (voterRes.rows[0].has_voted) {
        throw new Error('Voter has already voted');
      }

      // Update voter status
      await client.query(
        'UPDATE voters SET has_voted = TRUE WHERE id = $1',
        [voterId]
      );

      // Record votes (anonymous) & increment candidate vote count
      for (const vote of votes) {
        const { positionId, candidateId } = vote;
        
        if (!positionId || !candidateId) {
          throw new Error('Invalid vote payload: missing positionId or candidateId');
        }

        // Insert anonymous vote row
        await client.query(
          'INSERT INTO votes (position_id, candidate_id) VALUES ($1, $2)',
          [positionId, candidateId]
        );

        // Increment candidate vote count
        await client.query(
          'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = $1',
          [candidateId]
        );
      }

      await client.query('COMMIT');
    } catch (txError: any) {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back due to error:', txError.message);
      return NextResponse.json(
        { error: txError.message || 'Failed to submit votes' },
        { status: 400 }
      );
    } finally {
      client.release();
    }

    // 4. Clear the session cookie and return success
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('voter_session', '', {
      path: '/',
      maxAge: 0 // Expire immediately
    });

    return response;
  } catch (err) {
    console.error('Error submitting ballot:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
