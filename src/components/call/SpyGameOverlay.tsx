import { Eye, EyeOff, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { GradientView } from '@/components/ui/GradientView';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

const DISCUSS_SECONDS = 300;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function SpyGameOverlay() {
  const insets = useSafeAreaInsets();
  const { spy, closeSpyGame, toggleSpyCard, nextSpyPlayer, startSpyVoting, castSpyVote, restartSpyGame } = useApp();
  const { t } = useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(DISCUSS_SECONDS);

  useEffect(() => {
    if (spy?.phase === 'discuss') setSecondsLeft(DISCUSS_SECONDS);
  }, [spy?.phase]);

  useEffect(() => {
    if (spy?.phase !== 'discuss' || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [spy?.phase, secondsLeft]);

  if (!spy) return null;

  const currentPlayer = spy.order[spy.revealIndex];
  const isSpyCard = currentPlayer?.id === spy.spyId;
  const votedPlayer = spy.order.find((p) => p.id === spy.votedId);
  const spyPlayer = spy.order.find((p) => p.id === spy.spyId);
  const guessedRight = spy.votedId === spy.spyId;

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={closeSpyGame}
        style={{ position: 'absolute', top: insets.top + 10, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={17} color="#fff" />
      </Pressable>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, paddingTop: 40 }}>
        {spy.phase === 'reveal' ? (
          <View style={{ width: '100%', alignItems: 'center', gap: 22 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#635c73', letterSpacing: 0.6 }}>
              {t('spyPlayerCounter', { current: spy.revealIndex + 1, total: spy.order.length })}
            </Text>
            <Avatar person={currentPlayer} size={64} />
            <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{currentPlayer?.name}</Text>

            <Pressable onPress={toggleSpyCard} style={{ width: '100%' }}>
              <GradientView
                angle={135}
                style={{
                  width: '100%',
                  minHeight: 190,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  opacity: spy.cardShown ? 1 : 0.9,
                }}
              >
                {!spy.cardShown ? (
                  <>
                    <Eye size={30} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
                      {t('spyTapToReveal')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                      {t('spyPhoneHolderHint', { name: currentPlayer?.name ?? '' })}
                    </Text>
                  </>
                ) : isSpyCard ? (
                  <>
                    <Text style={{ fontSize: 40 }}>🕵️</Text>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 }}>{t('spyYouAreSpy')}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>
                      {t('spySpyInstructions')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 40 }}>{spy.location?.emoji}</Text>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 }}>{spy.location?.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, marginTop: 6, textAlign: 'center' }}>
                      {t('spyVillagerInstructions')}
                    </Text>
                  </>
                )}
              </GradientView>
            </Pressable>

            {spy.cardShown ? (
              <Pressable onPress={nextSpyPlayer} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20 }}>
                <EyeOff size={15} color="#8e879f" />
                <Text style={{ color: '#8e879f', fontWeight: '600', fontSize: 13.5 }}>{t('spyHideAndNext')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {spy.phase === 'discuss' ? (
          <View style={{ width: '100%', alignItems: 'center', gap: 18 }}>
            <Text style={{ fontSize: 40 }}>🗣️</Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>{t('spyDiscussTitle')}</Text>
            <Text style={{ fontSize: 13, color: '#8e879f', textAlign: 'center', lineHeight: 19, maxWidth: 300 }}>
              {t('spyDiscussInstructions')}
            </Text>
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] }}>
              {`${pad(Math.floor(secondsLeft / 60))}:${pad(secondsLeft % 60)}`}
            </Text>
            <Pressable onPress={startSpyVoting} style={{ marginTop: 6 }}>
              <GradientView angle={90} style={{ height: 52, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('spyGoToVoteButton')}</Text>
              </GradientView>
            </Pressable>
          </View>
        ) : null}

        {spy.phase === 'vote' ? (
          <View style={{ width: '100%', gap: 14 }}>
            <View style={{ alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff' }}>{t('spyVoteTitle')}</Text>
              <Text style={{ fontSize: 12.5, color: '#8e879f' }}>{t('spyVoteSubtitle')}</Text>
            </View>
            <ScrollView style={{ maxHeight: 340, width: '100%' }} contentContainerStyle={{ gap: 9 }}>
              {spy.order.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => castSpyVote(p.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 16, padding: 12 }}
                >
                  <Avatar person={p} size={40} />
                  <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 14.5 }}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {spy.phase === 'result' ? (
          <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 44 }}>{guessedRight ? '🎉' : '😈'}</Text>
            <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              {guessedRight ? t('spyResultCorrect') : t('spyResultSpyEscaped')}
            </Text>
            <View style={{ width: '100%', backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 18, padding: 18, gap: 10 }}>
              <Row label={t('spyVotedLabel')} value={votedPlayer?.name ?? '—'} />
              <Row label={t('spyActualSpyLabel')} value={spyPlayer?.name ?? '—'} />
              <Row label={t('spyLocationLabel')} value={`${spy.location?.emoji} ${spy.location?.name}`} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <Pressable onPress={closeSpyGame} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('spyCloseButton')}</Text>
              </Pressable>
              <Pressable onPress={restartSpyGame}>
                <GradientView angle={90} style={{ height: 50, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('spyPlayAgainButton')}</Text>
                </GradientView>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: '#8e879f', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
