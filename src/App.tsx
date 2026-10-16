import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FilterState, RandomizerMode, Restaurant } from './types/restaurant';
import { CURATED_RESTAURANTS } from './data/ssRestaurants';
import { soundFx } from './utils/audioEffects';
import { QuotaBanner } from './components/QuotaBanner';
import { FilterBar } from './components/FilterBar';
import { RandomizerHero } from './components/RandomizerHero';
import { RestaurantCard } from './components/RestaurantCard';
import { InteractiveMap } from './components/InteractiveMap';
import { AddCustomSpotModal } from './components/AddCustomSpotModal';
import {
  Compass,
  Plus,
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
};

export default function App() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [mode, setMode] = useState<RandomizerMode>('single');
  const [customSpots, setCustomSpots] = useState<Restaurant[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [focusedRestaurant, setFocusedRestaurant] = useState<Restaurant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Load custom spots from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('makanmana_custom_spots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomSpots(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Merge curated list with custom spots
  const allRestaurants = useMemo(() => {
    return [...CURATED_RESTAURANTS, ...customSpots];
  }, [customSpots]);

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
      // Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = place.name.toLowerCase().includes(query);
        const matchesCuisine = place.cuisine.toLowerCase().includes(query);
        const matchesDish = place.signatureDishes.some((d) => d.toLowerCase().includes(query));
        const matchesArea = place.area.toLowerCase().includes(query);
        if (!matchesName && !matchesCuisine && !matchesDish && !matchesArea) {
          return false;
        }
      }

      return true;
    });
  }, [allRestaurants, filters]);

  // Initial random pick on first load if none selected
  useEffect(() => {
    if (selectedRestaurants.length === 0 && matchedRestaurants.length > 0) {
      // Pick first default candidate
      setSelectedRestaurants([matchedRestaurants[0]]);
    }
  }, [matchedRestaurants, selectedRestaurants.length]);

  // Randomize handler with rapid shuffle audio ticks & fanfare
  const handleRandomize = () => {
    if (matchedRestaurants.length === 0 || isRolling) return;

    setIsRolling(true);
    let ticks = 0;
    const maxTicks = 12;

    const interval = setInterval(() => {
      ticks += 1;
      soundFx.playTick(1.0 + (ticks / maxTicks) * 0.4);

      // Random temporary shuffle pick
      const tempIndex = Math.floor(Math.random() * matchedRestaurants.length);
      setSelectedRestaurants([matchedRestaurants[tempIndex]]);

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setIsRolling(false);
        soundFx.playWinFanfare();

        // Final selection
        if (mode === 'single') {
          const finalIndex = Math.floor(Math.random() * matchedRestaurants.length);
          const chosen = matchedRestaurants[finalIndex];
          setSelectedRestaurants([chosen]);
          setFocusedRestaurant(chosen);
        } else {
          // Top 3 Shortlist mode
          const pool = [...matchedRestaurants];
          const results: Restaurant[] = [];
          const countToPick = Math.min(3, pool.length);

          for (let i = 0; i < countToPick; i++) {
            const pickIndex = Math.floor(Math.random() * pool.length);
            results.push(pool[pickIndex]);
            pool.splice(pickIndex, 1);
          }
          setSelectedRestaurants(results);
          if (results.length > 0) {
            setFocusedRestaurant(results[0]);
          }
        }

        // Scroll to results cleanly
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 70);
  };

  // Add custom spot & persist
  const handleAddCustomSpot = (newSpot: Restaurant) => {
    const updated = [newSpot, ...customSpots];
    setCustomSpots(updated);
    try {
      localStorage.setItem('makanmana_custom_spots', JSON.stringify(updated));
    } catch {
      // Ignore
    }
    // Select the new spot
    setSelectedRestaurants([newSpot]);
    setFocusedRestaurant(newSpot);
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

      {/* Top Bar Contract (1-line Brand wordmark — 4–5 single-line links — 1 primary action) */}
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

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => {
                setFilters({ ...INITIAL_FILTERS, areas: ['SS15'] });
                soundFx.playFilterTap();
              }}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.areas.length === 1 && filters.areas[0] === 'SS15'
                  ? 'text-orange-600 font-bold'
                  : ''
              }`}
            >
              SS15 Center
            </button>
            <button
              onClick={() => {
                setFilters({ ...INITIAL_FILTERS, areas: ['SS14'] });
                soundFx.playFilterTap();
              }}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.areas.length === 1 && filters.areas[0] === 'SS14'
                  ? 'text-orange-600 font-bold'
                  : ''
              }`}
            >
              SS14 Hawker
            </button>
            <button
              onClick={() => {
                setFilters({ ...INITIAL_FILTERS, lateNightOnly: true });
                soundFx.playFilterTap();
              }}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filters.lateNightOnly ? 'text-orange-600 font-bold' : ''
              }`}
            >
              Supper &gt;10pm
            </button>
            <button
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5 text-orange-600" />
              <span>Explore Map</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleShareApp}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold"
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

            <button
              onClick={() => {
                soundFx.playFilterTap();
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Spot</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Randomizer Control Deck */}
        <RandomizerHero
          mode={mode}
          onModeChange={setMode}
          onRandomize={handleRandomize}
          isRolling={isRolling}
          eligibleCount={matchedRestaurants.length}
          matchedRestaurants={matchedRestaurants}
        />

        {/* Dual-Column Row: Filter Section on Left, Result Section on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
          {/* Left Column: Filter Matrix */}
          <div className="lg:col-span-5 xl:col-span-5">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              totalSpotsCount={allRestaurants.length}
              matchedSpotsCount={matchedRestaurants.length}
            />
          </div>

          {/* Right Column: Randomized Results Viewport */}
          <div className="lg:col-span-7 xl:col-span-7">
            <section ref={resultsRef} className="scroll-mt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-xs">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-600" />
                    <span>
                      {mode === 'single' ? 'Winning Recommendation' : 'Top 3 Shortlist Matches'}
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {mode === 'single'
                      ? 'Your randomized spot with Google ratings, menu prices & reviews.'
                      : 'Compare 3 randomized candidates side-by-side to end group dining debates.'}
                  </p>
                </div>

                <button
                  onClick={handleRandomize}
                  disabled={isRolling || matchedRestaurants.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                  <span>Roll Again</span>
                </button>
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
                        setSelectedRestaurants([sim]);
                        setFocusedRestaurant(sim);
                        soundFx.playWinFanfare();
                      }}
                      similarPlaces={mode === 'single' ? getSimilarRestaurants(restaurant) : []}
                    />
                  ))}
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

      {/* Add Custom Spot Modal */}
      <AddCustomSpotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSpot={handleAddCustomSpot}
      />

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
