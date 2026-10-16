/**
 * Utility to generate Google Maps Place URLs in the canonical Google Place ID format:
 * https://www.google.com/maps/place/?q=place_id:{place_id}
 *
 * If placeId is provided, this creates an immutable, official Google Maps link
 * that immediately opens the exact place details card without redirects, 404s, or coordinate stripping.
 *
 * If placeId is not yet available (e.g. newly created custom spots), it safely falls back
 * to Google Maps Universal Search API (https://www.google.com/maps/search/?api=1&query=...),
 * which is 100% resilient across mobile and web.
 */
export const getGoogleMapsPlaceUrl = (restaurant: {
  placeId?: string;
  googleMapsUrl?: string;
  name: string;
  area: string;
  address?: string;
  lat: number;
  lng: number;
}): string => {
  // 1. If explicit placeId is provided, use the official Google Maps Place ID format
  if (restaurant.placeId && restaurant.placeId.trim().length > 0) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(restaurant.placeId.trim())}`;
  }

  // 2. If existing googleMapsUrl is already an official place_id URL, preserve it
  if (
    restaurant.googleMapsUrl &&
    restaurant.googleMapsUrl.includes('place_id:')
  ) {
    return restaurant.googleMapsUrl.trim();
  }

  // 3. If existing googleMapsUrl is a verified exact Google Maps listing URL, preserve it
  if (
    restaurant.googleMapsUrl &&
    restaurant.googleMapsUrl.includes('/maps/place/') &&
    restaurant.googleMapsUrl.includes('data=!')
  ) {
    return restaurant.googleMapsUrl.trim();
  }

  // 4. Guaranteed reliable fallback using official Google Maps Universal Search API
  const query = encodeURIComponent(
    `${restaurant.name} ${restaurant.area} Subang Jaya`.trim()
  ).replace(/%20/g, '+');

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};
