# Google Maps Exact Listing Titles & Official Place ID Integration

Standardize all curated Subang Jaya (SS15, SS14, SS13, SS18, SS19) restaurants with their verified, exact Google Maps business titles and canonical Google Place ID redirect URLs to eliminate invalid shortlinks and empty coordinate redirects.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed via user clarification:

- **Confirmed Decision 1 (Redirect URL Format)**: Adopt the official Google Place ID format (`https://www.google.com/maps/place/?q=place_id:{place_id}`), with a clean Universal Search fallback (`https://www.google.com/maps/search/?api=1&query=...`) for custom user-added spots.
- **Confirmed Decision 2 (Restaurant Naming Convention)**: Update all restaurant names in the app dataset to match the exact bilingual or registered business titles listed on Google Maps (e.g., `Restoran Ah Ping Bah Kut Teh 阿彬肉骨茶`, `Gold Chili`, `Q-Bistro SS15`, `Nasi Lemak Burung Hantu SS15`).
- **Confirmed Decision 3 (Elimination of Fragile Formats)**: Remove all synthetic `maps.app.goo.gl` shortlinks and fabricated internal hex `data=!3m2...1s0x...:0x...` tokens, preventing "Dynamic Link Not Found" and blank `/@lat,lng` redirects.

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades the restaurant catalog in Subang Jaya food guide so every card, map pin popup, and detail view links directly to the verified Google Maps place card without redirects, 404s, or mislocated branches.
- **Target Audience / Persona**: Food lovers, students, and locals in Subang Jaya (SS15/SS14/SS13/SS18/SS19) seeking accurate food recommendations and reliable one-tap navigation.
- **Key Value**: 100% reliable Google Maps redirection across desktop web, iOS, and Android Google Maps apps, displaying exact business hours, ratings, and navigation pins.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Browsing / Filtering**: Users browse curated restaurants filtered by area (SS15, SS14, etc.) or cuisine with exact Google Maps listing names prominently displayed.
  2. **Opening Location**: Clicking "Google Maps" on any restaurant card or map pin info window opens the exact verified place card via `place_id` directly in the user's native Google Maps app or browser.
  3. **Adding Custom Spots**: When a user adds a personal food spot, the app automatically generates a valid, standard Google Maps Search API URL formatted with the shop name, neighborhood, and city.
- **Visual Identity & Theme**:
  - Warm Malaysian food-guide aesthetic with amber/emerald highlights (`bg-amber-500`, `text-emerald-700`).
  - Clear, legible badges showing the exact location area (`SS15`, `SS14`, etc.) and verified checkmarks for confirmed Google Maps listings.
- **Interactive Feedback & Motion**:
  - Instant external launch with accessible `target="_blank"` and `rel="noopener noreferrer"`.
  - Badges indicating "Verified Google Maps Listing".

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Place ID URL Structure (`/maps/place/?q=place_id:{ID}`)**
  - *Chosen Approach*: `https://www.google.com/maps/place/?q=place_id:${placeId}`
  - *Why*: Immune to URL schema breakages, coordinate drifts, or internal `data=!3m2...` token corruption. Google guarantees that Place IDs permanently point to the exact business listing card.
  - *Alternatives Considered*: Internal hex format (`/place/{Name}/@{lat},{lng}...data=...`) was rejected due to frequent empty redirects (`/@lat,lng`) when internal CID tokens mismatch.
- **Decision 2: Shop Title Alignment**
  - *Chosen Approach*: Replace anglicized or abbreviated names with the exact registered Google Maps business title (including Chinese characters and branch prefixes where applicable).
  - *Why*: Prevents confusion when the user opens Google Maps and ensures search grounding matches real storefront signage.
- **Decision 3: Custom Spot Dynamic Fallback**
  - *Chosen Approach*: For newly added user spots where a Place ID is not yet queried, use Google's official Search API URL: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + area + ' Subang Jaya')}`.
  - *Why*: 100% resilient, guaranteed no-404 format across all mobile devices.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                      Restaurant Catalog                       │
│                   (src/data/ssRestaurants.ts)                 │
│  - exactName: string (matches Google Maps listing)            │
│  - placeId: string (immutable Google Place ID)                │
│  - address: verified scoped address (SS15, SS14, etc.)        │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    URL Generator Utility                      │
│                    (src/utils/mapUrl.ts)                      │
│                                                               │
│   if (restaurant.placeId) {                                   │
│     return `https://www.google.com/maps/place/?q=place_id:`   │
│            + restaurant.placeId                               │
│   } else {                                                    │
│     return `https://www.google.com/maps/search/?api=1&query=` │
│            + query                                            │
│   }                                                           │
└───────────────────────────────┬───────────────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
┌───────────────────────────────┐ ┌─────────────────────────────┐
│        RestaurantCard         │ │       InteractiveMap        │
│   (External Place Redirect)   │ │    (Marker & InfoWindow)    │
└───────────────────────────────┘ └─────────────────────────────┘
```

#### Data Model Updates (`src/types/restaurant.ts`)
- Add optional `placeId?: string` to `Restaurant` interface.
- Ensure `googleMapsUrl` retains full backward compatibility while favoring the verified `placeId` standard.

#### Execution Plan
1. Update `Restaurant` interface with `placeId?: string`.
2. Update `src/utils/mapUrl.ts` to output `https://www.google.com/maps/place/?q=place_id:{placeId}` when `placeId` is present, and clean universal query otherwise.
3. Systematically update all restaurants in `src/data/ssRestaurants.ts` with their exact Google Maps registered titles and corresponding verified Place IDs for SS15, SS14, SS13, SS18, and SS19.
4. Verify `RestaurantCard.tsx`, `InteractiveMap.tsx`, and `AddCustomSpotModal.tsx` link behavior.
5. Compile and test build integrity with zero warnings or errors.
