import { fetchPlaceDetailsNew } from '../services/placesApiService';

/**
 * Utility to generate Google Maps Place URLs using the Places API (New) endpoint (fetchPlaceDetailsNew):
 * 
 * If placeId is provided, this calls fetchPlaceDetailsNew to retrieve the official googleMapsUri.
 */
export const getGoogleMapsPlaceUrl = (restaurant: {
  placeId?: string;
  googleMapsUrl?: string;
  name: string;
  area: string;
  address?: string;
  lat: number;
  lng: number;
}): Promise<string> | string => {
  // 1. If explicit placeId is provided, call fetchPlaceDetailsNew to get the googleMapsUri
  if (restaurant.placeId && restaurant.placeId.trim().length > 0) {
    const trimmed = restaurant.placeId.trim();
    return fetchPlaceDetailsNew(trimmed);
  }

  // 2. If existing googleMapsUrl is already an official place_id URL (excluding old ?q=place_id format), preserve it
  if (
    restaurant.googleMapsUrl &&
    restaurant.googleMapsUrl.includes('place_id:') &&
    !restaurant.googleMapsUrl.includes('/maps/place/?q=place_id:')
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
