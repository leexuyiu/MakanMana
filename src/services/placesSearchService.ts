import { Restaurant, CuisineCategory, RestaurantType, PriceTier, FilterState } from '../types/restaurant';
import { CURATED_RESTAURANTS } from '../data/ssRestaurants';

export const CURATED_CACHE_KEY = 'makanmana_curated_dataset_v5';

export type MaxResultOption = 20 | 50 | 70 | 100;

export function getCuratedDataset(): Restaurant[] {
  // Purge any stale cache keys from previous versions
  const legacyKeys = [
    'makanmana_curated_dataset_cache',
    'makanmana_curated_dataset_v2',
    'makanmana_curated_dataset_v3',
    'makanmana_curated_dataset_v4',
    'dynamic_google_places_cache',
    'dynamic_google_places_cache_20',
    'dynamic_google_places_cache_50',
    'dynamic_google_places_cache_70',
    'dynamic_google_places_cache_100',
  ];
  for (const k of legacyKeys) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }

  try {
    const cached = localStorage.getItem(CURATED_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Validate that cached items have genuine googleMapsUrl and are not legacy search query URLs
      const isValid =
        Array.isArray(parsed) &&
        parsed.length >= 20 &&
        parsed.every((r) => r.id && !r.googleMapsUrl?.includes('/maps/search/'));

      if (isValid) {
        return parsed;
      }
      localStorage.removeItem(CURATED_CACHE_KEY);
    }
  } catch (e) {
    console.warn('Failed to parse cached curated dataset, re-initializing from baseline.');
  }

  // Initialize cache with default pre-populated 100 genuine places
  try {
    localStorage.setItem(CURATED_CACHE_KEY, JSON.stringify(CURATED_RESTAURANTS));
  } catch {
    // Ignore storage quota
  }
  return CURATED_RESTAURANTS;
}

export function hasDatasetChanged(existing: Restaurant[], fresh: Restaurant[]): boolean {
  if (existing.length !== fresh.length) return true;
  for (let i = 0; i < existing.length; i++) {
    const e = existing[i];
    const f = fresh[i];
    if (e.id !== f.id || e.rating !== f.rating || e.name !== f.name || e.googleMapsUrl !== f.googleMapsUrl) {
      return true;
    }
  }
  return false;
}

export function buildPlacesQuery(filters?: Partial<FilterState>): string {
  if (!filters) {
    return 'popular restaurants, cafes, and food stalls in Subang Jaya SS15 SS14 SS16 SS18';
  }

  const parts: string[] = [];

  // Dietary
  if (filters.dietary?.halal) {
    parts.push('halal');
  } else if (filters.dietary?.vegetarian) {
    parts.push('vegetarian');
  }

  // Cuisines
  if (filters.cuisineCategories && filters.cuisineCategories.length > 0) {
    const cuisineNames = filters.cuisineCategories.map((c) => {
      if (c === 'mamak') return 'mamak';
      if (c === 'dessert') return 'cafe dessert boba';
      if (c === 'middle_eastern') return 'middle eastern';
      return c;
    });
    parts.push(cuisineNames.join(' '));
  }

  // Restaurant Types
  if (filters.restaurantTypes && filters.restaurantTypes.length > 0) {
    parts.push(filters.restaurantTypes.join(' '));
  } else {
    parts.push('food restaurants cafes');
  }

  // Late night
  if (filters.lateNightOnly) {
    parts.push('late night supper');
  }

  // Areas
  if (filters.areas && filters.areas.length > 0) {
    parts.push(`in ${filters.areas.join(' ')} Subang Jaya`);
  } else {
    parts.push('in Subang Jaya SS15 SS14 SS16 SS18');
  }

  return parts.join(' ').trim();
}

