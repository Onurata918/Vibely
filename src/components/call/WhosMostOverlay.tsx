import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useWhosMostGame } from '@/hooks/useWhosMostGame';
import { computeWhosMostResult, questionText } from '@/lib/whosMost/engine';
import type { WhosMostCategoryFilter, WhosMostQuestionCount, WhosMostSettings, WhosMostVoteSeconds, WhosMostVoter } from '@/lib/whosMost/types';
import { DEFAULT_WHOS_MOST_SETTINGS } from '@/lib/whosMost/types';

type Seat = { id: string; name: string; c1: string; c2: string };

const CATEGORY_OPTIONS: WhosMostCategoryFilter[] = ['mixed', 'personality', 'friendship', 'love', 'funny', 'future', 'party', 'savage', 'adventure'];
const QUESTION_COUNT_OPTIONS: WhosMostQuestionCount[] = [5, 10, 'endless'];
const VOTE_SECONDS_OPTIONS: WhosMostVoteSeconds[] = [10, 15, 20, 0];

const CATEGORY_KEY: Record<WhosMostCategoryFilter, string> = {
  mixed: 'whosMostCatMixed',
  personality: 'whosMostCatPersonality',
  friendship: 'whosMostCatFriendship',
  love: 'whosMostCatLove',
  funny: 'whosMostCatFunny',
  future: 'whosMostCatFuture',
  party: 'whosMostCatParty',
  savage: 'whosMostCatSavage',
  adventure: 'whosMostCatAdventure',
};

function CloseButton({ onPress, top }: { onPress: () => void; top: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ position: 'absolute', top, left: 14, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}
    >
      <X size={17} color="#fff" />
    </Pressable>
  );
}

function GradientButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.5 : 1 }}>
      <LinearGradient colors={['#3b82f6', '#8b5cf6', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 52, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#8b5cf6' : '#1b1629',
        borderWidth: 1,
        borderColor: active ? '#8b5cf6' : 'rgba(255,255,255,.08)',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );
}

