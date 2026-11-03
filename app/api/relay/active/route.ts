import { NextResponse } from 'next/server';

const PERMANENT_HOMELAB_URL = "https://homelab-1.tail4054ff.ts.net";
const SUPABASE_URL = "https://yzwdwtpkuoxteoamygwi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d2R3dHBrdW94dGVvYW15Z3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDE3MTAsImV4cCI6MjA3ODM3NzcxMH0.HMzC5FLN0P14Q2Ip5TnafpJYMOnJwqrK2ClqznkuE4M";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };

  // 1. Primary: Direct live query to the Homelab server's permanent domain
  try {
    const homelabRes = await fetch(`${PERMANENT_HOMELAB_URL}/active-relay`, {
      signal: AbortSignal.timeout(4500),
      cache: 'no-store',
    });
    if (homelabRes.ok) {
      const data = await homelabRes.json();
      if (data && data.ok && typeof data.relayUrl === 'string' && data.relayUrl) {
        return NextResponse.json({
          ok: true,
          relayUrl: data.relayUrl.trim().replace(/\/+$/, ''),
          permanentUrl: PERMANENT_HOMELAB_URL,
          updatedAt: data.updatedAt || new Date().toISOString(),
          source: 'homelab-direct',
        }, { headers });
      }
    }
  } catch (err: any) {
    console.warn('[Relay Active API] Homelab direct query warning:', err.message);
  }

  // 2. Secondary fallback: Check Supabase activities heartbeat if homelab was slow
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/activities?action_type=eq.dhakaflix_relay_heartbeat&select=details,created_at&order=created_at.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.details?.relay_url) {
        return NextResponse.json({
          ok: true,
          relayUrl: rows[0].details.relay_url,
          updatedAt: rows[0].created_at,
          source: 'supabase-fallback',
        }, { headers });
      }
    }
  } catch (err: any) {
    console.warn('[Relay Active API] Supabase query warning:', err.message);
  }

  // 3. Fallback: Return permanent homelab URL or env URL
  const fallbackUrl = (process.env.NEXT_PUBLIC_HELPER_RELAY_URL || PERMANENT_HOMELAB_URL).trim().replace(/\/+$/, '');
  return NextResponse.json({
    ok: false,
    relayUrl: fallbackUrl,
    permanentUrl: PERMANENT_HOMELAB_URL,
    source: 'fallback',
  }, { headers });
}