function inferCuisineCategory(name: string, types: string[], primaryType: string, _address: string): CuisineCategory {
  // Avoid checking address text to prevent false positives from shopping mall names or road names
  const combined = `${name} ${primaryType} ${types.join(' ')}`.toLowerCase();

  // Asian Fusion (JIBRIL, modern fusion bistros)
  if (
    types.some((t) => t.includes('asian') || t.includes('fusion')) ||
    /\b(asian fusion|fusion|butter chicken|mocktail|modern asian)\b/i.test(combined)
  ) {
    return 'asian_fusion';
  }

  // Strict word-boundary matching for Japanese dining
  if (
    types.some((t) => t.includes('japanese') || t.includes('sushi') || t.includes('ramen')) ||
    /\b(japanese|sushi|ramen|udon|donburi|izakaya|teppanyaki|bento|matcha|yakitori|tonkatsu|gyudon|unagi|tempura|soba|sashimi|omakase)\b/i.test(combined)
  ) {
    return 'japanese';
  }

  if (
    types.some((t) => t.includes('korean')) ||
    /\b(korean|bbq|kimchi|k-food|tteokbokki|bibimbap|dakgalbi|chimaek|bulgogi|gimbap)\b/i.test(combined)
  ) {
    return 'korean';
  }

  if (
    types.some((t) => t.includes('indian')) ||
    /\b(banana leaf|curry house|thali|tandoori|briyani|roti canai|chettinad|naan)\b/i.test(combined)
  ) {
    return 'indian';
  }

  if (/\b(mamak|nasi kandar|pelita|subang corner|restoran bistari|syed|thaqwa|deen)\b/i.test(combined)) {
    return 'mamak';
  }

  if (
    types.some((t) => t.includes('malaysian') || t.includes('indonesian')) ||
    /\b(nasi lemak|ayam goreng berempah|satay|sambal|rendang|padang|warung|kampung|pantai timur)\b/i.test(combined)
  ) {
    return 'malay';
  }

  if (
    types.some((t) => t.includes('middle_eastern')) ||
    /\b(shawarma|kebab|mandi|falafel|halab|damas|lebanese|arab)\b/i.test(combined)
  ) {
    return 'middle_eastern';
  }

  if (
    types.some((t) => t.includes('american') || t.includes('hamburger') || t.includes('pizza') || t.includes('steak') || t.includes('italian')) ||
    /\b(burger|steak|pasta|grill|western|smokehouse|diner|fish and chips|chop|pizza)\b/i.test(combined)
  ) {
    return 'western';
  }

  if (
    types.some((t) => t.includes('bakery') || t.includes('ice_cream') || t.includes('cafe')) ||
    /\b(boba|bubble tea|dessert|waffle|ice cream|pastry|cake|croissant|gelato|juice|tea|coffee|cafe)\b/i.test(combined)
  ) {
    return 'dessert';
  }

  if (
    types.some((t) => t.includes('chinese')) ||
    /\b(noodle|dim sum|bak kut teh|pork|roast duck|wantan|mee|chee cheong fun|pan mee|claypot|kopitiam)\b/i.test(combined)
  ) {
    return 'chinese';
  }

  return 'chinese';
}

function inferRestaurantType(name: string, types: string[]): Exclude<RestaurantType, 'All'> {
  const combined = `${name} ${types.join(' ')}`.toLowerCase();

  if (/mamak|bistari|pelita|nasi kandar|syed|thaqwa/i.test(combined)) {
    return 'Late Night Mamak';
  }

  if (types.some((t) => t.includes('cafe') || t.includes('coffee') || t.includes('bakery')) ||
      /cafe|coffee|roaster|espresso|brew|matcha|tea/i.test(combined)) {
    return 'Cafe';
  }

  if (/kopitiam|kopi|kedai kopi|toast|hainan/i.test(combined)) {
    return 'Kopitiam';
  }

  if (types.some((t) => t.includes('fast_food')) ||
      /burger|express|fast food|takeaway/i.test(combined)) {
    return 'Fast Casual';
  }

  if (types.some((t) => t.includes('food_court')) ||
      /food court|hawker|stall|centre|medan selera/i.test(combined)) {
    return 'Hawker Centre';
  }

  return 'Restaurant';
}

function inferDietary(name: string, types: string[], cuisine: CuisineCategory, isHalalQuery = false) {
  const combined = `${name} ${types.join(' ')}`.toLowerCase();

  const isVegetarian =
    types.some((t) => t.includes('vegetarian') || t.includes('vegan')) ||
    /vegetarian|vegan|sayur/i.test(combined);

  const isHalal =
    isHalalQuery ||
    types.some((t) => t.includes('halal')) ||
    /halal|mamak|pelita|nasi kandar|bistari|syed|warung/i.test(combined) ||
    cuisine === 'mamak' ||
    cuisine === 'middle_eastern' ||
    cuisine === 'malay';

  const isPorkFree =
    isHalal ||
    /pork free|no pork|muslim friendly/i.test(combined) ||
    cuisine === 'indian' ||
    isVegetarian;

  return { isHalal, isPorkFree, isVegetarian };
}

function inferArea(address: string, name: string, lat: number, lng: number): 'SS15' | 'SS14' | 'SS16' | 'SS18' {
  const text = `${address} ${name}`.toUpperCase();

  if (text.includes('SS 14') || text.includes('SS14')) return 'SS14';
  if (text.includes('SS 16') || text.includes('SS16')) return 'SS16';
  if (text.includes('SS 18') || text.includes('SS18')) return 'SS18';
  if (text.includes('SS 15') || text.includes('SS15')) return 'SS15';

  // Geographic fallback within Subang Jaya coordinates
  if (lat > 3.078) return 'SS16';
  if (lat < 3.073 && lng > 101.588) return 'SS14';
  if (lat < 3.073 && lng <= 101.588) return 'SS18';
  return 'SS15';
}

