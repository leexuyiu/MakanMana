import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FilterState, Restaurant } from './types/restaurant';
import { getCuratedDataset, syncFreshPlacesDataset } from './services/placesSearchService';
import { soundFx } from './utils/audioEffects';
import { QuotaBanner } from './components/QuotaBanner';
import { FilterBar } from './components/FilterBar';
import { RestaurantCard } from './components/RestaurantCard';
import { InteractiveMap } from './components/InteractiveMap';
import {
  Utensils,
  MapPin,
  Sparkles,
  Heart,
  Share2,
  Check,
  RotateCcw,
} from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
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
  maxResultCount: 20,
};

export default function App() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [hasRolled, setHasRolled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [focusedRestaurant, setFocusedRestaurant] = useState<Restaurant | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize with full 100-spot curated dataset from cache/baseline
  const [allBaseRestaurants, setAllBaseRestaurants] = useState<Restaurant[]>(() => getCuratedDataset());
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  // Background sync on page load with Google Places API (compares IDs and ratings)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPlaces(true);
    syncFreshPlacesDataset(100)
      .then((updated) => {
        if (isMounted && updated && updated.length > 0) {
          setAllBaseRestaurants(updated);
        }
        if (isMounted) setIsLoadingPlaces(false);
      })
      .catch(() => {
        if (isMounted) setIsLoadingPlaces(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual on-demand sync from Google Places
  const handleManualRefresh = () => {
    soundFx.playFilterTap();
    setIsLoadingPlaces(true);
    syncFreshPlacesDataset(100)
      .then((updated) => {
        if (updated && updated.length > 0) {
          setAllBaseRestaurants(updated);
        }
        setIsLoadingPlaces(false);
      })
      .catch(() => {
        setIsLoadingPlaces(false);
      });
  };

  // Slice baseline pool according to active result range selector (20, 50, 70, 100)
  const baseRestaurants = useMemo(() => {
    return allBaseRestaurants.slice(0, filters.maxResultCount || 20);
  }, [allBaseRestaurants, filters.maxResultCount]);

  const allRestaurants = useMemo(() => {
    return baseRestaurants;
  }, [baseRestaurants]);

  // Filter restaurants according to all criteria
  const matchedRestaurants = useMemo(() => {
    return allRestaurants.filter((place) => {
      // Areas (multi-select: if empty, matches all)
      if (filters.areas.length > 0 && !filters.areas.includes(place.area)) {
        return false;
      }
      // Cuisine Categories (multi-select: if empty, matches all)
      if (
        filters.cuisineCategories.length > 0 &&
        !filters.cuisineCategories.includes(place.cuisineCategory as any)
      ) {
        return false;
      }
      // Restaurant Types (multi-select: if empty, matches all)
      if (
        filters.restaurantTypes.length > 0 &&
        !filters.restaurantTypes.includes(place.restaurantType as any)
      ) {
        return false;
      }
      // Price Ranges (multi-select: if empty, matches all)
      if (
        filters.priceRanges.length > 0 &&
        !filters.priceRanges.includes(place.priceRange)
      ) {
        return false;
      }
      // Min Rating
      if (filters.minRating > 0 && place.rating < filters.minRating) {
        return false;
      }
      // Dietary Restrictions
      if (filters.dietary.halal && !place.dietary.isHalal) {
        return false;
      }
      if (filters.dietary.porkFree && !place.dietary.isPorkFree && !place.dietary.isHalal) {
        return false;
      }
      if (filters.dietary.vegetarian && !place.dietary.isVegetarian) {
        return false;
      }
      // Special Subang Filters
      if (filters.lateNightOnly && !place.isLateNight) {
        return false;
      }
      if (filters.studentBudgetOnly && !place.isStudentBudget) {
        return false;
      }
      if (filters.airConOnly && !place.hasAirCon) {
        return false;
      }
      return true;
    });
  }, [allRestaurants, filters]);

  // Randomize roll executes 100% client-side (instant, zero API quota usage)
  const handleRandomize = () => {
    if (isRolling) return;

    setHasRolled(true);
    setIsRolling(true);

    const pool = matchedRestaurants.length > 0 ? matchedRestaurants : allRestaurants;
    if (pool.length === 0) {
      setIsRolling(false);
      return;
    }

    let ticks = 0;
    const maxTicks = 12;

    const interval = setInterval(() => {
      ticks += 1;
      soundFx.playTick(1.0 + (ticks / maxTicks) * 0.4);

      const tempIndex = Math.floor(Math.random() * pool.length);
      setSelectedRestaurants([pool[tempIndex]]);

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setIsRolling(false);
        soundFx.playWinFanfare();

        const finalIndex = Math.floor(Math.random() * pool.length);
        const chosen = pool[finalIndex];
        setSelectedRestaurants([chosen]);
        setFocusedRestaurant(chosen);

        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 70);
  };

  // Find similar restaurants in the same cuisine or area
  const getSimilarRestaurants = (current: Restaurant): Restaurant[] => {
    return allRestaurants
      .filter((r) => r.id !== current.id && (r.cuisineCategory === current.cuisineCategory || r.area === current.area))
      .slice(0, 3);
  };

  const handleFocusOnMap = (restaurant: Restaurant) => {
    setFocusedRestaurant(restaurant);
    soundFx.playFilterTap();
    if (mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleShareApp = () => {
    soundFx.playFilterTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-['DM_Sans',sans-serif]">
      {/* Google Maps Quota Exhaustion Warning Sticky Banner */}
      <QuotaBanner />

      {/* Top Bar Contract (1-line Brand wordmark — Share button) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            className="text-lg md:text-xl font-extrabold tracking-tight text-stone-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="p-1.5 bg-orange-600 text-white rounded-xl shadow-xs">
              <Utensils className="w-4 h-4" />
            </span>
            <span className="font-['Plus_Jakarta_Sans',sans-serif]">MakanMana SS15</span>
          </a>

          {/* Zone 2: 1 primary action (Share button) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleShareApp}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Share food picker link"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Dual-Column Row: Filter Section on Left, Result Section on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
          {/* Left Column: Filter Matrix */}
          <div className="lg:col-span-5 xl:col-span-5">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              totalSpotsCount={allRestaurants.length}
              matchedSpotsCount={matchedRestaurants.length}
              isLoadingPlaces={isLoadingPlaces}
              onRefreshPlaces={handleManualRefresh}
            />
          </div>

          {/* Right Column: Randomized Results Viewport */}
          <div className="lg:col-span-7 xl:col-span-7">
            <section ref={resultsRef} className="scroll-mt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-600" />
                    <span>Winning Recommendation</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Your randomized spot with Google ratings, menu prices & reviews.
                  </p>
                </div>

                {hasRolled && (
                  <button
                    onClick={handleRandomize}
                    disabled={isRolling}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                    <span>Roll Again</span>
                  </button>
                )}
              </div>

              {selectedRestaurants.length > 0 ? (
                <div className="grid gap-5 grid-cols-1">
                  {selectedRestaurants.map((restaurant, idx) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      isPrimaryWinner={idx === 0}
                      onFocusOnMap={handleFocusOnMap}
                      onSelectSimilar={(sim) => {
                        setHasRolled(true);
                        setSelectedRestaurants([sim]);
                        setFocusedRestaurant(sim);
                        soundFx.playWinFanfare();
                      }}
                      similarPlaces={getSimilarRestaurants(restaurant)}
                    />
                  ))}
                </div>
              ) : !hasRolled ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-sm">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-xl">Ready to find your next meal?</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1.5 mb-6">
                    Click the button below to randomly pick from the best dining spots across Subang Jaya.
                  </p>
                  <button
                    onClick={handleRandomize}
                    disabled={isRolling}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Randomize Meal</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-stone-200/80 p-6">
                  <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <h3 className="font-bold text-stone-800 text-base">No restaurants match your filters</h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4">
                    Try widening your price range, clearing dietary requirements, or selecting more cuisines.
                  </p>
                  <button
                    onClick={() => setFilters(INITIAL_FILTERS)}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Row Below: Full-Width Embedded Interactive Google Map */}
        <section ref={mapRef} className="scroll-mt-20">
          <InteractiveMap
            restaurants={matchedRestaurants}
            selectedRestaurants={selectedRestaurants}
            focusedRestaurant={focusedRestaurant}
            onSelectRestaurant={(place) => {
              setSelectedRestaurants([place]);
              setFocusedRestaurant(place);
            }}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
              MakanMana SS15
            </span>
            <span aria-hidden="true">·</span>
            <span>Subang Jaya Food Randomizer & Decision Engine</span>
          </div>

          <p className="text-stone-400 text-center sm:text-right">
            Curated for hungry students, office lunch warriors, and midnight supper hunters in SS15, SS14, SS16 & SS18.
          </p>
        </div>
      </footer>
    </div>
  );
}
