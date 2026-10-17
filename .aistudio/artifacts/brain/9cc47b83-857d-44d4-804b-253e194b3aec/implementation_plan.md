# Implementation Plan - Centralized Google Maps URI Resolution

## User Request
- Set the Google Maps redirect buttons on the page to redirect to the official URIs of the locations dynamically retrieved from Google Maps.
- Prioritize `restaurant.googleMapsUrl` directly with fallback.
- Centralize URI resolution logic in `getGoogleMapsPlaceUrl`.

## Proposed Changes

### 1. Centralize URI Priority in `src/utils/mapUrl.ts`
- Update `getGoogleMapsPlaceUrl` to check `restaurant.googleMapsUrl` first (if valid and non-empty).
- If `restaurant.googleMapsUrl` is missing or empty, fall back to `fetchPlaceDetailsNew` or universal search URL.

### 2. Verification
- Compile and test the applet to verify correct map redirect behavior across all restaurant cards, maps, and photo carousels.
