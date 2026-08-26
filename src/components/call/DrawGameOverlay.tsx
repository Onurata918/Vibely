import { Check, Eraser, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

const ROUND_SECONDS = 70;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function DrawingCanvas() {
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef('');
  const [, forceRender] = useState(0);

  // PanResponder, GestureHandlerRootView (kok layout'ta) ile web'de
  // catisip touch olaylarini yakalamiyordu; bunun yerine ayni kutuphanenin
  // (react-native-gesture-handler) kendi Pan gesture'ini kullaniyoruz.
  // useMemo sart: her render'da yeni bir Gesture objesi olusturulursa
  // (cizerken forceRender her hareket icin re-render tetikliyor)
  // GestureDetector handler'i sürekli yeniden bagliyor ve jest hic
  // tamamlanamiyordu.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart((e) => {
          currentPath.current = `M${e.x.toFixed(1)},${e.y.toFixed(1)}`;
          forceRender((n) => n + 1);
        })
        .onUpdate((e) => {
          currentPath.current += ` L${e.x.toFixed(1)},${e.y.toFixed(1)}`;
          forceRender((n) => n + 1);
        })
        .onEnd(() => {
          // currentPath.current'i setPaths'in guncelleyici fonksiyonu
          // calismadan once temizlersek (React bu cagriyi hemen degil
          // sonra calistirabiliyor), guncelleyici bos string okur.
          // Once sabit bir degiskene alip ref'i ondan sonra temizliyoruz.
          const finished = currentPath.current;
          currentPath.current = '';
          if (finished) setPaths((p) => [...p, finished]);
          forceRender((n) => n + 1);
        }),
    []
  );

  return (
    <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' }}>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }}>
          <Svg style={{ flex: 1 }}>
            {paths.map((d, i) => (
              <Path key={i} d={d} stroke="#141020" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {currentPath.current ? (
              <Path d={currentPath.current} stroke="#141020" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
          </Svg>
        </View>
      </GestureDetector>
      <Pressable
        onPress={() => setPaths([])}
        style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(20,16,32,.85)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Eraser size={15} color="#fff" />
      </Pressable>
    </View>
  );
}

export function DrawGameOverlay() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { drawGame: dg, closeDrawGame, startDrawingRound, markGuessed, markTimeout, nextDrawRound, restartDrawGame } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [cardShown, setCardShown] = useState(false);

  useEffect(() => {
    if (dg?.phase === 'drawing') setSecondsLeft(ROUND_SECONDS);
    if (dg?.phase === 'reveal') setCardShown(false);
  }, [dg?.phase]);

  useEffect(() => {
    if (dg?.phase !== 'drawing' || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [dg?.phase, secondsLeft]);

  useEffect(() => {
    if (dg?.phase === 'drawing' && secondsLeft === 0) markTimeout();
  }, [dg?.phase, secondsLeft, markTimeout]);

  if (!dg) return null;

  const drawer = dg.order[dg.drawerIndex];
  const guessers = dg.order.filter((p) => p.id !== drawer?.id);
  const winner = dg.order.find((p) => p.id === dg.winnerId);

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeDrawGame}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      {dg.phase === 'reveal' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ width: '100%', alignItems: 'center', gap: 22 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>{t('drawNextDrawerHeader')}</Text>
            <Avatar person={drawer} size={64} />
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{drawer?.name}</Text>

            <Pressable onPress={() => setCardShown((v) => !v)} style={{ width: '100%' }}>
              <GradientView angle={135} style={{ width: '100%', minHeight: 150, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                {!cardShown ? (
                  <>
                    <Text style={{ fontSize: 30 }}>🎨</Text>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 10, textAlign: 'center' }}>
                      {t('drawTapToReveal')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                      {t('drawDontPeek')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 }}>{t('drawWordHeader')}</Text>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24, marginTop: 8 }}>{dg.word}</Text>
                  </>
                )}
              </GradientView>
            </Pressable>

            {cardShown ? (
              <Pressable onPress={startDrawingRound}>
                <GradientView angle={90} style={{ height: 52, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('drawHideAndStartButton')}</Text>
                </GradientView>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {dg.phase === 'drawing' ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 12 }}>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 12, color: '#8e879f' }}>{t('drawDrawerLabel', { name: drawer?.name ?? '' })}</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: secondsLeft <= 10 ? '#f87171' : '#fff', fontVariant: ['tabular-nums'] }}>
              {`${pad(Math.floor(secondsLeft / 60))}:${pad(secondsLeft % 60)}`}
            </Text>
          </View>

          <DrawingCanvas />

          <View style={{ gap: 9 }}>
            <Text style={{ fontSize: 11.5, color: '#635c73', textAlign: 'center' }}>{t('drawSelectGuesser')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {guessers.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => markGuessed(p.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(34,197,94,.4)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Check size={13} color="#22c55e" />
                  <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={markTimeout} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14 }}>
              <Text style={{ color: '#635c73', fontSize: 12, fontWeight: '600' }}>{t('drawNobodyGuessedButton')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {dg.phase === 'round-result' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 44 }}>{dg.roundResult === 'guessed' ? '🎉' : '⏰'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {dg.roundResult === 'guessed' ? t('drawWinnerGuessed', { name: winner?.name ?? '' }) : t('drawTimeUpNoGuess')}
            </Text>
            <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('drawWordReveal', { word: dg.word ?? '' })}</Text>

            <ScrollView style={{ width: '100%', maxHeight: 220 }} contentContainerStyle={{ gap: 8 }}>
              {[...dg.order]
                .sort((a, b) => (dg.scores[b.id] ?? 0) - (dg.scores[a.id] ?? 0))
                .map((p) => (
                  <View
                    key={p.id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 14, padding: 10 }}
                  >
                    <Avatar person={p} size={32} />
                    <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 13.5 }}>{p.name}</Text>
                    <Text style={{ color: '#8b5cf6', fontWeight: '800', fontSize: 14 }}>{dg.scores[p.id] ?? 0}</Text>
                  </View>
                ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable onPress={closeDrawGame} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('drawCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={nextDrawRound}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('drawNextDrawerButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
            <Pressable onPress={restartDrawGame}>
              <Text style={{ color: '#635c73', fontSize: 12, fontWeight: '600' }}>{t('drawResetAndRestart')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
