import { Restaurant, CuisineCategory, RestaurantType, PriceTier, FilterState, Region } from '../types/restaurant';
import { CURATED_RESTAURANTS } from '../data/ssRestaurants';
import { VELOCITY_RESTAURANTS } from '../data/velocityRestaurants';

export const SUBANG_CACHE_KEY = 'makanmana_curated_dataset_v7';
export const VELOCITY_CACHE_KEY = 'makanmana_curated_velocity_v5';
export const CURATED_CACHE_KEY = SUBANG_CACHE_KEY;

export const VELOCITY_CENTER = {
  lat: 3.1285,
  lng: 101.7240,
  maxRadiusKm: 1.10, // Strict 1,100 meters walking boundary centered around Plaza 393 / Sunway Velocity
};

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinVelocityBounds(lat: number, lng: number, address = ''): boolean {
  const lower = address.toLowerCase();
  // Filter out locations known to be outside the Plaza 393 / Velocity walking district
  if (
    lower.includes('balakong') ||
    lower.includes('kajang') ||
    lower.includes('cheras selatan') ||
    lower.includes('ampang') ||
    lower.includes('seri kembangan') ||
    lower.includes('mahkota cheras') ||
    lower.includes('taman connaught') ||
    lower.includes('taman segar') ||
    lower.includes('singapore') ||
    lower.includes('puchong') ||
    lower.includes('batu 2 1/2') ||
    lower.includes('batu 2.5')
  ) {
    return false;
  }
  const dist = haversineDistanceKm(lat, lng, VELOCITY_CENTER.lat, VELOCITY_CENTER.lng);
  return dist <= VELOCITY_CENTER.maxRadiusKm;
}

export type MaxResultOption = 20 | 50 | 70 | 100 | 200;

