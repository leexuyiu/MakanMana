import { Restaurant } from '../types/restaurant';
import { CURATED_RESTAURANTS } from '../data/ssRestaurants';

const SEARCH_CACHE_KEY = 'dynamic_google_places_cache';

export type MaxResultOption = 20 | 50 | 70 | 100;

export async function searchDynamicRestaurants(
  query = 'restaurants in Subang Jaya SS15 SS14 SS16 SS18',
  maxResultCount: MaxResultOption = 20
): Promise<Restaurant[]> {
  const validCounts: MaxResultOption[] = [20, 50, 70, 100];
  const count = validCounts.includes(maxResultCount) ? maxResultCount : 20;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    console.warn('No VITE_GOOGLE_MAPS_API_KEY provided. Returning curated fallback dataset.');
    return CURATED_RESTAURANTS;
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.priceLevel,places.primaryType,places.editorialSummary,places.regularOpeningHours',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: count,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Places Search API error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
      console.warn('No dynamic places returned from Google Places API, falling back to curated dataset.');
      return CURATED_RESTAURANTS;
    }

    const dynamicRestaurants: Restaurant[] = data.places.map((place: any, index: number) => {
      const name = place.displayName?.text || 'Subang Dining Spot';
      const address = place.formattedAddress || 'Subang Jaya, Selangor';
      
      // Determine area based on address or name
      let area: 'SS15' | 'SS14' | 'SS16' | 'SS18' = 'SS15';
      const lowerAddr = (address + ' ' + name).toLowerCase();
      if (lowerAddr.includes('ss14')) area = 'SS14';
      else if (lowerAddr.includes('ss16')) area = 'SS16';
      else if (lowerAddr.includes('ss18')) area = 'SS18';
      else if (lowerAddr.includes('ss15')) area = 'SS15';

      return {
        id: `dynamic-${place.id || index}`,
        name,
        area,
        cuisine: place.primaryType ? place.primaryType.replace(/_/g, ' ') : 'Local Cuisine',
        cuisineCategory: 'chinese', // default or inferred
        restaurantType: 'Restaurant',
        dietary: {
          isHalal: false,
          isPorkFree: true,
          isVegetarian: false,
        },
        priceRange: place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' || place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE' ? '$$' : '$',
        priceEstimate: 'RM 12 - 25',
        rating: place.rating || 4.3,
        reviewCount: place.userRatingCount || 500,
        reviewSummary: place.editorialSummary?.text || 'Discovered dynamically via Google Maps Places API.',
        address,
        placeId: place.id,
        googleMapsUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + area + ' Subang Jaya')}`,
        lat: place.location?.latitude || 3.074,
        lng: place.location?.longitude || 101.586,
        isLateNight: true,
        isStudentBudget: true,
        hasAirCon: true,
        openingHours: place.regularOpeningHours?.weekdayDescriptions?.[0] || '11:00 AM – 10:00 PM (Daily)',
        lrtProximity: `Nearby ${area} LRT Station`,
        signatureDishes: ['Local House Special', 'Signature Dish'],
        photos: {},
        menuHighlights: [
          { item: 'Signature Dish', price: 'RM 15.00', tag: 'Must-Try' },
        ],
      };
    });

    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(dynamicRestaurants));
    return dynamicRestaurants;
  } catch (error) {
    console.warn('Failed to fetch dynamic restaurants from Google Places API, using fallback cache or dataset:', error);
    const cached = localStorage.getItem(SEARCH_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return CURATED_RESTAURANTS;
  }
}
