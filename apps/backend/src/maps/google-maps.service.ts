import { env } from '../config/env.js';

function apiKey() {
  if (!env.GOOGLE_MAPS_SERVER_API_KEY) throw new Error('GOOGLE_MAPS_NOT_CONFIGURED');
  return env.GOOGLE_MAPS_SERVER_API_KEY;
}

async function google(path: string, params: Record<string, string>) {
  const url = new URL(`https://maps.googleapis.com/maps/api/${path}`);
  for (const [key, value] of Object.entries({ ...params, key: apiKey() })) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('GOOGLE_MAPS_REQUEST_FAILED');
  const data = await response.json() as any;
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')
    throw new Error(`GOOGLE_MAPS_${data.status}`);
  return data;
}

export async function autocomplete(input: string, sessionToken: string) {
  const data = await google('place/autocomplete/json', {
    input,
    sessiontoken: sessionToken,
    components: 'country:in',
    location: '19.1036,73.0100',
    radius: '30000',
    strictbounds: 'true',
  });
  return data.predictions.map((item: any) => ({
    placeId: item.place_id,
    description: item.description,
    mainText: item.structured_formatting?.main_text,
  }));
}

export async function place(placeId: string, sessionToken: string) {
  const data = await google('place/details/json', {
    place_id: placeId,
    sessiontoken: sessionToken,
    fields: 'formatted_address,geometry,address_component',
  });
  return {
    address: data.result.formatted_address,
    latitude: data.result.geometry.location.lat,
    longitude: data.result.geometry.location.lng,
    components: data.result.address_components,
  };
}

export async function eta(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) {
  const data = await google('distancematrix/json', {
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${destination.lat},${destination.lng}`,
    mode: 'driving',
    departure_time: 'now',
  });
  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK') return null;
  const duration = element.duration_in_traffic ?? element.duration;
  return {
    distanceMeters: element.distance.value,
    distanceText: element.distance.text,
    durationSeconds: duration.value,
    durationText: duration.text,
  };
}
