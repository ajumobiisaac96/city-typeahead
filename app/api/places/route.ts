import { NextResponse } from 'next/server';
import type { Place } from '@/lib/types';

type GeocodingResult = {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

const UPSTREAM = 'https://geocoding-api.open-meteo.com/v1/search';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const upstreamUrl = `${UPSTREAM}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;

  try {
    // Cached so repeated searches for the same place never reach the upstream API.
    const response = await fetch(upstreamUrl, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`Upstream responded with ${response.status}`);

    const data = (await response.json()) as { results?: GeocodingResult[] };

    const results: Place[] = (data.results ?? []).map((result) => ({
      id: result.id,
      name: result.name,
      country: result.country ?? 'Unknown',
      admin: result.admin1 ?? null,
      latitude: result.latitude,
      longitude: result.longitude,
    }));

    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch {
    return NextResponse.json({ error: 'Place lookup is unavailable' }, { status: 502 });
  }
}
