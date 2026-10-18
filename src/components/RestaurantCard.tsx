import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant';
import {
  Star,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Check,
  Wind,
  Moon,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isPrimaryWinner?: boolean;
  onFocusOnMap?: (restaurant: Restaurant) => void;
  onRollAgain?: () => void;
  isRolling?: boolean;
  onRefreshPlaces?: () => void;
  isLoadingPlaces?: boolean;
  matchedSpotsCount?: number;
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
  onRefreshPlaces,
  isLoadingPlaces = false,
  matchedSpotsCount = 0,
}) => {
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

          {/* ACTION BUTTONS: Exact Google Maps Location, Roll Again, Update Places */}
          {placeRedirectUrl ? (
            <a
              href={placeRedirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              disabled
              title="Can't show on Google Maps for now"
              className="w-full inline-flex items-center justify-center gap-1.5 bg-stone-100 text-stone-400 font-semibold text-xs py-2.5 px-4 rounded-xl border border-stone-200 cursor-not-allowed shadow-none"
            >
              <span>Can't show on Google Maps for now</span>
            </button>
          )}

          {onRollAgain && (
            <button
              type="button"
              onClick={onRollAgain}
              disabled={isRolling}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-75 rounded-xl"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'Rolling...' : 'Roll Again !'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            {onRefreshPlaces && (
              <button
                type="button"
                onClick={onRefreshPlaces}
                disabled={isLoadingPlaces}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50 ml-auto"
              >
                <RotateCw className={`w-3 h-3 ${isLoadingPlaces ? 'animate-spin' : ''}`} />
                <span>{isLoadingPlaces ? 'Updating...' : 'Update places'}</span>
              </button>
            )}
            <span className="text-[10px] text-stone-400 font-medium">
              Rolling from {matchedSpotsCount} places
            </span>
          </div>
      </div>
    </div>
  );
};
