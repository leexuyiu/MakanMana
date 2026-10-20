import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FilterState, Restaurant, Region } from './types/restaurant';
import { getCuratedDataset, syncFreshPlacesDataset } from './services/placesSearchService';
import { soundFx } from './utils/audioEffects';
import { QuotaBanner } from './components/QuotaBanner';
import { FilterBar } from './components/FilterBar';
import { RestaurantCard } from './components/RestaurantCard';
import {
  Utensils,
  MapPin,
  Sparkles,
  Heart,
  Share2,
  Check,
  RotateCcw,
  ArrowUp,
  SlidersHorizontal,
} from 'lucide-react';

const STORAGE_REGION_KEY = 'makanmana_selected_region';

function getStoredRegion(): Region {
  try {
    const stored = localStorage.getItem(STORAGE_REGION_KEY);
    if (stored === 'subang' || stored === 'velocity') {
      return stored as Region;
    }
  } catch (e) {
    // ignore
  }
  return 'subang';
}

const INITIAL_FILTERS: FilterState = {
  region: getStoredRegion(),
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
  maxResultCount: 200,
};

export default function App() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [hasRolled, setHasRolled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [focusedRestaurant, setFocusedRestaurant] = useState<Restaurant | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToResults = () => {
    soundFx.playFilterTap();
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Initialize with full 200-spot curated dataset from cache/baseline
  const [allBaseRestaurants, setAllBaseRestaurants] = useState<Restaurant[]>(() => getCuratedDataset(INITIAL_FILTERS.region));
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const hasSyncedRef = useRef<Record<string, boolean>>({});

  // Background sync on page load with Google Places API
  useEffect(() => {
    if (hasSyncedRef.current[filters.region]) return;
    hasSyncedRef.current[filters.region] = true;
    let isMounted = true;
    setIsLoadingPlaces(true);
    syncFreshPlacesDataset(200, filters.region)
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
  }, [filters.region]);

  // Switch region handler
  const handleRegionChange = (newRegion: Region) => {
    if (filters.region === newRegion) return;
    soundFx.playFilterTap();
    try {
      localStorage.setItem(STORAGE_REGION_KEY, newRegion);
    } catch (e) {
      // ignore
    }
    setFilters((prev) => ({
      ...prev,
      region: newRegion,
      areas: [],
    }));
    setSelectedRestaurants([]);
    setHasRolled(false);
    setFocusedRestaurant(null);
    const newDataset = getCuratedDataset(newRegion);
    setAllBaseRestaurants(newDataset);

    // Sync from Places API for new region if not already synced in session
    if (!hasSyncedRef.current[newRegion]) {
      hasSyncedRef.current[newRegion] = true;
      setIsLoadingPlaces(true);
      syncFreshPlacesDataset(200, newRegion)
        .then((updated) => {
          if (updated && updated.length > 0) {
            setAllBaseRestaurants(updated);
          }
          setIsLoadingPlaces(false);
        })
        .catch(() => {
          setIsLoadingPlaces(false);
        });
    }
  };

  // Manual on-demand sync from Google Places
  const handleManualRefresh = () => {
    soundFx.playFilterTap();
    setIsLoadingPlaces(true);
    syncFreshPlacesDataset(200, filters.region)
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
    return allBaseRestaurants.slice(0, filters.maxResultCount || 100);
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

  const handleFocusOnMap = (restaurant: Restaurant) => {
    setFocusedRestaurant(restaurant);
    soundFx.playFilterTap();
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-['DM_Sans',sans-serif] w-full max-w-full overflow-x-hidden">
      {/* Google Maps Quota Exhaustion Warning Sticky Banner */}
      <QuotaBanner />

      {/* Top Bar Contract (1-line Brand wordmark — Share button) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-8 px-3.5 sm:px-6 py-2.5 sm:py-3 min-w-0">
          {/* Zone 1: Wordmark with dynamic regional subtitle */}
          <a
            href="/"
            className="min-w-0 flex items-center gap-2.5 shrink truncate group"
          >
            <span className="p-1.5 sm:p-2 bg-orange-600 text-white rounded-xl shadow-xs shrink-0">
              <Utensils className="w-4 h-4" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-stone-900 font-['Plus_Jakarta_Sans',sans-serif] leading-none truncate">
                MakanMana
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-orange-600 leading-tight truncate mt-0.5">
                {filters.region === 'velocity' ? 'Sunway Velocity & Peel' : 'Subang Jaya'}
              </span>
            </div>
          </a>

          {/* Zone 2: 1 primary action (Share button & Filters toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={() => {
                soundFx.playFilterTap();
                setShowFilters((prev) => !prev);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border ${
                showFilters
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
              }`}
              title="Toggle filter panel"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters<span className="hidden sm:inline"> (beta)</span></span>
            </button>

            <button
              onClick={handleShareApp}
              className="p-1.5 sm:p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shrink-0"
              title="Share food picker link"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 hidden sm:inline">Link Copied!</span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 md:py-8 min-w-0">
        {/* Top Region Switcher Segmented Control */}
        <div className="max-w-md mx-auto mb-5 sm:mb-6 px-1">
          <div className="bg-stone-200/80 p-1 rounded-2xl flex items-center shadow-inner gap-1">
            <button
              type="button"
              onClick={() => handleRegionChange('subang')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                filters.region === 'subang'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Subang Jaya</span>
            </button>
            <button
              type="button"
              onClick={() => handleRegionChange('velocity')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                filters.region === 'velocity'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Sunway Velocity / Peel</span>
            </button>
          </div>
        </div>

        {/* Responsive Grid: When filters are hidden on desktop, center the restaurant card */}
        <div className={`grid gap-6 items-start mb-8 transition-all duration-300 w-full min-w-0 ${
          showFilters ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-2xl mx-auto'
        }`}>

          {/* Left Column: Randomized Results Viewport */}
          <div className={`min-w-0 w-full ${showFilters ? 'lg:col-span-7 xl:col-span-7' : 'w-full'}`}>
            <section ref={resultsRef} className="scroll-mt-20 min-w-0">
              {selectedRestaurants.length > 0 ? (
                <div className="grid gap-5 grid-cols-1 min-w-0">
                  {selectedRestaurants.map((restaurant, idx) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      isPrimaryWinner={idx === 0}
                      onFocusOnMap={handleFocusOnMap}
                      onRollAgain={handleRandomize}
                      isRolling={isRolling}
                      onRefreshPlaces={handleManualRefresh}
                      isLoadingPlaces={isLoadingPlaces}
                      matchedSpotsCount={matchedRestaurants.length}
                    />
                  ))}
                </div>
              ) : !hasRolled ? (
                <div className="text-center py-12 sm:py-16 bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-sm">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl">Ready to find your next meal?</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1.5 mb-6">
                    {filters.region === 'velocity'
                      ? "Click the button below to randomly pick from the best dining spots around Sunway Velocity, MyTOWN, Jalan Peel, Queen's Avenue & Jalan Kundur."
                      : 'Click the button below to randomly pick from the best dining spots across Subang Jaya.'}
                  </p>
                  <button
                    onClick={handleRandomize}
                    disabled={isRolling}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Roll !</span>
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

          {/* Right Column: Filter Matrix (Toggled visibility) */}
          {showFilters && (
            <div className="lg:col-span-5 xl:col-span-5 min-w-0 w-full">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                totalSpotsCount={allRestaurants.length}
                matchedSpotsCount={matchedRestaurants.length}
                isLoadingPlaces={isLoadingPlaces}
                onRefreshPlaces={handleManualRefresh}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 text-xs text-stone-500 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
              {filters.region === 'velocity' ? 'MakanMana Sunway Velocity & Peel' : 'MakanMana Subang Jaya'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {filters.region === 'velocity'
                ? 'Sunway Velocity, MyTOWN & Jalan Peel Food Randomizer'
                : 'Subang Jaya Food Randomizer & Decision Engine'}
            </span>
          </div>

          <p className="text-stone-400 text-center sm:text-right">
            {filters.region === 'velocity'
              ? "Curated for office lunch in Queen's Avenue, Velocity & MyTOWN shoppers, Plaza 393 residents, and supper hunters on Jalan Peel & Jalan Kundur."
              : 'Curated for hungry students, office lunch warriors, and midnight supper hunters in SS15, SS14, SS16 & SS18.'}
          </p>
        </div>
      </footer>

      {/* Floating Round Scroll-to-Top Button for Mobile/Tablet */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToResults}
          aria-label="Scroll back up to restaurant card"
          title="Back to restaurant pick"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 lg:hidden w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
