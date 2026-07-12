import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';

// Helper to generate a unique readable access code (e.g. KF-B7R9X)
function generateAccessCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude 0, 1, O, I, L to avoid typos
  let code = 'KF-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Ensure the generated code is unique
async function getUniqueAccessCode(clientPoolOrQuery: any): Promise<string> {
  let code = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    code = generateAccessCode();
    // Query database to check if code exists
    const checkRes = await clientPoolOrQuery('SELECT id FROM voters WHERE access_code = $1', [code]);
    if (checkRes.length === 0) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate a unique access code after multiple attempts');
  }

  return code;
}

// 1. GET - Fetch all voters
export async function GET(request: Request) {
  try {
    const voters = await query('SELECT id, name, class, access_code, has_voted FROM voters ORDER BY name ASC');
    return NextResponse.json({ success: true, voters });
  } catch (err) {
    console.error('Error fetching voters:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Add voter(s) (Single or Bulk)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, bulkText } = body;

    // SCENARIO A: Bulk Add via textarea (One student name per line)
    if (bulkText && typeof bulkText === 'string') {
      const lines = bulkText.split('\n');
      const addedVoters: any[] = [];
      const errors: string[] = [];

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        for (let i = 0; i < lines.length; i++) {
          const studentName = lines[i].trim();
          if (!studentName) continue;

          // Generate unique access code
          // Note: we query the client inside transaction to ensure concurrency safety
          const checkFunc = async (sql: string, params: any[]) => {
            const res = await client.query(sql, params);
            return res.rows;
          };
          const uniqueCode = await getUniqueAccessCode(checkFunc);

          // We pass an empty string for the class field to keep the schema happy
          const insertRes = await client.query(
            "INSERT INTO voters (name, class, access_code, has_voted) VALUES ($1, '', $2, FALSE) RETURNING *",
            [studentName, uniqueCode]
          );
          
          addedVoters.push(insertRes.rows[0]);
        }

        await client.query('COMMIT');
      } catch (txErr: any) {
        await client.query('ROLLBACK');
        console.error('Bulk insert transaction rolled back:', txErr);
        return NextResponse.json({ error: `Transaction failed: ${txErr.message}` }, { status: 500 });
      } finally {
        client.release();
      }

      return NextResponse.json({
        success: true,
        count: addedVoters.length,
        voters: addedVoters,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    // SCENARIO B: Single Add
    if (name) {
      // Find a unique access code
      const uniqueCode = await getUniqueAccessCode(query);

      // We pass an empty string for the class field
      const insertRes = await query(
        "INSERT INTO voters (name, class, access_code, has_voted) VALUES ($1, '', $2, FALSE) RETURNING *",
        [name.trim(), uniqueCode]
      );

      return NextResponse.json({ success: true, voter: insertRes[0] });
    }

    return NextResponse.json({ error: 'Missing student name' }, { status: 400 });
  } catch (err) {
    console.error('Error adding voter:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
