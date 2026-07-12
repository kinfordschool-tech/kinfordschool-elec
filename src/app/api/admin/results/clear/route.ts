import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST - Clears all voting results and resets voters' participation flags.
 * Operates in a single database transaction to ensure complete rollback on failure.
 * This is protected by the admin proxy middleware.
 */
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete all records from the votes table
    await client.query('DELETE FROM votes');

    // 2. Reset vote count back to zero for all candidates
    await client.query('UPDATE candidates SET vote_count = 0');

    // 3. Mark all voters as not participated (has_voted = false)
    await client.query('UPDATE voters SET has_voted = FALSE');

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'All voting logs have been cleared and voter statuses reset successfully.'
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error resetting election results:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to clear voting data' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
