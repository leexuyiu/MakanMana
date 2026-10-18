import React from 'react';
import {
  CuisineCategory,
  FilterState,
  PriceTier,
  RestaurantType,
} from '../types/restaurant';
import { soundFx } from '../utils/audioEffects';
import {
  RotateCcw,
  Sparkles,
  MapPin,
  UtensilsCrossed,
  DollarSign,
  Star,
  CheckSquare,
  Square,
  ShieldCheck,
  Moon,
  Wind,
  Search,
  Check,
  Building2,
  RotateCw,
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalSpotsCount: number;
  matchedSpotsCount: number;
  isLoadingPlaces?: boolean;
  onRefreshPlaces?: () => void;
}

const CUISINES: { id: Exclude<CuisineCategory, 'all'>; label: string }[] = [
  { id: 'chinese', label: 'Chinese' },
  { id: 'malay', label: 'Malay' },
  { id: 'indian', label: 'Indian (North/South)' },
  { id: 'mamak', label: 'Mamak (Indian Muslim)' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'korean', label: 'Korean' },
  { id: 'western', label: 'Western & Burgers' },
  { id: 'middle_eastern', label: 'Middle Eastern' },
  { id: 'dessert', label: 'Desserts & Drinks' },
];

const AREAS: ('SS15' | 'SS14' | 'SS16' | 'SS18')[] = ['SS15', 'SS14', 'SS16', 'SS18'];

