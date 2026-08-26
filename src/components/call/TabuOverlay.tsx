import { Check, SkipForward, X as XIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

const ROUND_SECONDS = 60;

export function TabuOverlay() {
  const insets = useSafeAreaInsets();
  const { tabu: t, closeTabu, startTabuRound, markTabuCorrect, markTabuSkip, endTabuRound, nextTabuPlayer, restartTabu } = useApp();
  const { t: tr } = useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);

  useEffect(() => {
    if (t?.phase === 'playing') setSecondsLeft(ROUND_SECONDS);
  }, [t?.phase]);

  useEffect(() => {
    if (t?.phase !== 'playing' || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [t?.phase, secondsLeft]);

  useEffect(() => {
    if (t?.phase === 'playing' && secondsLeft === 0) endTabuRound();
  }, [t?.phase, secondsLeft, endTabuRound]);

  if (!t) return null;

  const describer = t.order[t.describerIndex];

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeTabu}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <XIcon size={17} color="#fff" />
      </Pressable>

      {t.phase === 'ready' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ width: '100%', alignItems: 'center', gap: 22 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>{tr('tabuNextDescriberHeader')}</Text>
            <Avatar person={describer} size={64} />
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{describer?.name}</Text>
            <Text style={{ fontSize: 13, color: '#8e879f', textAlign: 'center', lineHeight: 19, maxWidth: 300 }}>
              {tr('tabuInstructions')}
            </Text>
            <Pressable onPress={startTabuRound} style={{ marginTop: 6 }}>
              <GradientView angle={90} style={{ height: 56, paddingHorizontal: 32, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{tr('tabuStartButton')}</Text>
              </GradientView>
            </Pressable>
          </View>
        </View>
      ) : null}

      {t.phase === 'playing' && t.card ? (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
          <View style={{ alignItems: 'center', gap: 2, marginBottom: 6 }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: secondsLeft <= 10 ? '#f87171' : '#fff', fontVariant: ['tabular-nums'] }}>
              {secondsLeft}
            </Text>
            <Text style={{ fontSize: 11.5, color: '#635c73' }}>{tr('tabuScoreLine', { correct: t.correctCount, skipped: t.skippedCount })}</Text>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
            <Text style={{ fontSize: 40, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t.card.word}</Text>
            <View style={{ width: '100%', maxWidth: 280, gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#f87171', textAlign: 'center', letterSpacing: 0.6 }}>{tr('tabuForbiddenWordsHeader')}</Text>
              {t.card.taboo.map((w) => (
                <View key={w} style={{ backgroundColor: 'rgba(239,68,68,.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,.3)', borderRadius: 12, paddingVertical: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#fca5a5', fontSize: 14, fontWeight: '600' }}>{w}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={markTabuSkip} style={{ flex: 1 }}>
              <View style={{ height: 64, borderRadius: 20, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <SkipForward size={18} color="#8e879f" />
                <Text style={{ color: '#8e879f', fontWeight: '700', fontSize: 15 }}>{tr('tabuSkipButton')}</Text>
              </View>
            </Pressable>
            <Pressable onPress={markTabuCorrect} style={{ flex: 1 }}>
              <View style={{ height: 64, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <Check size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{tr('tabuCorrectButton')}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      {t.phase === 'round-result' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 44 }}>⏰</Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{tr('tabuTimeUpHeader')}</Text>
            <Text style={{ fontSize: 13, color: '#8e879f' }}>{tr('tabuRoundSummary', { name: describer?.name ?? '', correct: t.correctCount, skipped: t.skippedCount })}</Text>

            {t.describedWords.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {t.describedWords.map((w, i) => (
                  <View key={i} style={{ backgroundColor: 'rgba(34,197,94,.14)', borderWidth: 1, borderColor: 'rgba(34,197,94,.35)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: '#4ade80', fontSize: 11.5, fontWeight: '600' }}>{w}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <ScrollView style={{ width: '100%', maxHeight: 200 }} contentContainerStyle={{ gap: 8, marginTop: 4 }}>
              {[...t.order]
                .sort((a, b) => (t.scores[b.id] ?? 0) - (t.scores[a.id] ?? 0))
                .map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 14, padding: 10 }}>
                    <Avatar person={p} size={32} />
                    <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 13.5 }}>{p.name}</Text>
                    <Text style={{ color: '#8b5cf6', fontWeight: '800', fontSize: 14 }}>{t.scores[p.id] ?? 0}</Text>
                  </View>
                ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable onPress={closeTabu} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{tr('tabuCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={nextTabuPlayer}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{tr('tabuNextPlayerButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
            <Pressable onPress={restartTabu}>
              <Text style={{ color: '#635c73', fontSize: 12, fontWeight: '600' }}>{tr('tabuResetRestart')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
