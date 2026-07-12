import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSessionToken } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limit Check (5 requests per minute)
    const ip = getClientIp(request.headers);
    const isAllowed = checkRateLimit(ip, 5, 60 * 1000);
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait 1 minute and try again.' },
        { status: 429 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { accessCode } = body;

    if (!accessCode || typeof accessCode !== 'string' || !accessCode.trim()) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    const cleanCode = accessCode.trim();

    // 3. Query the database for the voter
    const voters = await query(
      'SELECT id, name, class, has_voted FROM voters WHERE access_code = $1',
      [cleanCode]
    );

    if (voters.length === 0) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 400 }
      );
    }

    const voter = voters[0];

    // 4. Check if they have already voted
    if (voter.has_voted) {
      return NextResponse.json(
        { error: "You've already voted" },
        { status: 400 }
      );
    }

    // 5. Create short-lived voter session (30 minutes)
    const sessionPayload = {
      voterId: voter.id,
      name: voter.name,
      class: voter.class,
      accessCode: cleanCode
    };

    const token = await createSessionToken(sessionPayload, 1800); // 30 mins

    // 6. Return response with session cookie set
    const response = NextResponse.json({
      success: true,
      voter: {
        name: voter.name,
        class: voter.class
      }
    });

    response.cookies.set('voter_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1800 // 30 minutes
    });

    return response;
  } catch (err) {
    console.error('Error verifying access code:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