const RESTAURANT_TYPES: Exclude<RestaurantType, 'All'>[] = [
  'Kopitiam',
  'Hawker Centre',
  'Restaurant',
  'Cafe',
  'Late Night Mamak',
  'Fast Casual',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  totalSpotsCount,
  matchedSpotsCount,
  isLoadingPlaces = false,
  onRefreshPlaces,
}) => {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    soundFx.playFilterTap();
    onChange({ ...filters, [key]: value });
  };

  // Toggle helpers for multi-select arrays
  const toggleArea = (area: 'SS15' | 'SS14' | 'SS16' | 'SS18') => {
    soundFx.playFilterTap();
    const current = filters.areas;
    const next = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area];
    onChange({ ...filters, areas: next });
  };

  const toggleCuisine = (cuisine: Exclude<CuisineCategory, 'all'>) => {
    soundFx.playFilterTap();
    const current = filters.cuisineCategories;
    const next = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine];
    onChange({ ...filters, cuisineCategories: next });
  };

  const toggleRestaurantType = (type: Exclude<RestaurantType, 'All'>) => {
    soundFx.playFilterTap();
    const current = filters.restaurantTypes;
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ ...filters, restaurantTypes: next });
  };

  const togglePriceRange = (price: PriceTier) => {
    soundFx.playFilterTap();
    const current = filters.priceRanges;
    const next = current.includes(price)
      ? current.filter((p) => p !== price)
      : [...current, price];
    onChange({ ...filters, priceRanges: next });
  };

  const toggleDietary = (type: 'halal' | 'porkFree' | 'vegetarian') => {
    soundFx.playFilterTap();
    onChange({
      ...filters,
      dietary: {
        ...filters.dietary,
        [type]: !filters.dietary[type],
      },
    });
  };

  const clearDietary = () => {
    soundFx.playFilterTap();
    onChange({
      ...filters,
      dietary: {
        halal: false,
        porkFree: false,
        vegetarian: false,
      },
    });
  };

  const resetAllFilters = () => {
    soundFx.playFilterTap();
    onChange({
      areas: [],
      cuisineCategories: [],
      restaurantTypes: [],
      priceRanges: [],
      minRating: 0,
      dietary: {
        halal: false,
        porkFree: false,
        vegetarian: false,
      },
      lateNightOnly: false,
      studentBudgetOnly: false,
      airConOnly: false,
      searchQuery: '',
      maxResultCount: filters.maxResultCount || 20,
    });
  };

  const hasActiveDietary =
    filters.dietary.halal || filters.dietary.porkFree || filters.dietary.vegetarian;

  const isAnyFilterActive =
    filters.areas.length > 0 ||
    filters.cuisineCategories.length > 0 ||
    filters.restaurantTypes.length > 0 ||
    filters.priceRanges.length > 0 ||
    filters.minRating > 0 ||
    hasActiveDietary ||
    filters.lateNightOnly ||
    filters.studentBudgetOnly ||
    filters.airConOnly;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 md:p-5 space-y-4">
      {/* Google Places Result Range Bar */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b border-stone-200/80">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-stone-700 flex items-center gap-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Google Places Result Range</span>
            </span>
            {onRefreshPlaces && (
              <button
                type="button"
                onClick={onRefreshPlaces}
                disabled={isLoadingPlaces}
                title="Refresh fresh places from Google Maps"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isLoadingPlaces ? 'animate-spin text-orange-600' : ''}`} />
                <span>{isLoadingPlaces ? 'Updating...' : 'Refresh'}</span>
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {([20, 50, 70, 100] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => updateFilter('maxResultCount', cnt)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  (filters.maxResultCount || 20) === cnt
                    ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                <span>{cnt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Integrated Status Pill */}
        <div className="flex items-center justify-between gap-2 bg-stone-50/80 border border-stone-200/90 rounded-2xl p-2.5 px-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-600">
            <span className="font-bold text-stone-900 font-mono text-sm tabular-nums">
              {matchedSpotsCount}
            </span>
            <span className="text-stone-500">of</span>
            <span className="font-bold text-stone-800 font-mono text-sm tabular-nums">
              {totalSpotsCount}
            </span>
            <span className="text-stone-600">spots match</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200/80 text-stone-600 ml-1">
              Search limit: {filters.maxResultCount || 20}
            </span>
          </div>

          {isAnyFilterActive && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-stone-500" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: Dietary Restrictions Checkbox Matrix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Dietary Restrictions
          </span>
          {hasActiveDietary && (
            <button
              onClick={clearDietary}
              className="text-[11px] font-semibold text-stone-500 hover:text-orange-600 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Halal Option */}
          <button
            type="button"
            onClick={() => toggleDietary('halal')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
              filters.dietary.halal
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
                : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 text-stone-700'
            }`}
          >
            {filters.dietary.halal ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold block text-stone-900">Halal Certified</span>
              <span className="text-[10px] text-stone-500 block leading-tight">Muslim-friendly kitchen</span>
            </div>
          </button>

          {/* Pork-Free Option */}
          <button
            type="button"
            onClick={() => toggleDietary('porkFree')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
              filters.dietary.porkFree
                ? 'bg-teal-50/90 border-teal-300 text-teal-950 shadow-xs'
                : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 text-stone-700'
            }`}
          >
            {filters.dietary.porkFree ? (
              <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold block text-stone-900">Pork-Free</span>
              <span className="text-[10px] text-stone-500 block leading-tight">No pork, no lard used</span>
            </div>
          </button>

          {/* Vegetarian Option */}
          <button
            type="button"
            onClick={() => toggleDietary('vegetarian')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
              filters.dietary.vegetarian
                ? 'bg-green-50/90 border-green-300 text-green-950 shadow-xs'
                : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 text-stone-700'
            }`}
          >
            {filters.dietary.vegetarian ? (
              <CheckSquare className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold block text-stone-900">Vegetarian / Vegan</span>
              <span className="text-[10px] text-stone-500 block leading-tight">Plant-based choices</span>
            </div>
          </button>

          {/* Clear / No Restrictions Reset */}
          <button
            type="button"
            onClick={clearDietary}
            className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              !hasActiveDietary
                ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                : 'bg-stone-50/60 border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>No Restrictions (All Foods)</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Cuisine Category (Multi-Select) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            Cuisine Category (Multi-Select)
            {filters.cuisineCategories.length > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-800 font-semibold px-1.5 py-0.2 rounded-full font-mono">
                {filters.cuisineCategories.length} selected
              </span>
            )}
          </span>
          {filters.cuisineCategories.length > 0 && (
            <button
              onClick={() => {
                soundFx.playFilterTap();
                updateFilter('cuisineCategories', []);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 hover:text-orange-900 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Cuisine</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {/* All Cuisines Button */}
          <button
            type="button"
            onClick={() => {
              soundFx.playFilterTap();
              updateFilter('cuisineCategories', []);
            }}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
              filters.cuisineCategories.length === 0
                ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-xs'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            <span>All Cuisines</span>
          </button>

          {/* Cuisine Options */}
          {CUISINES.map((c) => {
            const isSelected = filters.cuisineCategories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCuisine(c.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Area Enclave (Multi-Select) & Special Subang Highlights */}
      <div className="space-y-3 pt-1">
        {/* Area Tabs (Multi-Select) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              Area Enclave (Multi-Select)
              {filters.areas.length > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded-full font-mono">
                  {filters.areas.length} selected
                </span>
              )}
            </span>
            {filters.areas.length > 0 && (
              <button
                onClick={() => updateFilter('areas', [])}
                className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                All Areas
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => updateFilter('areas', [])}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filters.areas.length === 0
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Subang
            </button>
            {AREAS.map((a) => {
              const isSelected = filters.areas.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleArea(a)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  <span>{a}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subang Specials (Late night & Air con) */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Special Preferences
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => updateFilter('lateNightOnly', !filters.lateNightOnly)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filters.lateNightOnly
                  ? 'bg-indigo-900 text-indigo-100 border-indigo-800 shadow-xs'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Supper &gt;10pm</span>
            </button>

            <button
              type="button"
              onClick={() => updateFilter('airConOnly', !filters.airConOnly)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filters.airConOnly
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-sky-200" />
              <span>Air-Con Seating</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Establishment Type (Multi-Select) & Price Range (Multi-Select) */}
      <div className="grid grid-cols-1 gap-3.5 pt-2 border-t border-stone-200/60 text-xs">
        {/* Establishment Type (Multi-Select) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Establishment Type (Multi)</span>
            </span>
            {filters.restaurantTypes.length > 0 && (
              <button
                onClick={() => updateFilter('restaurantTypes', [])}
                className="text-[10px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                All Types
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {RESTAURANT_TYPES.map((t) => {
              const isSelected = filters.restaurantTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleRestaurantType(t)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Tier (Multi-Select) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-stone-500" />
              <span>Price Range (Multi)</span>
            </span>
            {filters.priceRanges.length > 0 && (
              <button
                onClick={() => updateFilter('priceRanges', [])}
                className="text-[10px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                All Prices
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {(['$', '$$', '$$$'] as const).map((p) => {
              const isSelected = filters.priceRanges.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriceRange(p)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  <span>{p === '$' ? '$ (<RM15)' : p === '$$' ? '$$ (15-35)' : '$$$ (>35)'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Min Google Rating */}
        <div>
          <span className="font-semibold text-stone-700 block mb-1.5 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Min Google Rating</span>
          </span>
          <div className="flex gap-1">
            {[0, 4.0, 4.3, 4.5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateFilter('minRating', r)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  filters.minRating === r
                    ? 'bg-amber-500 text-stone-950 border-amber-500 font-semibold shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {r === 0 ? (
                  <span>Any</span>
                ) : (
                  <>
                    <Star className="w-3 h-3 fill-stone-900 text-stone-900" />
                    <span>{r.toFixed(1)}+</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
