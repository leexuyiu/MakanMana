import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  Star,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Check,
  Compass,
  Sparkles,
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
  ReceiptText,
  AlertCircle,
  Wind,
  Moon,
  RotateCcw,
} from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isPrimaryWinner?: boolean;
  onFocusOnMap?: (restaurant: Restaurant) => void;
  onRollAgain?: () => void;
  isRolling?: boolean;
}

function formatClosingLabel(hours: string): string {
  if (!hours) return 'until late';
  if (hours.toLowerCase().includes('24 hours')) {
    return '24 Hours';
  }
  // Matches "11:00 AM – 11:30 PM (Daily)" or "7:00 AM - 2:30 PM"
  const match = hours.match(/[–-]\s*([0-9]{1,2}(?::[0-9]{2})?\s*(?:AM|PM|am|pm))/i);
  if (match && match[1]) {
    return `until ${match[1].trim()}`;
  }
  const parts = hours.split(/[–-]/);
  if (parts.length > 1) {
    const raw = parts[parts.length - 1].replace(/\(.*?\)/g, '').trim();
    if (raw) return `until ${raw}`;
  }
  return `until ${hours.replace(/\(.*?\)/g, '').trim()}`;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isPrimaryWinner = false,
  onFocusOnMap,
  onRollAgain,
  isRolling = false,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setMapError(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);

    // Also listen for Google Maps auth failure globally or map error events
    (window as any).gm_authFailure = () => {
      setMapError(true);
    };

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
      if ((window as any).gm_authFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(isPrimaryWinner);
  const hasMenuPrices = Boolean(restaurant.menuHighlights && restaurant.menuHighlights.length > 0);

  const [placeRedirectUrl, setPlaceRedirectUrl] = useState<string>(() => {
    return restaurant.googleMapsUrl || '';
  });

  useEffect(() => {
    setPlaceRedirectUrl(restaurant.googleMapsUrl || '');
  }, [restaurant.googleMapsUrl, restaurant.id]);

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 bg-white overflow-hidden ${
        isPrimaryWinner
          ? 'border-orange-500/80 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20'
          : 'border-stone-200/90 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Top Header: Roll Again Button at Top of Card */}
      {onRollAgain && (
        <button
          type="button"
          onClick={onRollAgain}
          disabled={isRolling}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-75"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
          <span>{isRolling ? 'Rolling...' : 'Roll Again'}</span>
        </button>
      )}

      {/* Main Content Body - Compact spacing */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* ROW ABOVE SHOP TITLE: Tags (Area, Type, Cuisine, Price, Rating, Special Preferences) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Area */}
          <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
            {restaurant.area}
          </span>

          {/* Establishment Type */}
          <span className="text-stone-600 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded text-[11px] font-medium">
            {restaurant.restaurantType}
          </span>

          {/* Cuisine Category / Cuisine Name */}
          <span className="text-orange-800 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded text-[11px] font-semibold">
            {restaurant.cuisine}
          </span>

          {/* Price Range & Estimate */}
          <span className="font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px] font-semibold">
            {restaurant.priceEstimate}
          </span>

          {/* Google Rating with Review Count */}
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-950 border border-amber-200/90 font-bold px-2 py-0.5 rounded text-[11px]">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="font-mono">{restaurant.rating.toFixed(1)}</span>
            <span className="text-stone-500 font-normal">
              ({restaurant.reviewCount.toLocaleString()})
            </span>
          </span>

          {/* Special Preferences: Dietary & Seating & Supper */}
          {restaurant.dietary.isHalal && (
            <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Halal
            </span>
          )}
          {restaurant.dietary.isPorkFree && !restaurant.dietary.isHalal && (
            <span className="text-teal-800 bg-teal-50 border border-teal-200 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
              <Check className="w-3 h-3 text-teal-600" />
              Pork-Free
            </span>
          )}
          {restaurant.dietary.isVegetarian && (
            <span className="text-green-800 bg-green-50 border border-green-200 text-[11px] font-semibold px-2 py-0.5 rounded">
              Vegetarian
            </span>
          )}
          {restaurant.hasAirCon ? (
            <span className="text-sky-800 bg-sky-50 border border-sky-200 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-600" />
              Air-Con
            </span>
          ) : (
            <span className="text-stone-600 bg-stone-100 text-[11px] font-medium px-2 py-0.5 rounded">
              Open-Air
            </span>
          )}
          {restaurant.isLateNight && (
            <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-600" />
              Supper
            </span>
          )}
        </div>

        {/* SHOP TITLE & OPERATION TIME TAG */}
        <div className="pt-0.5 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-snug">
              {restaurant.name}
            </h3>

            {/* Green 'Open' tag + label beside 'until x time' */}
            <div className="inline-flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Open
              </span>
              <span className="text-xs text-stone-600 font-medium">
                {formatClosingLabel(restaurant.openingHours)}
              </span>
            </div>
          </div>

          {/* Exact Address */}
          <p className="text-xs text-stone-500 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{restaurant.address}</span>
          </p>
        </div>

        {/* ACCORDION: Menu & Food Prices (Directly below shop title) */}
        <div className="rounded-2xl border border-stone-200/90 overflow-hidden bg-stone-50/70">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-stone-800 hover:bg-stone-100/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-orange-600" />
              <span className="text-stone-900 font-bold">Food & Menu Prices</span>
              {hasMenuPrices ? (
                <span className="text-[10px] text-stone-600 bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono">
                  {restaurant.menuHighlights.length} items listed
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                  Not listed
                </span>
              )}
            </div>
            <div className="text-stone-400">
              {isMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isMenuOpen && (
            <div className="px-3 pb-3 pt-1 border-t border-stone-200/60 bg-white space-y-2 text-xs">
              {hasMenuPrices ? (
                <>
                  <div className="space-y-1.5">
                    {restaurant.menuHighlights.map((menu, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="font-medium text-stone-800 truncate">{menu.item}</span>
                          {menu.tag && (
                            <span className="text-[9px] bg-orange-100 text-orange-800 font-semibold px-1.5 py-0.2 rounded shrink-0">
                              {menu.tag}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-stone-900 shrink-0">
                          {menu.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1.5 text-[11px] text-stone-500">
                    <span>
                      Average per person:{' '}
                      <strong className="text-stone-700">{restaurant.priceEstimate}</strong>
                    </span>
                    {placeRedirectUrl ? (
                      <a
                        href={placeRedirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Check full menu on Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-stone-400 font-medium inline-flex items-center gap-1" title="Can't show on Google Maps for now">
                        Can't show on Google Maps for now
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-2.5 px-2 text-center text-stone-500 space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-amber-600 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>Food prices are not currently available for this spot.</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    You can view the latest user-uploaded menu boards and receipts directly on Google Maps.
                  </p>
                  {placeRedirectUrl ? (
                    <a
                      href={placeRedirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <span>View Menu on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      disabled
                      title="Can't show on Google Maps for now"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-400 rounded-lg text-xs font-semibold cursor-not-allowed border border-stone-200/60"
                    >
                      <span>Can't show on Google Maps for now</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SUMMARY OF GOOGLE REVIEWS - Compact */}
        <div className="bg-stone-50/90 rounded-2xl p-2.5 sm:p-3 border border-stone-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-0.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-orange-600" />
            <span>Summary of Google Reviews</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed italic">
            "{restaurant.reviewSummary}"
          </p>
        </div>

        {/* ACTION BUTTONS: Exact Google Maps Location & Pin on Interactive Map */}
        <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
          {placeRedirectUrl ? (
            <a
              href={placeRedirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              disabled
              title="Can't show on Google Maps for now"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-stone-100 text-stone-400 font-semibold text-xs py-2.5 px-4 rounded-xl border border-stone-200 cursor-not-allowed shadow-none"
            >
              <span>Can't show on Google Maps for now</span>
            </button>
          )}

          {onFocusOnMap && (
            <button
              onClick={() => onFocusOnMap(restaurant)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Locate on interactive map below"
            >
              <Compass className="w-3.5 h-3.5 text-orange-600" />
              <span>Pin on Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Interactive Location Map at the bottom of the card (only shown when map works properly and not shuffling) */}
      {apiKey && !mapError && !isRolling && (
        <div className="border-t border-stone-200/90 bg-stone-50/70 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>Interactive Location Map</span>
            </div>
            <span className="text-[11px] font-medium text-stone-500">
              {restaurant.area} · {restaurant.lrtProximity}
            </span>
          </div>

          <div className="h-52 sm:h-60 w-full rounded-2xl overflow-hidden border border-stone-200 relative bg-stone-100">
            <APIProvider
              apiKey={apiKey}
              onError={() => setMapError(true)}
            >
              <Map
                key={restaurant.id}
                defaultCenter={{ lat: restaurant.lat, lng: restaurant.lng }}
                center={{ lat: restaurant.lat, lng: restaurant.lng }}
                defaultZoom={16}
                gestureHandling="greedy"
                disableDefaultUI={false}
                className="w-full h-full"
              >
                <AdvancedMarker position={{ lat: restaurant.lat, lng: restaurant.lng }}>
                  <Pin
                    background="#ea580c"
                    glyphColor="#ffffff"
                    borderColor="#c2410c"
                    scale={1.1}
                  />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          </div>
        </div>
      )}
    </div>
  );
};