function Toggle({ label, sub, value, onPress }: { label: string; sub?: string; value: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: sub ? 58 : 46, paddingHorizontal: 14, borderRadius: 13, backgroundColor: '#1b1629', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{label}</Text>
        {sub ? <Text style={{ color: '#8e879f', fontSize: 11, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <View style={{ width: 40, height: 24, borderRadius: 12, backgroundColor: value ? '#8b5cf6' : 'rgba(255,255,255,.14)', padding: 2, alignItems: value ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );
}

export function WhosMostOverlay({ participants, onClose }: { participants: Seat[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user } = useApp();
  const game = useWhosMostGame();
  const g = game.state;

  const [settings, setSettings] = useState<WhosMostSettings>(DEFAULT_WHOS_MOST_SETTINGS);
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const voters: WhosMostVoter[] = useMemo(
    () => [{ id: 'me', name: user?.name || t('you'), c1: '#6366f1', c2: '#ec4899' }, ...participants],
    [participants, user?.name, t]
  );

  const round = g.round;
  const currentVoterId = round ? round.voterOrder[round.currentVoterIndex] : null;
  const currentVoter = currentVoterId ? g.voters.find((v) => v.id === currentVoterId) ?? voters.find((v) => v.id === currentVoterId) ?? null : null;

  // Her tur / her yeni oy sirasi degistiginde "telefonu devret" ekranina don.
  useEffect(() => {
    setRevealed(false);
  }, [round?.question.id, round?.currentVoterIndex]);

  // Sadece o an oy kullanan kisiye ozel geri sayim — el degistirdikce sifirlanir.
  useEffect(() => {
    if (!round || round.status !== 'voting' || !revealed || settings.voteSeconds === 0) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(settings.voteSeconds);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s === null ? null : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [round?.question.id, round?.currentVoterIndex, revealed, settings.voteSeconds, round?.status]);

  useEffect(() => {
    if (secondsLeft === 0) game.timerExpired();
  }, [secondsLeft, game]);

  const startSession = () => game.startSession(voters, settings);

  if (g.phase === 'setup') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 70, paddingBottom: 40, gap: 16 }}>
          <Text style={{ fontSize: 34 }}>🗳️</Text>
          <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('whosMostSetupTitle')}</Text>
          <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{t('whosMostSetupSubtitle')}</Text>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('whosMostCategoryLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <Chip key={c} label={t(CATEGORY_KEY[c])} active={settings.category === c} onPress={() => setSettings((s) => ({ ...s, category: c }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('whosMostQuestionsLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {QUESTION_COUNT_OPTIONS.map((qc) => (
                <Chip key={String(qc)} label={qc === 'endless' ? t('whosMostQuestionsEndless') : String(qc)} active={settings.questionCount === qc} onPress={() => setSettings((s) => ({ ...s, questionCount: qc }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('whosMostTimerLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {VOTE_SECONDS_OPTIONS.map((s) => (
                <Chip key={s} label={s === 0 ? t('whosMostTimerOff') : `${s}s`} active={settings.voteSeconds === s} onPress={() => setSettings((v) => ({ ...v, voteSeconds: s }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%' }}>
            <Toggle
              label={t('whosMostAnonymousLabel')}
              sub={t('whosMostAnonymousSub')}
              value={settings.anonymous}
              onPress={() => setSettings((s) => ({ ...s, anonymous: !s.anonymous }))}
            />
          </View>

          {voters.length <= 2 ? <Text style={{ fontSize: 11.5, color: '#8e879f', textAlign: 'center' }}>{t('whosMostTwoPlayersNote')}</Text> : null}

          <GradientButton label={t('whosMostStartButton')} onPress={startSession} />
        </ScrollView>
      </View>
    );
  }

  if (g.phase === 'summary') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
          <Text style={{ fontSize: 44 }}>🎉</Text>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('whosMostSummaryTitle')}</Text>
          <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('whosMostSummarySubtitle', { count: g.questionsPlayed })}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Pressable onPress={onClose} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('whosMostCloseButton')}</Text>
            </Pressable>
            <GradientButton label={t('whosMostPlayAgainButton')} onPress={game.restart} />
          </View>
        </View>
      </View>
    );
  }

  if (!round) return null;

  const q = questionText(round.question, language);
  const votedCount = Object.keys(round.votes).length;

  if (round.status === 'revealing') {
    const result = computeWhosMostResult(round);
    const winners = g.voters.filter((v) => result.winnerIds.includes(v.id));
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 12 }}>
          <Text style={{ fontSize: 13, color: '#8e879f', textAlign: 'center' }}>{q}</Text>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{t('whosMostRevealTitle')}</Text>

          {winners.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#8e879f', marginTop: 8 }}>{t('whosMostNoVotes')}</Text>
          ) : (
            <>
              {result.isTie ? <Text style={{ fontSize: 13, color: '#a78bfa', fontWeight: '700' }}>{t('whosMostTieLabel')}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 18, marginTop: 6 }}>
                {winners.map((w) => (
                  <View key={w.id} style={{ alignItems: 'center', gap: 6 }}>
                    <Avatar person={w} size={result.isTie ? 58 : 72} ring />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>{w.name}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ fontSize: 12.5, color: '#8e879f', marginTop: 4 }}>
                {t('whosMostVotesCount', { count: result.maxVotes })} · {votedCount > 0 ? Math.round((result.maxVotes / votedCount) * 100) : 0}%
              </Text>
            </>
          )}

          <View style={{ marginTop: 16 }}>
            <GradientButton
              label={g.settings.questionCount !== 'endless' && g.questionsPlayed + 1 >= g.settings.questionCount ? t('whosMostFinishButton') : t('whosMostNextButton')}
              onPress={game.nextQuestion}
            />
          </View>
        </View>
      </View>
    );
  }

  // status === 'voting'
  if (!revealed) {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
          <Text style={{ fontSize: 12.5, color: '#8e879f' }}>{t('whosMostPassPhoneTitle')}</Text>
          {currentVoter ? <Avatar person={currentVoter} size={72} ring /> : null}
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{currentVoter ? t('whosMostYourTurnLabel', { name: currentVoter.name }) : ''}</Text>
          <Text style={{ fontSize: 11.5, color: '#635c73' }}>{t('whosMostVotedProgress', { voted: votedCount, total: round.voterOrder.length })}</Text>
          <GradientButton label={t('whosMostReadyButton')} onPress={() => setRevealed(true)} />
        </View>
      </View>
    );
  }

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <CloseButton onPress={onClose} top={insets.top + 10} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 70, paddingBottom: 24 }}>
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {secondsLeft !== null ? (
            <Text style={{ fontSize: 28, fontWeight: '800', color: secondsLeft <= 3 ? '#f87171' : '#fff' }}>{secondsLeft}</Text>
          ) : null}
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{q}</Text>
          <Text style={{ fontSize: 12, color: '#8e879f' }}>{t('whosMostSelectPrompt')}</Text>
        </View>

        <ScrollView contentContainerStyle={{ gap: 10 }}>
          {g.voters
            .filter((v) => settings.selfVoteEnabled || v.id !== currentVoterId)
            .map((v) => (
              <Pressable
                key={v.id}
                onPress={() => game.submitVote(currentVoterId as string, v.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141020', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', borderRadius: 16, padding: 12 }}
              >
                <Avatar person={v} size={40} />
                <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 14.5 }}>{v.name}</Text>
              </Pressable>
            ))}
        </ScrollView>

        <Text style={{ textAlign: 'center', fontSize: 11.5, color: '#635c73', marginTop: 10 }}>{t('whosMostVotedProgress', { voted: votedCount, total: round.voterOrder.length })}</Text>
      </View>
    </View>
  );
}
