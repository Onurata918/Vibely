import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { localizeDataName } from '@/lib/i18n/itemNames.data';

export function BlindRankOverlay() {
  const { rank, closeRankGame, resetRankRound, placeCurrentRank, finishRankGame } = useApp();
  const { t, language } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (rank && !permission?.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!rank]);

  if (!rank) return null;

  const current = rank.current ? rank.pool.find((f) => f.id === rank.current) : null;
  const filledCount = rank.slots.filter(Boolean).length;
  const small = rank.slotsCount > 14 ? 'lg' : rank.slotsCount > 10 ? 'md' : 'base';
  const thumbSize = small === 'lg' ? 27 : small === 'md' ? 40 : 52;
  const numFont = small === 'lg' ? 13 : small === 'md' ? 15 : 19;
  const nameFont = small === 'lg' ? 9.5 : small === 'md' ? 11 : 12;
  const rowGap = small === 'lg' ? 3 : small === 'md' ? 4 : 5;

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black" pointerEvents="box-none">
      <View style={StyleSheet.absoluteFill}>
        {permission?.granted ? <CameraView style={StyleSheet.absoluteFill} facing="front" mirror /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0b0714' }]} />}
      </View>

      <View style={{ position: 'absolute', left: '50%', right: 6, top: 56, alignItems: 'center', gap: 8 }}>
        {current ? (
          <>
            {current.photo ? (
              <Image
                source={{ uri: current.photo }}
                style={{
                  width: 210,
                  height: 210,
                  borderRadius: 45,
                  borderWidth: 4,
                  borderColor: '#fff',
                  backgroundColor: rank.isLogo ? '#fff' : undefined,
                }}
                contentFit={rank.isLogo ? 'contain' : 'cover'}
              />
            ) : (
              <Text style={{ fontSize: 150 }}>{current.e}</Text>
            )}
            <View style={{ backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 26, paddingHorizontal: 18, paddingVertical: 7 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{localizeDataName(current.n, language)}</Text>
            </View>
          </>
        ) : (
          <View style={{ backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 5 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{t('rankAllRankedMsg')}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={{ position: 'absolute', left: 10, right: '48%', top: 58, bottom: 60 }}
        contentContainerStyle={{ gap: rowGap, flexGrow: 1, justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
      >
        {rank.slots.map((id, i) => {
          const f = id ? rank.pool.find((x) => x.id === id) : null;
          const disabled = !current || !!f;
          return (
            <Pressable
              key={i}
              disabled={disabled}
              onPress={() => placeCurrentRank(i)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: rowGap + 2,
                paddingVertical: 5,
                paddingHorizontal: 7,
                borderRadius: thumbSize * 0.22,
                backgroundColor: f ? 'rgba(255,255,255,.08)' : 'transparent',
              }}
            >
              <Text style={{ width: numFont + 8, textAlign: 'center', fontSize: numFont, fontWeight: '800', color: '#fff' }}>{i + 1}</Text>
              <View
                style={{
                  width: thumbSize,
                  height: thumbSize,
                  borderRadius: thumbSize * 0.28,
                  overflow: 'hidden',
                  backgroundColor: f ? 'rgba(255,255,255,.94)' : 'rgba(255,255,255,.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {f?.photo ? (
                  <Image source={{ uri: f.photo }} style={{ width: '100%', height: '100%' }} contentFit={rank.isLogo ? 'contain' : 'cover'} />
                ) : f ? (
                  <Text style={{ fontSize: thumbSize * 0.5 }}>{f.e}</Text>
                ) : null}
              </View>
              {f ? (
                <Text numberOfLines={1} style={{ flex: 1, fontSize: nameFont, fontWeight: '700', color: '#fff' }}>
                  {localizeDataName(f.n, language)}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={closeRankGame}
        style={{ position: 'absolute', top: 54, left: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,.5)', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 16 }}>
        <Text style={{ flex: 1, fontSize: 11.5, color: '#fff', opacity: 0.9 }}>{t('rankProgressLabel', { filled: filledCount, total: rank.slotsCount })}</Text>
        <Pressable onPress={resetRankRound} style={{ height: 38, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)' }}>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#fff' }}>{t('rankRestartButton')}</Text>
        </Pressable>
        <Pressable
          onPress={finishRankGame}
          disabled={filledCount === 0}
          style={{ height: 38, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6', opacity: filledCount === 0 ? 0.4 : 1 }}
        >
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#fff' }}>{t('rankShareButton')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
