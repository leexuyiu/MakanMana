import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant';
import {
  Store,
  Utensils,
  BookOpen,
  MapPin,
  ExternalLink,
  Flame,
  Wind,
  CheckCircle2,
  Train,
  ImageOff,
} from 'lucide-react';

interface PhotoCarouselProps {
  restaurant: Restaurant;
  className?: string;
}

type TabType = 'storefront' | 'food' | 'menu';

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ restaurant, className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('food');
  const [imageError, setImageError] = useState<Record<TabType, boolean>>({
    storefront: false,
    food: false,
    menu: false,
  });

  const handleImageError = (tab: TabType) => {
    setImageError((prev) => ({ ...prev, [tab]: true }));
  };

  const currentPhotoUrl =
    activeTab === 'storefront'
      ? restaurant.photos.storefront
      : activeTab === 'food'
      ? restaurant.photos.food
      : restaurant.photos.menu;

  const isCurrentPhotoAvailable = Boolean(currentPhotoUrl && !imageError[activeTab]);

  const [mapPlaceUrl, setMapPlaceUrl] = useState<string>(() => {
    return restaurant.googleMapsUrl || '';
  });

  useEffect(() => {
    if (restaurant.googleMapsUrl) {
      setMapPlaceUrl(restaurant.googleMapsUrl);
    }
  }, [restaurant.googleMapsUrl]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm ${className}`}>
      {/* 3-Photo Segmented Switcher */}
      <div className="flex border-b border-stone-200 bg-stone-50/80 p-1.5 text-xs font-medium">
        <button
          onClick={() => setActiveTab('storefront')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
            activeTab === 'storefront'
              ? 'bg-white text-stone-900 shadow-sm font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Storefront</span>
          {!restaurant.photos.storefront && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">Vibe Card</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('food')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
            activeTab === 'food'
              ? 'bg-white text-stone-900 shadow-sm font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Food Sample</span>
          {!restaurant.photos.food && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">Flavour</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
            activeTab === 'menu'
              ? 'bg-white text-stone-900 shadow-sm font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Main Menu</span>
          {!restaurant.photos.menu && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">Prices</span>
          )}
        </button>
      </div>

      {/* Visual Display Container */}
      <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
        {isCurrentPhotoAvailable && currentPhotoUrl ? (
          <div className="relative w-full h-full group">
            <img
              src={currentPhotoUrl}
              alt={`${restaurant.name} - ${activeTab}`}
              referrerPolicy="no-referrer"
              onError={() => handleImageError(activeTab)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Context Badge in Photo Corner */}
            <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
              {activeTab === 'storefront' && (
                <>
                  <Store className="w-3 h-3 text-amber-400" />
                  <span>Storefront / Seating Environment</span>
                </>
              )}
              {activeTab === 'food' && (
                <>
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>Signature Food Serving</span>
                </>
              )}
              {activeTab === 'menu' && (
                <>
                  <BookOpen className="w-3 h-3 text-blue-400" />
                  <span>Verified Menu & Price List</span>
                </>
              )}
            </div>

            <a
              href={mapPlaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-white text-stone-800 text-[11px] font-medium px-2 py-1 rounded-md shadow-sm transition-colors flex items-center gap-1"
            >
              <span>View full photos</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          /* Tailored Fallback Cards when no photo is available */
          <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-stone-50 to-stone-100">
            {activeTab === 'storefront' && (
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span className="flex items-center gap-1 text-stone-700 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      Street View & Vibe Snapshot
                    </span>
                    <span className="text-[11px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded font-medium">
                      No Storefront Photo Uploaded
                    </span>
                  </div>
                  <h4 className="font-semibold text-stone-900 text-sm">{restaurant.name}</h4>
                  <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">{restaurant.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 my-2">
                  <div className="bg-white/80 border border-stone-200/80 rounded-xl p-2">
                    <span className="text-[10px] text-stone-500 block">LRT Transit Proximity</span>
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Train className="w-3 h-3 text-emerald-600" />
                      {restaurant.lrtProximity}
                    </span>
                  </div>
                  <div className="bg-white/80 border border-stone-200/80 rounded-xl p-2">
                    <span className="text-[10px] text-stone-500 block">Seating Atmosphere</span>
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Wind className="w-3 h-3 text-blue-600" />
                      {restaurant.hasAirCon ? 'Air-Conditioned Indoor' : 'Open-Air Hawker Setup'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                  <span className="text-[11px] text-stone-500">
                    Hours: <strong className="text-stone-700">{restaurant.openingHours}</strong>
                  </span>
                  <a
                    href={mapPlaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Inspect Street on Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'food' && (
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-orange-700 font-semibold">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      Foodie Flavour & Signature Dishes
                    </span>
                    <span className="text-[11px] text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded font-medium">
                      Dish Showcase
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {restaurant.signatureDishes.map((dish, i) => (
                      <span
                        key={i}
                        className="bg-orange-50 border border-orange-200 text-orange-950 font-medium text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-orange-600" />
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/90 border border-stone-200 rounded-xl p-2.5 mt-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 block mb-0.5">
                    What Foodies Praise Most
                  </span>
                  <p className="text-xs text-stone-700 italic line-clamp-2 leading-relaxed">
                    "{restaurant.reviewSummary}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                  <span className="text-xs font-semibold text-stone-800">
                    Est. per pax: <strong className="text-orange-600">{restaurant.priceEstimate}</strong>
                  </span>
                  <a
                    href={mapPlaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Browse 50+ Food Photos</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'menu' && (
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-blue-700 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Signature Price Sheet & Order Guide
                    </span>
                    <span className="text-[11px] text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded font-medium">
                      Curated Prices
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {restaurant.menuHighlights.map((menu, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white/90 border border-stone-200/70 rounded-lg px-2.5 py-1 text-xs"
                      >
                        <span className="font-medium text-stone-800 flex items-center gap-1.5">
                          {menu.item}
                          {menu.tag && (
                            <span className="text-[9px] bg-orange-100 text-orange-800 font-semibold px-1 rounded">
                              {menu.tag}
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-semibold text-stone-900">{menu.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 mt-1">
                  <span className="text-[11px] text-stone-500">
                    Dietary: {restaurant.dietary.isHalal ? 'Halal' : restaurant.dietary.isPorkFree ? 'Pork-Free' : 'Standard Non-Halal'}
                  </span>
                  <a
                    href={mapPlaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Open User Menu Photos</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