function mapGooglePlaceToRestaurant(place: any, index: number): Restaurant {
  const name = place.displayName?.text || 'Subang Dining Spot';
  const address = place.formattedAddress || 'Subang Jaya, Selangor';
  const types: string[] = Array.isArray(place.types) ? place.types : [];
  const primaryType: string = place.primaryType || '';
  const lat = place.location?.latitude || 3.074;
  const lng = place.location?.longitude || 101.586;

  const area = inferArea(address, name, lat, lng);
  const cuisineCategory = inferCuisineCategory(name, types, primaryType, address);
  const restaurantType = inferRestaurantType(name, types);
  const dietary = inferDietary(name, types, cuisineCategory);

  let priceRange: PriceTier = '$';
  let priceEstimate = 'RM 10 - 18';
  if (place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' || place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') {
    priceRange = '$$$';
    priceEstimate = 'RM 35 - 75';
  } else if (place.priceLevel === 'PRICE_LEVEL_MODERATE') {
    priceRange = '$$';
    priceEstimate = 'RM 18 - 35';
  }

  const openingWeekday = place.regularOpeningHours?.weekdayDescriptions?.[0] || '10:00 AM – 10:00 PM (Daily)';
  const isLateNight =
    restaurantType === 'Late Night Mamak' ||
    /11:00 PM|12:00 AM|1:00 AM|2:00 AM|3:00 AM|4:00 AM|24 hours/i.test(openingWeekday) ||
    /supper|late night/i.test(name);

  const isStudentBudget = priceRange === '$';

  const friendlyCuisine = primaryType
    ? primaryType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : cuisineCategory.charAt(0).toUpperCase() + cuisineCategory.slice(1);

  // Always use official googleMapsUri, fallback strictly empty string
  const googleMapsUrl = place.googleMapsUri || '';

  return {
    id: place.id || `dynamic-${index}`,
    name,
    area,
    cuisine: friendlyCuisine,
    cuisineCategory,
    restaurantType,
    dietary,
    priceRange,
    priceEstimate,
    rating: place.rating || 4.2,
    reviewCount: place.userRatingCount || 200,
    reviewSummary: place.editorialSummary?.text || 'Popular dining spot in Subang Jaya.',
    address,
    placeId: place.id,
    googleMapsUrl,
    lat,
    lng,
    isLateNight,
    isStudentBudget,
    hasAirCon: restaurantType === 'Cafe' || restaurantType === 'Restaurant' || priceRange !== '$',
    openingHours: openingWeekday,
    lrtProximity: `Near ${area} LRT Station`,
    signatureDishes: ['Chef Recommendation', 'House Specialty'],
    photos: {},
    menuHighlights: [{ item: 'House Specialty', price: priceEstimate.split('-')[0].trim(), tag: 'Popular' }],
  };
}

export async function syncFreshPlacesDataset(targetMax = 100): Promise<Restaurant[] | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    return null;
  }

  const query = 'popular restaurants, cafes, and food stalls in Subang Jaya SS15 SS14 SS16 SS18';
  const collectedPlaces: any[] = [];
  let pageToken: string | undefined = undefined;
  const maxPages = Math.ceil(targetMax / 20);

  try {
    for (let page = 0; page < maxPages && collectedPlaces.length < targetMax; page++) {
      const bodyPayload: any = {
        textQuery: query,
        maxResultCount: 20,
      };
      if (pageToken) {
        bodyPayload.pageToken = pageToken;
      }

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.priceLevel,places.primaryType,places.types,places.editorialSummary,places.regularOpeningHours,nextPageToken',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        break;
      }

      const data = await response.json();
      if (!data.places || !Array.isArray(data.places) || data.places.length === 0) {
        break;
      }

      collectedPlaces.push(...data.places);
      pageToken = data.nextPageToken;
      if (!pageToken) {
        break;
      }
    }

    if (collectedPlaces.length === 0) {
      return null;
    }

    const freshRestaurants: Restaurant[] = collectedPlaces.map((p, idx) => mapGooglePlaceToRestaurant(p, idx));

    // Ensure we have up to 100 places by merging fresh with curated baseline if needed
    const existingDataset = getCuratedDataset();
    const mergedList: Restaurant[] = [...freshRestaurants];
    for (const place of existingDataset) {
      if (mergedList.length >= targetMax) break;
      if (!mergedList.some((p) => p.name.toLowerCase() === place.name.toLowerCase())) {
        mergedList.push(place);
      }
    }

    // Compare with current cached curated dataset
    if (hasDatasetChanged(existingDataset, mergedList)) {
      console.log(`Places API sync: Detected changes. Updating curated dataset cache with ${mergedList.length} spots.`);
      localStorage.setItem(CURATED_CACHE_KEY, JSON.stringify(mergedList));
      return mergedList;
    }

    return null;
  } catch (error) {
    console.warn('Places API sync failed (will preserve existing cached curated dataset):', error);
    return null;
  }
}

export function searchDynamicRestaurants(
  maxResultCount: MaxResultOption = 100
): Restaurant[] {
  const validCounts: MaxResultOption[] = [20, 50, 70, 100];
  const count = validCounts.includes(maxResultCount) ? maxResultCount : 100;

  const dataset = getCuratedDataset();
  return dataset.slice(0, count);
}
