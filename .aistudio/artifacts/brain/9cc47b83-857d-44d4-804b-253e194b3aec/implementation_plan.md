# Refinement Plan: Dataset Area Coverage, Geofencing & Card Copy Interactions

Refine MakanMana's **Sunway Velocity, Peel, MyTOWN & Plaza 393** discovery engine by enforcing strict **1.1km walking radius geofencing** (eliminating distant locations like Balakong), removing Jalan Cheras Batu 2 1/2 from search terms, strictly using the official **`place.googleMapsUri`** directly from the Google Places API query (without synthetic or fallback URL replacements), adding inline **copy buttons** for restaurant titles and addresses, and curating 200 verified dining spots strictly within the immediate walking perimeter.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions reflect your direct requirement:

- **Confirmed: Strictly Use `place.googleMapsUri` Only**:
  - We will **never replace** URLs with synthetic canonical URL schemes or hand-crafted place_id search links.
  - The curated dataset, cached dataset, and dynamic sync will **strictly use the exact `place.googleMapsUri`** returned by the Google Places API query.
  - For places in `velocityRestaurants.ts`, each spot's `googleMapsUrl` is updated to its verified, authentic `place.googleMapsUri` from the Google Places API.
- **Confirmed: Strict 1.1km Radial Geofencing around Plaza 393**:
  - Authoritative anchor coordinates are set at the **Plaza 393 / Sunway Velocity walking centroid (`3.1285 N, 101.7240 E`)**.
  - All places fetched from Google Places API or seeded in curated files must strictly satisfy `HaversineDistance <= 1.1km`.
  - Places located in distant districts (such as `Surubar Cheras` in Balakong at 11.1km, Cheras Selatan, Kajang, Ampang, or Connaught) are filtered out at both the API retrieval and dataset validation stages.
- **Confirmed: Removal of Jalan Cheras Batu 2 1/2**:
  - `Jalan Cheras Batu 2 1/2` and `Batu 2.5` are removed from `buildPlacesQuery`, `syncFreshPlacesDataset`, curated dataset entries, and UI copy.
  - The focus is tightened to the core walking enclave: **Sunway Velocity Mall & Velocity Two, MyTOWN Shopping Centre & IKEA Cheras, Jalan Peel, Queen's Avenue (Jalan Bayam), Plaza 393 (Jalan Shelley), and Jalan Kundur**.
- **Confirmed: Shop Title Redirect Link with Logo**:
  - Remove any separate maps redirect URL row or button.
  - Instead, the shop title itself is the clickable link using the authentic `place.googleMapsUri`, with the redirect logo (`ExternalLink` icon) positioned right beside the shop title, opening Google Maps in a new tab (`target="_blank" rel="noopener noreferrer"`).
- **Confirmed: One-Tap Copy Buttons for Title and Address**:
  - Discrete copy icon buttons (`Copy` icon with smooth state transition to emerald `Check` and "Copied!" feedback) are placed directly beside the restaurant title and the street address.
  - Users can copy the exact restaurant name or address for messaging, food delivery apps, or ride-hailing with a single tap.
- **Confirmed: 200 Curated Walking Enclave Spots & Cache Invalidation**:
  - The Velocity dataset cache key is bumped to `makanmana_curated_velocity_v2` to purge any stale, out-of-scope cached entries on user devices.
  - The curated file `velocityRestaurants.ts` is purged of out-of-boundary entries and filled to 200 verified eateries strictly within the walking zone, all with verified `googleMapsUri`s.

---

## 1. Overview & Core Concept

- **What It Does**: Provides high-accuracy, indecision-free meal recommendations in either **Subang Jaya** or the **Sunway Velocity & Peel** walking enclave. Every spot shown in the Velocity region is guaranteed to be within actual walking proximity of Plaza 393, Sunway Velocity, and MyTOWN.
- **Target Audience**: Office staff in Queen's Avenue and Velocity offices, residents of Plaza 393, Sunway Velocity Two, and Cochrane condos, shoppers at MyTOWN and Sunway Velocity, and evening hawker foodies on Jalan Peel.
- **Key Value**: Guarantees zero out-of-area recommendations, provides verified navigation links directly via official `place.googleMapsUri`, and offers instant clipboard copying for addresses and restaurant names.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Viewing the Winning Restaurant Card**:
   - The card displays the restaurant name as an interactive link with an `ExternalLink` icon and an adjacent **Copy Title** button.
   - Clicking the title opens the official `place.googleMapsUri` in a new browser tab.
   - Clicking the copy icon copies the title to the clipboard and shows an instant green checkmark and tooltip.
