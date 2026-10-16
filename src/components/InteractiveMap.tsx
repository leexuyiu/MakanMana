import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Restaurant } from '../types/restaurant';
import { getGoogleMapsPlaceUrl } from '../utils/mapUrl';
import { MapPin, Star, ExternalLink, Navigation } from 'lucide-react';

interface InteractiveMapProps {
  restaurants: Restaurant[];
  selectedRestaurants: Restaurant[];
  focusedRestaurant: Restaurant | null;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

const SUBANG_CENTER = { lat: 3.0755, lng: 101.5885 };

// Inner controller that handles programmatic map camera panning without fighting user drag
const MapCameraController: React.FC<{
  focusedRestaurant: Restaurant | null;
  resetTrigger: number;
}> = ({ focusedRestaurant, resetTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (focusedRestaurant) {
      map.panTo({ lat: focusedRestaurant.lat, lng: focusedRestaurant.lng });
      map.setZoom(16);
    }
  }, [map, focusedRestaurant]);

  useEffect(() => {
    if (!map || resetTrigger === 0) return;
    map.panTo(SUBANG_CENTER);
    map.setZoom(14);
  }, [map, resetTrigger]);

  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  restaurants,
  selectedRestaurants,
  focusedRestaurant,
  onSelectRestaurant,
}) => {
  const [activeMarkerPlace, setActiveMarkerPlace] = useState<Restaurant | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  // When focusedRestaurant changes, also open its InfoWindow
  useEffect(() => {
    if (focusedRestaurant) {
      setActiveMarkerPlace(focusedRestaurant);
    }
  }, [focusedRestaurant]);

  const selectedIds = new Set(selectedRestaurants.map((r) => r.id));
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handleResetMap = () => {
    setResetTrigger((prev) => prev + 1);
    setActiveMarkerPlace(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 md:p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Interactive Subang Jaya Location Map</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Hold and drag with your mouse to explore the enclaves. Orange pins are your randomized picks.
          </p>
        </div>

        <button
          onClick={handleResetMap}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 text-stone-500" />
          <span>Reset Map View</span>
        </button>
      </div>

      <div className="h-[380px] md:h-[440px] w-full rounded-2xl overflow-hidden border border-stone-200 relative bg-stone-100">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={SUBANG_CENTER}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            <MapCameraController
              focusedRestaurant={focusedRestaurant}
              resetTrigger={resetTrigger}
            />

            {/* Candidate Markers */}
            {restaurants.map((place) => {
              const isSelected = selectedIds.has(place.id);
              return (
                <AdvancedMarker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => {
                    setActiveMarkerPlace(place);
                    onSelectRestaurant?.(place);
                  }}
                  title={place.name}
                  zIndex={isSelected ? 100 : 10}
                >
                  <Pin
                    background={isSelected ? '#EA580C' : '#475569'}
                    borderColor={isSelected ? '#C2410C' : '#1E293B'}
                    glyphColor="#FFFFFF"
                    scale={isSelected ? 1.25 : 0.9}
                  />
                </AdvancedMarker>
              );
            })}

            {/* InfoWindow for Clicked Marker */}
            {activeMarkerPlace && (
              <InfoWindow
                position={{ lat: activeMarkerPlace.lat, lng: activeMarkerPlace.lng }}
                onCloseClick={() => setActiveMarkerPlace(null)}
              >
                <div className="p-1 max-w-xs text-stone-900 font-sans">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium mb-0.5">
                    <span className="font-bold text-orange-600">{activeMarkerPlace.area}</span>
                    <span>·</span>
                    <span>{activeMarkerPlace.cuisine}</span>
                  </div>
                  <h4 className="font-bold text-sm text-stone-900 leading-tight">
                    {activeMarkerPlace.name}
                  </h4>
                  <div className="flex items-center gap-1.5 my-1 text-xs">
                    <div className="flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{activeMarkerPlace.rating}</span>
                    </div>
                    <span className="text-stone-400">·</span>
                    <span className="font-semibold text-stone-700">
                      {activeMarkerPlace.priceEstimate}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 line-clamp-2 mt-1">
                    {activeMarkerPlace.reviewSummary}
                  </p>
                  <a
                    href={getGoogleMapsPlaceUrl(activeMarkerPlace)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
};
