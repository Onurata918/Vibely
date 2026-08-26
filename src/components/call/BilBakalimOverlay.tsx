import { Check, Circle, Square, Triangle, X as XIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

const TILE_STYLES = [
  { bg: '#ef4444', Icon: Triangle },
  { bg: '#3b82f6', Icon: Circle },
  { bg: '#eab308', Icon: Square },
  { bg: '#22c55e', Icon: Triangle },
] as const;

export function BilBakalimOverlay() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { quiz: qz, closeQuiz, selectQuizOption, toggleQuizCorrectPlayer, nextQuizQuestion, restartQuiz } = useApp();

  if (!qz) return null;

  const question = qz.questions[qz.currentIndex];
  const isLast = qz.currentIndex === qz.questions.length - 1;

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeQuiz}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <XIcon size={17} color="#fff" />
      </Pressable>

      {(qz.phase === 'question' || qz.phase === 'revealed') && question ? (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: insets.bottom + 20, paddingTop: 60 }}>
          <Text style={{ textAlign: 'center', fontSize: 11.5, fontWeight: '700', color: '#635c73', letterSpacing: 0.6, marginBottom: 10 }}>
            {t('quizQuestionCounter', { current: qz.currentIndex + 1, total: qz.questions.length })}
          </Text>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 30 }}>{question.q}</Text>
            {qz.phase === 'question' ? (
              <Text style={{ fontSize: 12, color: '#635c73' }}>{t('quizTapAnswer')}</Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {question.options.map((opt, i) => {
              const style = TILE_STYLES[i];
              const revealed = qz.phase === 'revealed';
              const isCorrect = i === question.correct;
              const isWrongPick = revealed && qz.selectedIndex === i && !isCorrect;
              return (
                <Pressable
                  key={i}
                  disabled={revealed}
                  onPress={() => selectQuizOption(i)}
                  style={{
                    width: '47.5%',
                    minHeight: 76,
                    borderRadius: 16,
                    backgroundColor: style.bg,
                    padding: 12,
                    justifyContent: 'space-between',
                    opacity: revealed && !isCorrect && !isWrongPick ? 0.35 : 1,
                    borderWidth: revealed && (isCorrect || isWrongPick) ? 3 : 0,
                    borderColor: isWrongPick ? '#450a0a' : '#fff',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <style.Icon size={16} color="#fff" fill="#fff" />
                    {revealed && isCorrect ? <Check size={16} color="#fff" /> : null}
                    {isWrongPick ? <XIcon size={16} color="#fff" /> : null}
                  </View>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          {qz.phase === 'question' ? null : (
            <View style={{ marginTop: 16, gap: 10 }}>
              <Text style={{ fontSize: 11.5, color: '#8e879f', textAlign: 'center' }}>{t('quizWhoGotItRight')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {qz.players.map((p) => {
                  const selected = qz.correctPlayerIds.includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => toggleQuizCorrectPlayer(p.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: selected ? 'rgba(34,197,94,.16)' : '#141020',
                        borderWidth: 1,
                        borderColor: selected ? 'rgba(34,197,94,.5)' : 'rgba(255,255,255,.07)',
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                      }}
                    >
                      <Avatar person={p} size={24} />
                      <Text style={{ color: selected ? '#4ade80' : '#fff', fontSize: 12.5, fontWeight: '600' }}>{p.name}</Text>
                      {selected ? <Check size={13} color="#4ade80" /> : null}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={nextQuizQuestion}>
                <GradientView angle={90} style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{isLast ? t('quizSeeResultsButton') : t('quizNextQuestionButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}

      {qz.phase === 'final' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
          <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 44 }}>🏆</Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>{t('quizFinishedHeader')}</Text>
            <ScrollView style={{ width: '100%', maxHeight: 320 }} contentContainerStyle={{ gap: 8 }}>
              {[...qz.players]
                .sort((a, b) => (qz.scores[b.id] ?? 0) - (qz.scores[a.id] ?? 0))
                .map((p, i) => (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: i === 0 ? 'rgba(234,179,8,.12)' : '#141020',
                      borderWidth: 1,
                      borderColor: i === 0 ? 'rgba(234,179,8,.4)' : 'rgba(255,255,255,.07)',
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <Text style={{ fontSize: 15, width: 22 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</Text>
                    <Avatar person={p} size={34} />
                    <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 }}>{p.name}</Text>
                    <Text style={{ color: '#8b5cf6', fontWeight: '800', fontSize: 15 }}>{qz.scores[p.id] ?? 0}</Text>
                  </View>
                ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable onPress={closeQuiz} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('quizCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={restartQuiz}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('quizPlayAgainButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
