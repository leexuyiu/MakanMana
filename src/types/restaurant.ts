export type Region = 'subang' | 'velocity';

export type Area = 'All' | 'SS15' | 'SS14' | 'SS16' | 'SS18' | 'Velocity & Peel';

export type RestaurantType =
  | 'All'
  | 'Kopitiam'
  | 'Hawker Centre'
  | 'Restaurant'
  | 'Cafe'
  | 'Late Night Mamak'
  | 'Fast Casual';

export type CuisineCategory =
  | 'all'
  | 'malay'
  | 'chinese'
  | 'indian'
  | 'mamak'
  | 'japanese'
  | 'korean'
  | 'western'
  | 'middle_eastern'
  | 'dessert'
  | 'asian_fusion';

export type PriceTier = '$' | '$$' | '$$$'; // $ = <RM15, $$ = RM15-35, $$$ = >RM35

export interface DietaryInfo {
  isHalal: boolean;
  isPorkFree: boolean;
  isVegetarian: boolean;
}

export interface MenuItem {
  item: string;
  price: string;
  tag?: string;
}

export interface RestaurantPhotos {
  storefront?: string;
  food?: string;
  menu?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  area: string;
  region?: Region;
  cuisine: string;
  cuisineCategory: CuisineCategory;
  restaurantType: 'Kopitiam' | 'Hawker Centre' | 'Restaurant' | 'Cafe' | 'Late Night Mamak' | 'Fast Casual';
  dietary: DietaryInfo;
  priceRange: PriceTier;
  priceEstimate: string; // e.g. "RM 10 - 15"
  rating: number;
  reviewCount: number;
  reviewSummary: string;
  address: string;
  placeId?: string;
  googleMapsUrl?: string;
  lat: number;
  lng: number;
  isLateNight: boolean; // Open past 10 PM
  isStudentBudget: boolean; // Average meal < RM15
  hasAirCon: boolean;
  openingHours: string;
  lrtProximity: string;
  signatureDishes: string[];
  photos: RestaurantPhotos;
  menuHighlights: MenuItem[];
  isCustom?: boolean;
}

export interface FilterState {
  region: Region;
  areas: string[];
  cuisineCategories: Exclude<CuisineCategory, 'all'>[];
  restaurantTypes: Exclude<RestaurantType, 'All'>[];
  priceRanges: PriceTier[];
  minRating: number;
  dietary: {
    halal: boolean;
    porkFree: boolean;
    vegetarian: boolean;
  };
  lateNightOnly: boolean;
  studentBudgetOnly: boolean;
  airConOnly: boolean;
  searchQuery: string;
  maxResultCount: 20 | 50 | 70 | 100 | 200;
}

export type RandomizerMode = 'single' | 'trio';
