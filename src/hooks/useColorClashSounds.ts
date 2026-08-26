import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { store } from '@/lib/storage';

// Orijinal, kendi sentezledigimiz kisa efektler (assets/sounds/cc_*.wav) —
// hicbir mevcut kart oyunundan alinmadi, telif riski yok.
const SOUND_SOURCES = {
  cardPlay: require('../../assets/sounds/cc_card_play.wav'),
  draw: require('../../assets/sounds/cc_draw.wav'),
  action: require('../../assets/sounds/cc_action.wav'),
  wild: require('../../assets/sounds/cc_wild.wav'),
  penalty: require('../../assets/sounds/cc_penalty.wav'),
  lastCard: require('../../assets/sounds/cc_lastcard.wav'),
  win: require('../../assets/sounds/cc_win.wav'),
} as const;

type SoundKey = keyof typeof SOUND_SOURCES;

export function useColorClashSounds() {
  const [enabled, setEnabledState] = useState(true);
  const playersRef = useRef<Partial<Record<SoundKey, AudioPlayer>>>({});

  useEffect(() => {
    store.getOkey101Sound().then(setEnabledState); // ayni "Oyun Sesleri" tercihini paylasir
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
        // sessizce yut - ses cekirdek bir ozellik degil
      }
    },
    [enabled]
  );

  return {
    enabled,
    setEnabled,
    playCardPlay: useCallback(() => play('cardPlay'), [play]),
    playDraw: useCallback(() => play('draw'), [play]),
    playAction: useCallback(() => play('action'), [play]),
    playWild: useCallback(() => play('wild'), [play]),
    playPenalty: useCallback(() => play('penalty'), [play]),
    playLastCard: useCallback(() => play('lastCard'), [play]),
    playWin: useCallback(() => play('win'), [play]),
  };
}
