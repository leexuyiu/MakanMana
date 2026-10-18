# Implementation Plan - Permanently Remove Embedded Interactive Map from Restaurant Card

## Problem Diagnosis
1. **Flashing Map Component**:
   - Even with error states and guards, the `@vis.gl/react-google-maps` `APIProvider` and `Map` components mount asynchronously when a place is selected or rolled, causing a brief flash before realizing quotas are exhausted or errors occur.
2. **User Preference**:
   - The user explicitly requested to **"Completely disable and remove the embedded map component from the card"** since Google Maps quota is exhausted.

---

## Proposed Changes

### 1. Remove Embedded Map from `src/components/RestaurantCard.tsx`
- Remove all imports related to `@vis.gl/react-google-maps` (`APIProvider`, `Map`, `AdvancedMarker`, `Pin`).
- Remove the embedded map render block entirely from the bottom of `RestaurantCard.tsx`.
- Retain the clean, fast action buttons ("Open in Google Maps", "Pin on Map" external scroll/focus) and all other restaurant details (ratings, menu prices, reviews, dietary badges, closing hours).

### 2. Clean Up Unused Code
- Remove `mapError`, `window.gm_authFailure`, and quota event listeners from `RestaurantCard.tsx`.

---

## Verification Plan
1. **Compilation & Linting**:
   - Run `compile_applet` and `lint_applet` to confirm zero errors.
2. **Visual Verification**:
   - Verify that selecting or rolling restaurants shows no map component or flashing whatsoever, while retaining exact Google Maps external links and address details.
