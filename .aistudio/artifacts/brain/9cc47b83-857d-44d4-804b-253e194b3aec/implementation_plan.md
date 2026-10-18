# Implementation Plan - Replace Curated Dataset with Genuine Google Places Data & Strict googleMapsUri Handling

## Problem Diagnosis
1. **Inaccurate placeId and googleMapsUri in Curated Dataset**:
   - The curated dataset contained synthesized fallback IDs (e.g. `spot-subang-XX`) and search URLs rather than official Google Place IDs (`ChIJ...`) and real Google Maps URIs (`https://maps.google.com/?cid=...`).
2. **Need for Strict googleMapsUri Usage**:
   - Per requirements, every occurrence must strictly use the official `googleMapsUri` directly returned by Google Places API (New), defaulting strictly to an empty string `""` without custom synthetic fallback URLs.
3. **Frontend Empty State Handling**:
   - Wherever redirect buttons or map links encounter an empty `googleMapsUri`, they must display a disabled state with `"Can't show on Google Maps for now"` and an explanatory tooltip.

---

## Proposed Changes

### 1. Fetch Real Places Across SS15, SS14, SS16 & SS18 and Update `src/data/ssRestaurants.ts`
- Execute multi-area queries directly to Google Places API (New) (`v1/places:searchText`) for:
  - `restaurants and cafes in SS15 Subang Jaya`
  - `restaurants and hawkers in SS14 Subang Jaya`
  - `restaurants and eateries in SS16 Subang Jaya`
  - `restaurants in SS18 Subang Jaya`
- Request fields:
  `places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.priceLevel,places.primaryType,places.types,places.editorialSummary,places.regularOpeningHours`
- Generate and overwrite `src/data/ssRestaurants.ts` with 100 genuine dining spots, where each entry contains its actual Google Place ID and authentic `googleMapsUrl: place.googleMapsUri || ''`.

### 2. Strict `googleMapsUri` Handling in `src/services/placesSearchService.ts`
- Set `googleMapsUrl: place.googleMapsUri || ''` across all mapping functions without synthetic search URL fallbacks.
- Update cache comparison and sync logic to ensure only authentic Places API records are retained.

### 3. Frontend Fallback Display for Empty `googleMapsUri`
- **`src/components/RestaurantCard.tsx`**:
  - When `restaurant.googleMapsUrl` is present: renders external link button to Google Maps.
  - When `restaurant.googleMapsUrl` is empty: renders a disabled button with `"Can't show on Google Maps for now"` and a tooltip.
- **`src/components/PhotoCarousel.tsx`**:
  - When URL is empty, displays disabled status `"Can't show on Google Maps for now"` instead of attempting navigation.
- **`src/components/InteractiveMap.tsx`**:
  - In the marker InfoWindow, if `activeMarkerUrl` is empty, displays a subtle `"Can't show on Google Maps for now"` text tag instead of an active link.

---

## Verification Plan
1. **API Data Verification**:
   - Inspect `src/data/ssRestaurants.ts` to confirm every entry possesses an authentic `placeId` (`ChIJ...`) and genuine `googleMapsUrl` (`https://maps.google.com/?cid=...`).
2. **Compilation & Linting**:
   - Run `compile_applet` and `lint_applet` to confirm zero errors.
3. **Redirect & Fallback Verification**:
   - Click "View on Google Maps" on restaurants in the card, photo carousel, and interactive map; verify they navigate directly to the verified Google Maps place page.
   - Verify that any place with empty URL renders the disabled `"Can't show on Google Maps for now"` button state.
