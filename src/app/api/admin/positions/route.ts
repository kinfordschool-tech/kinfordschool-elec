import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';

// 1. GET - Fetch all positions
export async function GET(request: Request) {
  try {
    const positions = await query('SELECT * FROM positions ORDER BY order_index ASC');
    return NextResponse.json({ success: true, positions });
  } catch (err) {
    console.error('Error fetching positions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Create a new position
export async function POST(request: Request) {
  try {
    const { name, order_index } = await request.json().catch(() => ({}));

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Position name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    let index = order_index;

    // If order_index is not provided, calculate next available index
    if (index === undefined || index === null) {
      const maxIndexRes = await query('SELECT MAX(order_index) as max_index FROM positions');
      const maxIndex = maxIndexRes[0]?.max_index || 0;
      index = maxIndex + 1;
    }

    const insertRes = await query(
      'INSERT INTO positions (name, order_index) VALUES ($1, $2) RETURNING *',
      [cleanName, index]
    );

    return NextResponse.json({ success: true, position: insertRes[0] });
  } catch (err: any) {
    console.error('Error creating position:', err);
    if (err.code === '23505') { // Unique constraint violation on order_index
      return NextResponse.json({ error: 'Order index must be unique' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 3. PUT - Bulk update order indexes or update single position
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { positions, id, name, order_index } = body;

    // Scenario A: Bulk reorder positions
    if (positions && Array.isArray(positions)) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const pos of positions) {
          await client.query(
            'UPDATE positions SET order_index = $1 WHERE id = $2',
            [pos.order_index, pos.id]
          );
        }
        await client.query('COMMIT');
        return NextResponse.json({ success: true });
      } catch (txErr) {
        await client.query('ROLLBACK');
        console.error('Reorder transaction error:', txErr);
        return NextResponse.json({ error: 'Failed to reorder positions' }, { status: 400 });
      } finally {
        client.release();
      }
    }

    // Scenario B: Update a single position
    if (id && name) {
      const updateRes = await query(
        'UPDATE positions SET name = $1, order_index = COALESCE($2, order_index) WHERE id = $3 RETURNING *',
        [name.trim(), order_index, id]
      );
      if (updateRes.length === 0) {
        return NextResponse.json({ error: 'Position not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, position: updateRes[0] });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err) {
    console.error('Error updating position:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
