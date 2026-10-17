/**
 * Service to fetch official Google Maps place details using the new Places API (New) endpoint:
 * https://places.googleapis.com/v1/places/{placeId}?fields=googleMapsUri
 */

const memoryCache = new Map<string, string>();

export function getCachedPlaceUri(placeId: string): string | null {
  if (!placeId) {
    return null;
  }
  const trimmed = placeId.trim();
  if (memoryCache.has(trimmed)) {
    return memoryCache.get(trimmed)!;
  }
  const storageKey = `place_uri_${trimmed}`;
  const cached = localStorage.getItem(storageKey);
  if (cached) {
    memoryCache.set(trimmed, cached);
    return cached;
  }
  return null;
}

export async function fetchPlaceDetailsNew(placeId: string): Promise<string> {
  if (!placeId) {
    return '';
  }

  const trimmed = placeId.trim();
  const cached = getCachedPlaceUri(trimmed);
  if (cached) {
    return cached;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAkXChckHeELkLefyN4TI4cDf3Pa7Di7AI';
  const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Subang Jaya ' + trimmed)}`;

  if (!apiKey) {
    return fallbackUrl;
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(trimmed)}?fields=googleMapsUri&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'googleMapsUri',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Places API (New) error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    return data;
    console.log(`Places API (New) response for ${trimmed}:`, data);

    const uri = data?.googleMapsUri || data?.googleMapsURL || data?.uri;
    if (uri) {
      memoryCache.set(trimmed, uri);
      localStorage.setItem(`place_uri_${trimmed}`, uri);
      return uri;
    }
  } catch (error) {
    console.warn(`Failed to fetch place details for ${trimmed} from Places API (New), using fallback URL:`, error);
  }

  return fallbackUrl;
}