export function getCuratedDataset(region: Region = 'subang'): Restaurant[] {
  // Purge any stale cache keys from previous versions
  const legacyKeys = [
    'makanmana_curated_dataset_cache',
    'makanmana_curated_dataset_v2',
    'makanmana_curated_dataset_v3',
    'makanmana_curated_dataset_v4',
    'makanmana_curated_dataset_v5',
    'makanmana_curated_dataset_v6',
    'makanmana_curated_velocity_v1',
    'makanmana_curated_velocity_v2',
    'makanmana_curated_velocity_v3',
    'makanmana_curated_velocity_v4',
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

  const cacheKey = region === 'velocity' ? VELOCITY_CACHE_KEY : SUBANG_CACHE_KEY;
  const baselineDataset = region === 'velocity' ? VELOCITY_RESTAURANTS : CURATED_RESTAURANTS;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Validate that cached items have genuine googleMapsUrl and satisfy geofence bounds
      const isValid =
        Array.isArray(parsed) &&
        parsed.length >= 20 &&
        parsed.every((r) => {
          if (!r.id || !r.googleMapsUrl) return false;
          if (region === 'velocity') {
            return isWithinVelocityBounds(r.lat, r.lng, r.address);
          }
          return true;
        });

      if (isValid) {
        return parsed;
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {
    console.warn(`Failed to parse cached curated dataset for ${region}, re-initializing from baseline.`);
  }

  // Initialize cache with default pre-populated genuine places
  try {
    localStorage.setItem(cacheKey, JSON.stringify(baselineDataset));
  } catch {
    // Ignore storage quota
  }
  return baselineDataset;
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

export function buildPlacesQuery(filters?: Partial<FilterState>, defaultRegion: Region = 'subang'): string {
  const activeRegion = filters?.region || defaultRegion;
  if (!filters) {
    return activeRegion === 'velocity'
      ? "popular restaurants, cafes, and food stalls around Sunway Velocity Mall, MyTOWN, Jalan Peel, Queen's Avenue, Plaza 393, Jalan Kundur"
      : 'popular restaurants, cafes, and food stalls in Subang Jaya SS15 SS14 SS16 SS18';
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
  if (activeRegion === 'velocity') {
    parts.push("around Sunway Velocity Mall, MyTOWN, Jalan Peel, Queen's Avenue, Plaza 393, Jalan Kundur");
  } else if (filters.areas && filters.areas.length > 0) {
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

function inferArea(address: string, name: string, lat: number, lng: number, region: Region = 'subang'): string {
  if (region === 'velocity') {
    return 'Velocity & Peel';
  }
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

function mapGooglePlaceToRestaurant(place: any, index: number, region: Region = 'subang'): Restaurant {
  const name = place.displayName?.text || (region === 'velocity' ? 'Sunway Velocity Dining Spot' : 'Subang Dining Spot');
  const address = place.formattedAddress || (region === 'velocity' ? 'Maluri, Cheras, Kuala Lumpur' : 'Subang Jaya, Selangor');
  const types: string[] = Array.isArray(place.types) ? place.types : [];
  const primaryType: string = place.primaryType || '';
  const lat = place.location?.latitude || (region === 'velocity' ? 3.128 : 3.074);
  const lng = place.location?.longitude || (region === 'velocity' ? 101.724 : 101.586);

  const area = inferArea(address, name, lat, lng, region);
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

  // Strictly use official place.googleMapsUri directly as returned by Google Places API
  const googleMapsUrl = place.googleMapsUri || '';

  let lrtProximity = `Near ${area} LRT Station`;
  if (region === 'velocity') {
    const combined = `${name} ${address}`.toLowerCase();
    if (combined.includes('mytown') || combined.includes('ikea') || combined.includes('cochrane')) {
      lrtProximity = 'Near Cochrane MRT (Walk to MyTOWN / IKEA)';
    } else if (combined.includes('velocity') || combined.includes('maluri')) {
      lrtProximity = 'Near Maluri MRT/LRT (Direct to Velocity / Peel)';
    } else if (combined.includes('queen') || combined.includes('shelley') || combined.includes('393') || combined.includes('bayam')) {
      lrtProximity = "Near Plaza 393 / Queen's Avenue";
    } else if (combined.includes('kundur')) {
      lrtProximity = 'Near Jalan Kundur / Peel';
    } else {
      lrtProximity = 'Walking distance in Sunway Velocity & Peel enclave';
    }
  }

  return {
    id: place.id || `dynamic-${region}-${index}`,
    name,
    area,
    region,
    cuisine: friendlyCuisine,
    cuisineCategory,
    restaurantType,
    dietary,
    priceRange,
    priceEstimate,
    rating: place.rating || 4.2,
    reviewCount: place.userRatingCount || 200,
    reviewSummary: place.editorialSummary?.text || (region === 'velocity' ? 'Popular dining spot in Sunway Velocity & Peel enclave.' : 'Popular dining spot in Subang Jaya.'),
    address,
    placeId: place.id,
    googleMapsUrl,
    lat,
    lng,
    isLateNight,
    isStudentBudget,
    hasAirCon: restaurantType === 'Cafe' || restaurantType === 'Restaurant' || priceRange !== '$',
    openingHours: openingWeekday,
    lrtProximity,
    signatureDishes: ['Chef Recommendation', 'House Specialty'],
    photos: {},
    menuHighlights: [{ item: 'House Specialty', price: priceEstimate.split('-')[0].trim(), tag: 'Popular' }],
  };
}

export async function syncFreshPlacesDataset(targetMax = 200, region: Region = 'subang'): Promise<Restaurant[] | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    return null;
  }

  const queries =
    region === 'velocity'
      ? [
          'restaurants and food in Sunway Velocity Mall Kuala Lumpur',
          'food and cafes in Sunway Velocity Two Jalan Peel Kuala Lumpur',
          'restaurants cafes in MyTOWN Shopping Centre Cheras',
          'food and stalls in Jalan Peel Cheras Kuala Lumpur',
          'restaurants cafes in Queens Avenue Jalan Bayam Cheras',
          'food court and restaurants in Plaza 393 Jalan Shelley Cheras',
          'restaurants and food in Jalan Kundur Cheras Kuala Lumpur',
          'coffee bakery dessert in Sunway Velocity MyTOWN Jalan Peel',
          'kopitiam hawker in Maluri Jalan Peel Cheras',
        ]
      : [
          'popular restaurants, cafes, and food stalls in Subang Jaya SS15 SS14 SS16 SS18',
          'food stalls and cafe in SS15 Subang Jaya',
          'restaurants and kopitiam in SS14 SS18 Subang Jaya',
          'restaurants in SS16 Subang Jaya Empire Subang Parade',
        ];

  const collectedMap = new Map<string, any>();

  try {
    for (const q of queries) {
      if (collectedMap.size >= targetMax) break;
      let pageToken: string | undefined = undefined;

      for (let page = 0; page < 3 && collectedMap.size < targetMax; page++) {
        const bodyPayload: any = {
          textQuery: q,
          maxResultCount: 20,
        };
        if (region === 'velocity') {
          bodyPayload.locationRestriction = {
            circle: {
              center: {
                latitude: VELOCITY_CENTER.lat,
                longitude: VELOCITY_CENTER.lng,
              },
              radius: 1100.0,
            },
          };
        }
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

        for (const p of data.places) {
          if (p.id && !collectedMap.has(p.id)) {
            if (region === 'velocity') {
              const pLat = p.location?.latitude;
              const pLng = p.location?.longitude;
              const pAddr = p.formattedAddress || '';
              if (pLat && pLng && !isWithinVelocityBounds(pLat, pLng, pAddr)) {
                continue; // Strictly enforce 1.1km geofence around Plaza 393
              }
            }
            collectedMap.set(p.id, p);
          }
        }

        pageToken = data.nextPageToken;
        if (!pageToken) {
          break;
        }
      }
    }

    if (collectedMap.size === 0) {
      return null;
    }

    const collectedPlaces = Array.from(collectedMap.values());
    const freshRestaurants: Restaurant[] = collectedPlaces.map((p, idx) =>
      mapGooglePlaceToRestaurant(p, idx, region)
    );

    // Ensure we have up to targetMax places by merging fresh with curated baseline
    const existingDataset = getCuratedDataset(region);
    const mergedList: Restaurant[] = [...freshRestaurants];
    for (const place of existingDataset) {
      if (mergedList.length >= targetMax) break;
      if (!mergedList.some((p) => p.name.toLowerCase() === place.name.toLowerCase() || p.id === place.id)) {
        mergedList.push(place);
      }
    }

    const cacheKey = region === 'velocity' ? VELOCITY_CACHE_KEY : SUBANG_CACHE_KEY;
    // Compare with current cached curated dataset
    if (hasDatasetChanged(existingDataset, mergedList)) {
      console.log(`Places API sync (${region}): Detected changes. Updating curated dataset cache with ${mergedList.length} spots.`);
      localStorage.setItem(cacheKey, JSON.stringify(mergedList));
      return mergedList;
    }

    return null;
  } catch (error) {
    console.warn(`Places API sync (${region}) failed (will preserve existing cached curated dataset):`, error);
    return null;
  }
}

export function searchDynamicRestaurants(
  maxResultCount: MaxResultOption = 100,
  region: Region = 'subang'
): Restaurant[] {
  const validCounts: MaxResultOption[] = [20, 50, 70, 100, 200];
  const count = validCounts.includes(maxResultCount) ? maxResultCount : 100;

  const dataset = getCuratedDataset(region);
  return dataset.slice(0, count);
}
