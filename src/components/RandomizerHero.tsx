import React, { useState } from 'react';
import { RandomizerMode, Restaurant } from '../types/restaurant';
import { soundFx } from '../utils/audioEffects';
import {
  Dices,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Target,
  Shuffle,
  AlertCircle,
} from 'lucide-react';

interface RandomizerHeroProps {
  mode: RandomizerMode;
  onModeChange: (mode: RandomizerMode) => void;
  onRandomize: () => void;
  isRolling: boolean;
  eligibleCount: number;
  matchedRestaurants: Restaurant[];
}

export const RandomizerHero: React.FC<RandomizerHeroProps> = ({
  mode,
  onModeChange,
  onRandomize,
  isRolling,
  eligibleCount,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundFx.getMuted());

  const handleToggleSound = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundFx.playFilterTap();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white p-6 md:p-8 mb-8 shadow-xl">
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Headline & Decision Mode Switcher */}
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 bg-stone-800/80 border border-stone-700/80 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Subang Food Decision Engine</span>
            <span className="text-stone-500">·</span>
            <span className="text-stone-300">SS15 · SS14 · SS16 · SS18</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white text-balance leading-tight">
            Stop arguing about lunch & supper.
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed max-w-lg">
            Let the randomizer pick your next meal based on real Google reviews, dietary needs, and verified Subang locations.
          </p>

          {/* Mode Switcher: 1 Pick vs Top 3 Shortlist */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-xs text-stone-400 font-medium mr-1">Result Style:</span>
            <div className="inline-flex p-1 bg-stone-800/90 rounded-xl border border-stone-700">
              <button
                type="button"
                onClick={() => {
                  soundFx.playFilterTap();
                  onModeChange('single');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'single'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>1 Lucky Pick</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playFilterTap();
                  onModeChange('trio');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'trio'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Top 3 Shortlist</span>
              </button>
            </div>

            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors ml-2 ${
                isMuted
                  ? 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-white'
                  : 'bg-orange-500/20 border-orange-500/40 text-orange-300 hover:bg-orange-500/30'
              }`}
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right Side: Big High-Impact Roll Action */}
        <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto">
          {eligibleCount > 0 ? (
            <button
              onClick={onRandomize}
              disabled={isRolling}
              className={`group relative w-full md:w-64 h-16 md:h-20 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-base md:text-lg shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-3 px-6 cursor-pointer ${
                isRolling ? 'opacity-85 pointer-events-none' : ''
              }`}
            >
              <Dices
                className={`w-7 h-7 text-amber-200 transition-transform duration-500 ${
                  isRolling ? 'animate-spin' : 'group-hover:rotate-45'
                }`}
              />
              <span className="tracking-wide">
                {isRolling ? 'SHUFFLING...' : 'RANDOMIZE MEAL!'}
              </span>
            </button>
          ) : (
            <div className="bg-stone-800/90 border border-stone-700 rounded-2xl p-4 text-center max-w-xs">
              <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-stone-200">
                0 spots match your exact filter combination.
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Try unchecking some filters or resetting dietary/cuisine restrictions.
              </p>
            </div>
          )}

          <div className="text-center mt-2.5">
            <span className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
              <Shuffle className="w-3 h-3 text-stone-500" />
              Rolling from <strong className="text-stone-200">{eligibleCount}</strong> eligible Subang eateries
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
