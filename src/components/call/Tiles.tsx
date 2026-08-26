import { CameraView, useCameraPermissions } from 'expo-camera';
import { Mic, MicOff, Plus, ScreenShare, VideoOff } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { initial } from '@/lib/utils';
import type { CallParticipant } from '@/lib/types';

const TILE_GAP = 8;

function LevelBar({ active }: { active: boolean }) {
  const w = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    if (!active) {
      w.setValue(0.2);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(w, { toValue: 0.85, duration: 380, useNativeDriver: false }),
        Animated.timing(w, { toValue: 0.3, duration: 420, useNativeDriver: false }),
        Animated.timing(w, { toValue: 0.6, duration: 300, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, w]);

  if (!active) return null;
  return (
    <View style={{ position: 'absolute', left: 8, right: 32, bottom: 22, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.16)', overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', borderRadius: 3, backgroundColor: '#22c55e', width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

export function SelfTile() {
  const { mic, cam, front, share, mediaErr, user } = useApp();
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (cam && !permission?.granted) requestPermission();
  }, [cam, permission?.granted, requestPermission]);

  const showCamera = cam && !share && permission?.granted;

  return (
    <View style={[styles.tile, mic ? styles.speaking : null, { backgroundColor: front ? '#2a1a5e' : '#1a3a5e' }]}>
      {showCamera ? (
        <CameraView style={StyleSheet.absoluteFill} facing={front ? 'front' : 'back'} mirror={front} />
      ) : share ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(139,92,246,.35)', alignItems: 'center', justifyContent: 'center' }]}>
          <ScreenShare size={20} color="rgba(255,255,255,.85)" />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={styles.faceText}>{initial(user?.name || t('you'))}</Text>
          {!cam ? (
            <View style={styles.camoff}>
              <VideoOff size={22} color="#8e879f" />
              <Text style={{ fontSize: 10, color: '#8e879f', marginTop: 6 }}>{mediaErr || t('cameraOff')}</Text>
            </View>
          ) : null}
        </View>
      )}

      <LevelBar active={mic && !share} />

      <Text style={styles.nameTag}>{`${t('you')}${share ? t('sharingSuffix') : front ? ' 🤳' : ' 📷'}`}</Text>
      <View style={[styles.micBadge, { backgroundColor: mic ? '#22c55e' : '#ef4444' }]}>
        {mic ? <Mic size={11} color="#fff" /> : <MicOff size={11} color="#fff" />}
      </View>
    </View>
  );
}

export function ParticipantTile({ p }: { p: CallParticipant }) {
  const { t } = useLanguage();
  return (
    <View style={[styles.tile, p.mic ? styles.speaking : null, { backgroundColor: p.bg }]}>
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Text style={styles.faceText}>{initial(p.name)}</Text>
        {!p.cam ? (
          <View style={styles.camoff}>
            <Text style={{ fontSize: 10, color: '#8e879f' }}>{t('cameraOff')}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.nameTag}>{p.name}</Text>
      <View style={[styles.micBadge, { backgroundColor: p.mic ? '#22c55e' : '#ef4444' }]}>
        {p.mic ? <Mic size={11} color="#fff" /> : <MicOff size={11} color="#fff" />}
      </View>
    </View>
  );
}

export function InviteTile({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <Pressable onPress={onPress} style={[styles.tile, styles.inviteTile]}>
      <Plus size={16} color="#8e879f" />
      <Text style={{ fontSize: 10.5, fontWeight: '600', color: '#8e879f', marginTop: 4 }}>{t('inviteAction')}</Text>
    </Pressable>
  );
}

export function TileGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    paddingHorizontal: 16,
  },
  tile: {
    width: '31.9%',
    aspectRatio: 3 / 3.5,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  speaking: {
    borderColor: '#8b5cf6',
  },
  inviteTile: {
    backgroundColor: '#141020',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.12)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceText: {
    fontSize: 30,
    fontWeight: '800',
    color: 'rgba(255,255,255,.92)',
  },
  camoff: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,4,12,.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTag: {
    position: 'absolute',
    left: 8,
    bottom: 7,
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  micBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
