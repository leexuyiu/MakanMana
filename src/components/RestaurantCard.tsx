import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant';
import { soundFx } from '../utils/audioEffects';
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
  Copy,
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

interface OpeningStatus {
  isOpen: boolean;
  label: string;
}

function cleanTimeStr(str: string): string {
  return str.replace(/[\u202F\u00A0\u2009]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseTimeMinutes(raw: string, defaultPeriod: 'AM' | 'PM' | null): { minutes: number; display: string } | null {
  const cleaned = cleanTimeStr(raw);
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  let period = match[3] ? (match[3].toUpperCase() as 'AM' | 'PM') : defaultPeriod;
  if (!period) {
    period = h >= 7 && h <= 11 ? 'AM' : 'PM';
  }

  const display = `${h}${m > 0 ? `:${String(m).padStart(2, '0')}` : ':00'} ${period}`;

  let totalH = h;
  if (period === 'PM' && totalH < 12) totalH += 12;
  if (period === 'AM' && totalH === 12) totalH = 0;

  return { minutes: totalH * 60 + m, display };
}

function getCurrentSubangMinutes(): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    let h = 0;
    let m = 0;
    for (const part of parts) {
      if (part.type === 'hour') h = parseInt(part.value, 10);
      if (part.type === 'minute') m = parseInt(part.value, 10);
    }
    if (h === 24) h = 0;
    return h * 60 + m;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

function getOpeningStatus(openingHoursStr: string): OpeningStatus {
  if (!openingHoursStr) {
    return { isOpen: true, label: 'until late' };
  }

  const normalized = cleanTimeStr(openingHoursStr);

  if (/24\s*hours/i.test(normalized)) {
    return { isOpen: true, label: '24 Hours' };
  }

  if (/\bclosed\b/i.test(normalized)) {
    return { isOpen: false, label: 'opens at 10:00 AM' };
  }

  const withoutDay = normalized.replace(/^[A-Za-z]+:\s*/, '').replace(/\(.*?\)/g, '').trim();
  const shifts = withoutDay.split(',');
  const parsedShifts: {
    startM: number;
    endM: number;
    startDisplay: string;
    endDisplay: string;
    isOvernight: boolean;
  }[] = [];

  for (const shift of shifts) {
    const parts = shift.split(/[\u2013\u2014\-]/);
    if (parts.length === 2) {
      const startRaw = parts[0].trim();
      const endRaw = parts[1].trim();

      const endMatch = endRaw.match(/(AM|PM)/i);
      const endPeriod = endMatch ? (endMatch[1].toUpperCase() as 'AM' | 'PM') : null;

      const startParsed = parseTimeMinutes(startRaw, endPeriod === 'AM' ? 'AM' : null);
      const endParsed = parseTimeMinutes(endRaw, null);

      if (startParsed && endParsed) {
        parsedShifts.push({
          startM: startParsed.minutes,
          endM: endParsed.minutes,
          startDisplay: startParsed.display,
          endDisplay: endParsed.display,
          isOvernight: endParsed.minutes <= startParsed.minutes,
        });
      }
    }
  }

  if (parsedShifts.length === 0) {
    return { isOpen: true, label: 'until late' };
  }

  const currentMinutes = getCurrentSubangMinutes();

  // Check if currently open in any shift
  for (const s of parsedShifts) {
    if (s.isOvernight) {
      // Overnight (e.g. 16:00 to 02:00, or 11:00 to 12:00 AM)
      // Open if current time >= startM OR current time < endM
      if (currentMinutes >= s.startM || (s.endM > 0 && currentMinutes < s.endM)) {
        return { isOpen: true, label: `until ${s.endDisplay}` };
      }
    } else {
      if (currentMinutes >= s.startM && currentMinutes < s.endM) {
        return { isOpen: true, label: `until ${s.endDisplay}` };
      }
    }
  }

  // If closed, find next opening shift today or tomorrow
  const upcomingShifts = parsedShifts
    .filter((s) => s.startM > currentMinutes)
    .sort((a, b) => a.startM - b.startM);

  if (upcomingShifts.length > 0) {
    return { isOpen: false, label: `opens at ${upcomingShifts[0].startDisplay}` };
  }

  parsedShifts.sort((a, b) => a.startM - b.startM);
  return { isOpen: false, label: `opens at ${parsedShifts[0].startDisplay}` };
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

  const [copiedAddress, setCopiedAddress] = useState(false);

  const openStatus = getOpeningStatus(restaurant.openingHours);

  useEffect(() => {
    setPlaceRedirectUrl(restaurant.googleMapsUrl || '');
    setCopiedAddress(false);
  }, [restaurant.googleMapsUrl, restaurant.id, restaurant.name, restaurant.address]);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundFx.playFilterTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(restaurant.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 bg-white overflow-hidden w-full max-w-full ${
        isPrimaryWinner
          ? 'border-orange-500/80 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20'
          : 'border-stone-200/90 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Main Content Body - Compact spacing */}
      <div className="p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
        {/* ROW ABOVE SHOP TITLE: Tags (Area, Type, Cuisine, Price, Rating, Special Preferences) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs min-w-0">
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
        <div className="pt-0.5 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {placeRedirectUrl ? (
                <a
                  href={placeRedirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                  className="text-lg sm:text-xl font-extrabold text-stone-900 hover:text-orange-600 transition-colors tracking-tight leading-snug inline-flex items-center gap-1.5 group cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-orange-600 transition-colors shrink-0" />
                  <span className="group-hover:underline underline-offset-2 break-words">{restaurant.name}</span>
                </a>
              ) : (
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-snug break-words">
                  {restaurant.name}
                </h3>
              )}
            </div>

            {/* Open / Closed tag + label beside 'until x time' / 'opens at x time' */}
            <div className="inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              {openStatus.isOpen ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Open
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Closed
                </span>
              )}
              <span className={`text-xs font-medium ${openStatus.isOpen ? 'text-stone-600' : 'text-stone-500'}`}>
                {openStatus.label}
              </span>
            </div>
          </div>

          {/* Exact Address with Copy Address Button */}
          <div className="flex items-start justify-between gap-2 pt-0.5">
            <p className="text-xs text-stone-500 flex items-start gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed break-words">{restaurant.address}</span>
            </p>

            {/* Copy Address Button */}
            <button
              type="button"
              onClick={handleCopyAddress}
              title={copiedAddress ? 'Address copied!' : 'Copy address'}
              aria-label="Copy address"
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 cursor-pointer self-start ${
                copiedAddress
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              {copiedAddress ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Roll Again Button */}
        {onRollAgain && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onRollAgain}
              disabled={isRolling}
              className="w-full sm:w-4/5 max-w-xs mx-auto flex items-center justify-center gap-2.5 py-3.5 px-4 sm:px-6 bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-75 rounded-2xl active:scale-[0.98] min-w-0"
            >
              <RotateCcw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'Rolling...' : 'Roll Again !'}</span>
            </button>
          </div>
        )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 min-w-0">
            <span className="text-[10px] text-stone-400 font-medium text-left truncate min-w-0">
              Rolling from {matchedSpotsCount} places
            </span>
            <div className="flex justify-end shrink-0">
              {onRefreshPlaces && (
                <button
                  type="button"
                  onClick={onRefreshPlaces}
                  disabled={isLoadingPlaces}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RotateCw className={`w-3 h-3 ${isLoadingPlaces ? 'animate-spin' : ''}`} />
                  <span>{isLoadingPlaces ? 'Updating...' : 'Update places'}</span>
                </button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};