2. **Copying the Street Address**:
   - Beside the address pin and street text, a dedicated **Copy Address** button allows the user to copy the exact address in one tap.
3. **Region Switching & Geofence Integrity**:
   - Toggling to **Sunway Velocity / Peel** immediately pulls only places within 1.1km of Plaza 393 / Sunway Velocity.
   - No distant Cheras / Balakong locations appear in rolls, filter counts, or place updates.
4. **Synchronizing Places via "Update places"**:
   - Tapping "Update places" queries Google Places API using localized text queries biased to Sunway Velocity and Plaza 393, maps `place.googleMapsUri` directly, runs each place through the 1.1km Haversine distance gate, and fills the pool up to the selected target count.

### Visual Identity & Layout

- **Shop Title Header**:
  ```
  [Shop Name] [↗ External Link] [📋 Copy]        [🟢 Open until 10:00 PM]
  ```
- **Address Line**:
  ```
  [📍 Map Pin] 55, Jalan Peel, Maluri, 55100 Kuala Lumpur... [📋 Copy]
  ```
- **Copy Button Styling**:
  - Subtle button with `text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-lg transition-all`.
  - On copy success: transitions to `text-emerald-700 bg-emerald-100 ring-1 ring-emerald-300` with animated checkmark.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct `place.googleMapsUri` Mapping (Zero Synthetic URL Replacement)**:
  - *Chosen*: Map `place.googleMapsUri` directly from the Google Places API response without replacing or converting to synthetic URLs. In `mapGooglePlaceToRestaurant`:
    ```typescript
    const googleMapsUrl = place.googleMapsUri || '';
    ```
  - *Why*: Directly honors the user's requirement to preserve authentic Google Maps URIs provided by the Places API.

- **Decision 2: Dual-Layer Geofencing (API Bias + Client Haversine Filter)**:
  - *Chosen*: Apply `locationRestriction` in Google Places `searchText` with a circular boundary (`center: { latitude: 3.1285, longitude: 101.7240 }, radius: 1100.0`), combined with a client-side Haversine distance check (`distanceKm <= 1.10`) on every place before inserting into the dataset.
  - *Why*: Google Places TextSearch occasionally returns keyword matches outside the circle if a business has "Cheras" in its name or description. The client-side Haversine filter acts as a zero-tolerance gatekeeper, ensuring 100% boundary accuracy.
  - *Alternative Considered*: Postcode filtering alone. *Rejected*: Postcode `55100` spans large sections of Cheras and Kuala Lumpur fringe, whereas radial distance is mathematically precise.

- **Decision 3: Complete Removal of Batu 2 1/2**:
  - *Chosen*: Strip out all query tokens and dataset entries related to Jalan Cheras Batu 2 1/2.
  - *Why*: Batu 2 1/2 is further south along Jalan Cheras toward Miharja and causes Google Places text searches to bleed into broader Cheras and Balakong.

- **Decision 4: Cache Key Bump to `makanmana_curated_velocity_v2`**:
  - *Chosen*: Advance the cache storage key from `v1` to `v2`.
  - *Why*: Users who already visited the site have the previous dataset (including any out-of-scope spots) stored in `localStorage`. Incrementing the key forces an immediate clean re-sync with the sanitized dataset.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Top Navigation Header                     │
│  [MakanMana] · [Active Region Subtitle]  [Filters]  [Share]  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│              Top Region Switcher Segmented Control           │
│        [ 📍 Subang Jaya ]     [ 📍 Sunway Velocity / Peel ]   │
└──────────────────────────────┬───────────────────────────────┘
                               │ (selectedRegion)
          ┌────────────────────┴────────────────────┐
          ▼                                         ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Subang Jaya Dataset       │   │   Velocity & Peel Dataset v2  │
│  • SS15, SS14, SS16, SS18     │   │  • Velocity Mall & Two        │
│  • Authentic googleMapsUri    │   │  • MyTOWN & IKEA Cheras       │
│                               │   │  • Jalan Peel & Jalan Shelley │
│                               │   │  • Queen's Avenue & Kundur    │
│                               │   │  • Plaza 393 Enclave          │
│                               │   │  • Strict 1.1km Geofence Gate │
│                               │   │  • Authentic googleMapsUri    │
└───────────────┬───────────────┘   └───────────────┬───────────────┘
                │                                   │
                └─────────────────┬─────────────────┘
                                  │ activePlacesPool
