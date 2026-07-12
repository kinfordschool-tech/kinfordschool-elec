import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper to upload file to Supabase storage via REST API
async function uploadPhotoToSupabase(file: File): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const bucketName = 'candidate-photos';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key env variable is missing');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${cleanFileName}`;

  const arrayBuffer = await file.arrayBuffer();

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Storage upload failed with status ${res.status}`);
  }

  // Return the public URL to access the photo
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanFileName}`;
}

// 1. GET - Fetch all candidates grouped/joined by position
export async function GET(request: Request) {
  try {
    const candidates = await query(`
      SELECT c.id, c.name, c.class, c.photo_url, c.manifesto, c.vote_count, c.position_id,
             p.name as position_name, p.order_index as position_order
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      ORDER BY p.order_index ASC, c.name ASC
    `);
    return NextResponse.json({ success: true, candidates });
  } catch (err) {
    console.error('Error fetching candidates:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Add a new candidate
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const className = formData.get('class') as string;
    const positionId = formData.get('position_id') as string;
    const manifesto = formData.get('manifesto') as string;
    const photoFile = formData.get('photo') as File | null;

    if (!name || !className || !positionId || !manifesto) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let photoUrl = '';

    // Upload photo to Supabase storage if provided
    if (photoFile && photoFile.size > 0) {
      try {
        photoUrl = await uploadPhotoToSupabase(photoFile);
      } catch (uploadErr: any) {
        console.error('Failed to upload photo:', uploadErr);
        return NextResponse.json({ error: `Photo upload failed: ${uploadErr.message}` }, { status: 500 });
      }
    } else {
      // Fallback placeholder image if no photo is provided
      photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=5B21B6&color=fff`;
    }

    const insertRes = await query(
      `INSERT INTO candidates (name, class, position_id, manifesto, photo_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), className.trim(), positionId, manifesto.trim(), photoUrl]
    );

    return NextResponse.json({ success: true, candidate: insertRes[0] });
  } catch (err) {
    console.error('Error creating candidate:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 3. PUT - Edit an existing candidate
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const className = formData.get('class') as string;
    const positionId = formData.get('position_id') as string;
    const manifesto = formData.get('manifesto') as string;
    const photoFile = formData.get('photo') as File | null;
    let photoUrl = formData.get('photo_url') as string; // Existing photo URL if unchanged

    if (!id || !name || !className || !positionId || !manifesto) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If new photo is provided, upload it
    if (photoFile && photoFile.size > 0) {
      try {
        photoUrl = await uploadPhotoToSupabase(photoFile);
      } catch (uploadErr: any) {
        console.error('Failed to upload new photo:', uploadErr);
        return NextResponse.json({ error: `Photo upload failed: ${uploadErr.message}` }, { status: 500 });
      }
    }

    const updateRes = await query(
      `UPDATE candidates
       SET name = $1, class = $2, position_id = $3, manifesto = $4, photo_url = $5
       WHERE id = $6 RETURNING *`,
      [name.trim(), className.trim(), positionId, manifesto.trim(), photoUrl, id]
    );

    if (updateRes.length === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: updateRes[0] });
  } catch (err) {
    console.error('Error updating candidate:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
