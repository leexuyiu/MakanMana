# Implementation Plan - Asian Fusion Cuisine Category, Hand-Calibrated Dataset & Google Maps Key Guard

## User Requirements & Architecture
1. **New Cuisine Category: `asian_fusion`**:
   - Add `'asian_fusion'` as a first-class cuisine category in `src/types/restaurant.ts`.
   - Add `Asian Fusion` chip/filter in `src/components/FilterBar.tsx`.
   - Categorize spots like `JIBRIL SS15` and other fusion venues under `asian_fusion`.
2. **Hand-Calibrate All 100 Dining Spots (`src/data/ssRestaurants.ts`)**:
   - **Cuisines**:
     - `asian_fusion`: JIBRIL SS15, Padi House, and other modern Asian fusion venues.
     - `malay`: Warung Soho, Nasi Lemak Royale, Village Park style spots, Ayam Goreng Berempah.
     - `western`: Jibby & Co, RATA, Cor Blimey! British Fish and Chips, Burgertory, The Daily Grind.
     - `mamak`: Nasi Kandar Pelita, Restoran Subang Corner, Restoran Bistari, Syed Bistro, Thaqwa.
     - `japanese`: Shin Zushi SS15, Jyu Raku Japanese Restaurant, Menya Hanabi, Tsukiji Sushi, Robata Izakaya, Wagyu & Rice, Rakuzen.
     - `korean`: Oiso Korean Restaurant, MyeongDong Topokki, DubuYo, K-BBQ spots.
     - `indian`: Banana leaf curry houses, Chettinad, D'Tandoor, Saravanaa.
     - `middle_eastern`: Authentic shawarma, mandi, and grilled meats.
     - `chinese`: Traditional pan mee, bak kut teh, claypot chicken rice, roasted meats, handmade noodles, dim sum.
     - `dessert`: Specialty cafes, boba, bakeries, ice cream/gelato (Rollney, Inside Scoop).
   - **Establishment Types**:
     - Accurately distribute across `Kopitiam`, `Hawker Centre`, `Late Night Mamak`, `Cafe`, `Restaurant`, and `Fast Casual`.
   - **Air-Conditioning (`hasAirCon`)**:
     - `hasAirCon: true` for enclosed, air-conditioned restaurants, cafes, and mall outlets.
     - `hasAirCon: false` for traditional open-air kopitiams, hawker stalls, and roadside mamaks with ceiling fans.
   - **Preserve Verified Place IDs and Google Maps URIs**:
     - Retain all authentic Google Place IDs (`ChIJ...`) and genuine `https://maps.google.com/?cid=...` URIs.
3. **Fix Google Maps Error ("This page can't load Google Maps correctly")**:
   - Create `.env` and `.env.example` defining `VITE_GOOGLE_MAPS_API_KEY=""`.
   - In `RestaurantCard.tsx`, add an API key guard:
     - When `apiKey` is provided, renders the interactive Google Map.
     - When `apiKey` is missing or invalid, renders a clean location preview card (address, transit proximity, and an active direct button to open the location on Google Maps), completely avoiding Google's gray error popup.
4. **Update Cache Version**:
   - Set cache key to `makanmana_curated_dataset_v5` in `src/services/placesSearchService.ts` to immediately update all browser sessions.

---

## Verification Plan
1. **Asian Fusion Cuisine Filter**:
   - Select `Asian Fusion`: verify `JIBRIL SS15` and Asian fusion restaurants appear.
2. **Cuisine & Type Accuracy**:
   - Filter by `Hawker Centre`: verify open-air hawker centres appear with `hasAirCon: false`.
   - Filter by `Japanese`, `Malay`, `Western`, `Mamak`: verify each category displays accurate spots.
3. **Google Maps UI**:
   - Verify that the card displays location details and the Google Maps button cleanly without any gray error overlay.
4. **Build & Lint**:
   - Run `compile_applet` and `lint_applet` to confirm zero errors.
