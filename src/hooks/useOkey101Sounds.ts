import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { store } from '@/lib/storage';

// Orijinal, kendi sentezledigimiz kisa efektler (assets/sounds/*.wav) —
// hicbir mevcut Okey uygulamasindan alinmadi, telif riski yok.
const SOUND_SOURCES = {
  tilePickup: require('../../assets/sounds/tile_pickup.wav'),
  tilePlace: require('../../assets/sounds/tile_place.wav'),
  discard: require('../../assets/sounds/discard.wav'),
  turnNotify: require('../../assets/sounds/turn_notify.wav'),
  openSuccess: require('../../assets/sounds/open_success.wav'),
  roundWin: require('../../assets/sounds/round_win.wav'),
} as const;

type SoundKey = keyof typeof SOUND_SOURCES;

export function useOkey101Sounds() {
  const [enabled, setEnabledState] = useState(true);
  const playersRef = useRef<Partial<Record<SoundKey, AudioPlayer>>>({});

  useEffect(() => {
    store.getOkey101Sound().then(setEnabledState);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(playersRef.current).forEach((p) => p?.remove());
    };
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    store.setOkey101Sound(v);
  }, []);

  const play = useCallback(
    (key: SoundKey) => {
      if (!enabled) return;
      try {
        let player = playersRef.current[key];
        if (!player) {
          player = createAudioPlayer(SOUND_SOURCES[key]);
          playersRef.current[key] = player;
        }
        player.seekTo(0);
        player.play();
      } catch {
        // sessizce yut - ses bir cekirdek ozellik degil
      }
    },
    [enabled]
  );

  return {
    enabled,
    setEnabled,
    playTilePickup: useCallback(() => play('tilePickup'), [play]),
    playTilePlace: useCallback(() => play('tilePlace'), [play]),
    playDiscard: useCallback(() => play('discard'), [play]),
    playTurnNotify: useCallback(() => play('turnNotify'), [play]),
    playOpenSuccess: useCallback(() => play('openSuccess'), [play]),
    playRoundWin: useCallback(() => play('roundWin'), [play]),
  };
}
