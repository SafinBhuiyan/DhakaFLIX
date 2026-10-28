import { NextResponse } from 'next/server';

const SUPABASE_URL = "https://yzwdwtpkuoxteoamygwi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d2R3dHBrdW94dGVvYW15Z3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDE3MTAsImV4cCI6MjA3ODM3NzcxMH0.HMzC5FLN0P14Q2Ip5TnafpJYMOnJwqrK2ClqznkuE4M";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/activities?action_type=eq.dhakaflix_relay_heartbeat&select=details,created_at&order=created_at.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: 'no-store',
      }
    );
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.details?.relay_url) {
      return NextResponse.json({
        ok: true,
        relayUrl: rows[0].details.relay_url,
        updatedAt: rows[0].created_at,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        }
      });
    }
  } catch (err: any) {
    console.error('Failed to query active relay:', err.message);
  }

  return NextResponse.json({
    ok: false,
    relayUrl: process.env.NEXT_PUBLIC_HELPER_RELAY_URL || '',
  });
}