┌─────────────────────────────────▼─────────────────────────────────┐
│                           FilterBar                               │
│  • Result Range (20/50/70/100/200)   • Dietary (Halal/Pork-free)  │
│  • Enclaves: Velocity & Peel         • Cuisine Category (Multi)   │
│  • Supper (>10pm) & Air-Con          • Rating & Price Tiers       │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ filteredSpots
┌─────────────────────────────────▼─────────────────────────────────┐
│                         RestaurantCard                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ [Shop Title Link (googleMapsUri) ↗] [📋 Copy]  [🟢 Open]   │  │
│  │ [📍 Address Text]    [📋 Copy Address]                       │  │
│  │ [★ 4.6 (1,240)]      [$$ RM 18 - 35]   [Area: Velocity]     │  │
│  │ [🔄 Roll Again !]   [Rolling from 200 places] [Update]     │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### Geofencing Configuration & Utilities

```typescript
export const VELOCITY_CENTER = {
  lat: 3.1285,
  lng: 101.7240,
  maxRadiusKm: 1.10, // Strict 1,100 meters boundary
};

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinVelocityBounds(lat: number, lng: number, address: string): boolean {
  // Disqualify known distant localities
  const lowerAddr = address.toLowerCase();
  if (/balakong|kajang|selatan|ampang|connaught|segar|mahkota cheras/i.test(lowerAddr)) {
    return false;
  }
  const dist = haversineDistanceKm(lat, lng, VELOCITY_CENTER.lat, VELOCITY_CENTER.lng);
  return dist <= VELOCITY_CENTER.maxRadiusKm;
}
```

---

## 5. Implementation Sequence

1. **Geofencing & Google Maps URI Handling (`src/services/placesSearchService.ts`)**:
   - In `mapGooglePlaceToRestaurant`, strictly assign `googleMapsUrl: place.googleMapsUri || ''` without synthetic fallback rewriting.
   - Add `VELOCITY_CENTER` and `haversineDistanceKm` helper.
   - Implement strict boundary checking `isWithinVelocityBounds`.
   - Update `buildPlacesQuery` to remove `Jalan Cheras Batu 2 1/2`.
   - In `syncFreshPlacesDataset`, add `locationRestriction` circle and post-fetch distance filtering:
     - Discard any place with distance > 1.1km.
     - Ensure `places.googleMapsUri` is requested in `X-Goog-FieldMask`.
   - Update cache key to `makanmana_curated_velocity_v2`.

2. **Clean & Validate Curated Dataset (`src/data/velocityRestaurants.ts`)**:
   - Filter out `Surubar Cheras` and any locations exceeding 1.1km from Plaza 393.
   - Remove Batu 2 1/2 references and replace with verified eateries inside Sunway Velocity Mall, Velocity Two, MyTOWN, Jalan Peel, Queen's Avenue, and Plaza 393.
   - Ensure all `googleMapsUrl` entries use authentic `place.googleMapsUri` URIs directly.
   - Ensure the list contains exactly 200 high-quality, verified spots.

3. **RestaurantCard Component Enhancements (`src/components/RestaurantCard.tsx`)**:
   - Make the shop title the sole clickable Google Maps link using `restaurant.googleMapsUrl` (`place.googleMapsUri`) with the `ExternalLink` icon.
   - Remove any separate maps redirect URL row or button.
   - Add inline `Copy` buttons for both the restaurant title and the address.
   - Implement visual copy state feedback (icon toggles to `Check`, tooltip "Copied!", sound tap).

4. **UI Copy & Footer Alignment (`src/App.tsx`)**:
   - Remove `Jalan Cheras Batu 2 1/2` from footer text and metadata captions.
   - Keep the focus cleanly on Sunway Velocity, MyTOWN, Jalan Peel, Queen's Avenue, Jalan Kundur, and Plaza 393.

5. **Verification & Testing**:
   - Run `compile_applet` and `lint_applet` to confirm zero compilation or lint errors.
   - Verify that clicking copy copies the exact text to clipboard.
   - Verify that clicking the title opens the official `place.googleMapsUri`.
   - Verify that all 200 items in the Velocity region fall strictly within the 1.1km radius.
