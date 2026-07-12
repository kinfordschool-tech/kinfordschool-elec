import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Position ID is required' }, { status: 400 });
    }

    const deleteRes = await query('DELETE FROM positions WHERE id = $1 RETURNING *', [id]);

    if (deleteRes.length === 0) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Position deleted successfully' });
  } catch (err) {
    console.error('Error deleting position:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
