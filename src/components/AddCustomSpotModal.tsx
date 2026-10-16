import React, { useState } from 'react';
import { CuisineCategory, Restaurant, RestaurantType } from '../types/restaurant';
import { soundFx } from '../utils/audioEffects';
import { X, Plus, Sparkles, MapPin, ShieldCheck } from 'lucide-react';

interface AddCustomSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSpot: (spot: Restaurant) => void;
}

export const AddCustomSpotModal: React.FC<AddCustomSpotModalProps> = ({
  isOpen,
  onClose,
  onAddSpot,
}) => {
  const [name, setName] = useState('');
  const [area, setArea] = useState<'SS15' | 'SS14' | 'SS16' | 'SS18'>('SS15');
  const [cuisine, setCuisine] = useState('');
  const [cuisineCategory, setCuisineCategory] = useState<CuisineCategory>('chinese');
  const [restaurantType, setRestaurantType] = useState<RestaurantType>('Kopitiam');
  const [priceTier, setPriceTier] = useState<'$' | '$$' | '$$$'>('$');
  const [priceEstimate, setPriceEstimate] = useState('RM 10 - 15');
  const [rating, setRating] = useState('4.3');
  const [reviewCount, setReviewCount] = useState('150');
  const [reviewSummary, setReviewSummary] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openingHours, setOpeningHours] = useState('10:00 AM – 10:00 PM');
  const [lrtProximity, setLrtProximity] = useState('350m from SS15 LRT');
  const [signatureDishes, setSignatureDishes] = useState('');
  const [photoStorefront, setPhotoStorefront] = useState('');
  const [photoFood, setPhotoFood] = useState('');
  const [photoMenu, setPhotoMenu] = useState('');

  const [isHalal, setIsHalal] = useState(false);
  const [isPorkFree, setIsPorkFree] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [hasAirCon, setHasAirCon] = useState(true);
  const [isLateNight, setIsLateNight] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundFx.playWinFanfare();

    // Default lat/lng based on area
    const areaCoords: Record<string, { lat: number; lng: number }> = {
      SS15: { lat: 3.0760 + (Math.random() - 0.5) * 0.003, lng: 101.5890 + (Math.random() - 0.5) * 0.003 },
      SS14: { lat: 3.0695 + (Math.random() - 0.5) * 0.003, lng: 101.5875 + (Math.random() - 0.5) * 0.003 },
      SS16: { lat: 3.0820 + (Math.random() - 0.5) * 0.003, lng: 101.5835 + (Math.random() - 0.5) * 0.003 },
      SS18: { lat: 3.0620 + (Math.random() - 0.5) * 0.003, lng: 101.5860 + (Math.random() - 0.5) * 0.003 },
    };

    const newSpot: Restaurant = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      area,
      cuisine: cuisine.trim() || 'Local Delights',
      cuisineCategory,
      restaurantType: restaurantType === 'All' ? 'Restaurant' : restaurantType,
      dietary: {
        isHalal,
        isPorkFree,
        isVegetarian,
      },
      priceRange: priceTier,
      priceEstimate: priceEstimate.trim() || 'RM 12 - 20',
      rating: parseFloat(rating) || 4.2,
      reviewCount: parseInt(reviewCount, 10) || 50,
      reviewSummary:
        reviewSummary.trim() ||
        'User-submitted local hidden gem in Subang Jaya. Highly recommended by locals.',
      address: address.trim() || `SS ${area.replace('SS', '')}, Subang Jaya, Selangor`,
      googleMapsUrl:
        googleMapsUrl.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          name.trim() + ' ' + area + ' Subang Jaya'
        ).replace(/%20/g, '+')}`,
      lat: areaCoords[area].lat,
      lng: areaCoords[area].lng,
      isLateNight,
      isStudentBudget: priceTier === '$',
      hasAirCon,
      openingHours: openingHours.trim() || '10:00 AM – 10:00 PM',
      lrtProximity: lrtProximity.trim() || `Near ${area} LRT`,
      signatureDishes: signatureDishes
        ? signatureDishes.split(',').map((d) => d.trim()).filter(Boolean)
        : ['Signature Special', 'Chef Special'],
      photos: {
        storefront: photoStorefront.trim() || undefined,
        food: photoFood.trim() || undefined,
        menu: photoMenu.trim() || undefined,
      },
      menuHighlights: [
        { item: 'Signature Special', price: priceEstimate.split('-')[0]?.trim() || 'RM 12.00' },
      ],
      isCustom: true,
    };

    onAddSpot(newSpot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">Add Custom Subang Spot</h3>
              <p className="text-xs text-stone-500">
                Include your secret stall or favorite hidden restaurant into the randomizer.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Name & Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">Restaurant / Stall Name *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Restoran Fook Seng Pan Mee"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Area *</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as 'SS15' | 'SS14' | 'SS16' | 'SS18')}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              >
                <option value="SS15">SS15 (Commercial/INTI)</option>
                <option value="SS14">SS14 (Hawker Hub)</option>
                <option value="SS16">SS16 (Parade/Empire)</option>
                <option value="SS18">SS18 (Residential/Hawker)</option>
              </select>
            </div>
          </div>

          {/* Cuisine & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Cuisine Specialty</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g. Hakka Pan Mee / Claypot BKT"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Cuisine Group</label>
              <select
                value={cuisineCategory}
                onChange={(e) => setCuisineCategory(e.target.value as CuisineCategory)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              >
                <option value="chinese">Chinese</option>
                <option value="malay">Malay</option>
                <option value="indian">Indian (North/South)</option>
                <option value="mamak">Mamak (Indian Muslim)</option>
                <option value="japanese">Japanese</option>
                <option value="korean">Korean</option>
                <option value="western">Western & Burgers</option>
                <option value="middle_eastern">Middle Eastern</option>
                <option value="dessert">Desserts & Drinks</option>
              </select>
            </div>
          </div>

          {/* Establishment Type & Price Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Place Type</label>
              <select
                value={restaurantType}
                onChange={(e) => setRestaurantType(e.target.value as RestaurantType)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              >
                <option value="Kopitiam">Kopitiam</option>
                <option value="Hawker Centre">Hawker Centre / Stall</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Late Night Mamak">Late Night Mamak</option>
                <option value="Fast Casual">Fast Casual</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Price Tier</label>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value as '$' | '$$' | '$$$')}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              >
                <option value="$">$ (&lt; RM 15 Budget)</option>
                <option value="$$">$$ (RM 15 - 35 Mid)</option>
                <option value="$$$">$$$ (&gt; RM 35 Premium)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Price Estimate</label>
              <input
                type="text"
                value={priceEstimate}
                onChange={(e) => setPriceEstimate(e.target.value)}
                placeholder="e.g. RM 10 - 15"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Dietary Checkboxes */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <span className="font-bold text-stone-800 block mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Dietary Certifications & Options
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHalal}
                  onChange={(e) => setIsHalal(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-stone-700 font-medium">Halal Certified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPorkFree}
                  onChange={(e) => setIsPorkFree(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-stone-700 font-medium">Pork-Free</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVegetarian}
                  onChange={(e) => setIsVegetarian(e.target.checked)}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-stone-700 font-medium">Vegetarian Friendly</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAirCon}
                  onChange={(e) => setHasAirCon(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-stone-700 font-medium">Air-Conditioned</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLateNight}
                  onChange={(e) => setIsLateNight(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-stone-700 font-medium">Open Past 10 PM</span>
              </label>
            </div>
          </div>

          {/* Rating & Review Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Google Rating</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">Signature Dishes (comma-separated)</label>
              <input
                type="text"
                value={signatureDishes}
                onChange={(e) => setSignatureDishes(e.target.value)}
                placeholder="e.g. Signature Pork Noodle, Char Siew Rice, Kopi Peng"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Google Review Highlights</label>
            <textarea
              rows={2}
              value={reviewSummary}
              onChange={(e) => setReviewSummary(e.target.value)}
              placeholder="What do Google reviewers love about this place? (e.g. great wok hei, crispy chicken, fast queue)"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Address & Google Maps link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12, Jalan SS 15/4D, Subang Jaya"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Google Maps Link (Optional)</label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Photo URLs (Storefront, Food, Menu) */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <span className="font-bold text-stone-800 block mb-2">Optional Photo URLs (Leave blank for auto-fallbacks)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Storefront / Interior URL</label>
                <input
                  type="url"
                  value={photoStorefront}
                  onChange={(e) => setPhotoStorefront(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Food Sample Photo URL</label>
                <input
                  type="url"
                  value={photoFood}
                  onChange={(e) => setPhotoFood(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">Main Menu Photo URL</label>
                <input
                  type="url"
                  value={photoMenu}
                  onChange={(e) => setPhotoMenu(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-sm"
            >
              Add to Randomizer Pool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
