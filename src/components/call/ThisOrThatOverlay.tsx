import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useThisOrThatGame } from '@/hooks/useThisOrThatGame';
import { computeSessionSummary, computeThisOrThatResult, promptText } from '@/lib/thisOrThat/engine';
import type {
  ThisOrThatCategoryFilter,
  ThisOrThatChoice,
  ThisOrThatRoundCount,
  ThisOrThatSettings,
  ThisOrThatVoteSeconds,
  ThisOrThatVoteVisibility,
  ThisOrThatVoter,
} from '@/lib/thisOrThat/types';
import { DEFAULT_THIS_OR_THAT_SETTINGS } from '@/lib/thisOrThat/types';

type Seat = { id: string; name: string; c1: string; c2: string };

const CATEGORY_OPTIONS: ThisOrThatCategoryFilter[] = ['mixed', 'food', 'lifestyle', 'love', 'friends', 'party', 'money', 'travel', 'entertainment', 'sports', 'spicy', 'random'];
const ROUND_OPTIONS: ThisOrThatRoundCount[] = [5, 10, 20, 'endless'];
const TIMER_OPTIONS: ThisOrThatVoteSeconds[] = [5, 10, 15, 0];

const CATEGORY_KEY: Record<ThisOrThatCategoryFilter, string> = {
  mixed: 'totCatMixed',
  food: 'totCatFood',
  lifestyle: 'totCatLifestyle',
  love: 'totCatLove',
  friends: 'totCatFriends',
  party: 'totCatParty',
  money: 'totCatMoney',
  travel: 'totCatTravel',
  entertainment: 'totCatEntertainment',
  sports: 'totCatSports',
  spicy: 'totCatSpicy',
  random: 'totCatRandom',
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

function ChoiceCard({ emoji, label, selected, dimmed, onPress }: { emoji?: string; label: string; selected: boolean; dimmed: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 180,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 10,
        backgroundColor: selected ? 'rgba(139,92,246,.22)' : '#141020',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#8b5cf6' : 'rgba(255,255,255,.08)',
        opacity: dimmed ? 0.55 : 1,
        transform: [{ scale: selected ? 1.03 : 1 }],
      }}
    >
      {emoji ? <Text style={{ fontSize: 40 }}>{emoji}</Text> : null}
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

export function ThisOrThatOverlay({ participants, onClose }: { participants: Seat[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user } = useApp();
  const game = useThisOrThatGame();
  const g = game.state;

  const [settings, setSettings] = useState<ThisOrThatSettings>(DEFAULT_THIS_OR_THAT_SETTINGS);
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const voters: ThisOrThatVoter[] = useMemo(
    () => [{ id: 'me', name: user?.name || t('you'), c1: '#6366f1', c2: '#ec4899' }, ...participants],
    [participants, user?.name, t]
  );

  const round = g.round;
  const currentVoterId = round ? round.voterOrder[round.currentVoterIndex] : null;
  const currentVoter = currentVoterId ? g.voters.find((v) => v.id === currentVoterId) ?? voters.find((v) => v.id === currentVoterId) ?? null : null;

  useEffect(() => {
    setRevealed(false);
  }, [round?.prompt.id, round?.currentVoterIndex]);

  useEffect(() => {
    if (!round || round.status !== 'voting' || !revealed || settings.voteSeconds === 0) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(settings.voteSeconds);
    const id = setInterval(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearInterval(id);
  }, [round?.prompt.id, round?.currentVoterIndex, revealed, settings.voteSeconds, round?.status]);

  useEffect(() => {
    if (secondsLeft === 0) game.timerExpired();
  }, [secondsLeft, game]);

  const startSession = () => game.startSession(voters, settings);

  if (g.phase === 'setup') {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 70, paddingBottom: 40, gap: 16 }}>
          <Text style={{ fontSize: 34 }}>⚡</Text>
          <Text style={{ fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('totSetupTitle')}</Text>
          <Text style={{ fontSize: 12.5, color: '#8e879f', textAlign: 'center' }}>{t('totSetupSubtitle')}</Text>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('totCategoryLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <Chip key={c} label={t(CATEGORY_KEY[c])} active={settings.category === c} onPress={() => setSettings((s) => ({ ...s, category: c }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('totRoundsLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {ROUND_OPTIONS.map((rc) => (
                <Chip key={String(rc)} label={rc === 'endless' ? t('totRoundsEndless') : String(rc)} active={settings.roundCount === rc} onPress={() => setSettings((s) => ({ ...s, roundCount: rc }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('totTimerLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TIMER_OPTIONS.map((s) => (
                <Chip key={s} label={s === 0 ? t('totTimerOff') : `${s}s`} active={settings.voteSeconds === s} onPress={() => setSettings((v) => ({ ...v, voteSeconds: s }))} />
              ))}
            </View>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ fontSize: 11.5, color: '#8e879f', fontWeight: '700' }}>{t('totVisibilityLabel')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['public', 'anonymous'] as ThisOrThatVoteVisibility[]).map((v) => (
                <Chip
                  key={v}
                  label={v === 'public' ? t('totVisibilityPublic') : t('totVisibilityAnonymous')}
                  active={settings.voteVisibility === v}
                  onPress={() => setSettings((s) => ({ ...s, voteVisibility: v }))}
                />
              ))}
            </View>
          </View>

          {voters.length <= 2 ? <Text style={{ fontSize: 11.5, color: '#8e879f', textAlign: 'center' }}>{t('totTwoPlayersNote')}</Text> : null}

          <GradientButton label={t('totStartButton')} onPress={startSession} />
        </ScrollView>
      </View>
    );
  }

  if (g.phase === 'summary') {
    const summary = computeSessionSummary(g);
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 60, gap: 14 }}>
          <Text style={{ fontSize: 44 }}>🎉</Text>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{t('totSummaryTitle')}</Text>
          <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('totSummarySubtitle', { count: g.roundsPlayed })}</Text>

          {summary.mostDivisive ? (
            <View style={{ width: '100%', backgroundColor: '#141020', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', padding: 14, gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#a78bfa', fontWeight: '700' }}>{t('totMostDivisiveLabel')}</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>
                {promptText(summary.mostDivisive.prompt, 'left', language)} {summary.mostDivisive.prompt.leftEmoji} / {summary.mostDivisive.prompt.rightEmoji} {promptText(summary.mostDivisive.prompt, 'right', language)}
              </Text>
            </View>
          ) : null}

          {summary.biggestAgreement ? (
            <View style={{ width: '100%', backgroundColor: '#141020', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', padding: 14, gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#4ade80', fontWeight: '700' }}>{t('totBiggestAgreementLabel')}</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>
                {promptText(summary.biggestAgreement.prompt, 'left', language)} {summary.biggestAgreement.prompt.leftEmoji} / {summary.biggestAgreement.prompt.rightEmoji}{' '}
                {promptText(summary.biggestAgreement.prompt, 'right', language)}
              </Text>
            </View>
          ) : null}

          {Object.keys(summary.similarity).length > 0 ? (
            <View style={{ width: '100%', gap: 6 }}>
              <Text style={{ fontSize: 11, color: '#8e879f', fontWeight: '700' }}>{t('totSimilarityLabel')}</Text>
              {g.voters.map((v) => (
                <View key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141020', borderRadius: 13, padding: 10 }}>
                  <Avatar person={v} size={30} />
                  <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 13 }}>{v.name}</Text>
                  <Text style={{ color: '#a78bfa', fontWeight: '800', fontSize: 13 }}>{summary.similarity[v.id] ?? 0}%</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Pressable onPress={onClose} style={{ height: 50, paddingHorizontal: 18, borderRadius: 15, backgroundColor: '#1b1629', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('totCloseButton')}</Text>
            </Pressable>
            <GradientButton label={t('totPlayAgainButton')} onPress={game.restart} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!round) return null;

  const votedCount = Object.keys(round.votes).length;

  if (round.status === 'revealing') {
    const result = computeThisOrThatResult(round);
    const leftVoters = g.voters.filter((v) => round.votes[v.id] === 'left');
    const rightVoters = g.voters.filter((v) => round.votes[v.id] === 'right');
    const showChoices = settings.voteVisibility === 'public';
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 40, gap: 12 }}>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff' }}>{t('totRevealTitle')}</Text>
          {result.totalVotes === 0 ? (
            <Text style={{ fontSize: 13, color: '#8e879f' }}>{t('totNoVotes')}</Text>
          ) : (
            <>
              {result.isTie ? <Text style={{ fontSize: 13, color: '#a78bfa', fontWeight: '700' }}>{t('totTieLabel')}</Text> : null}
              {result.isUnanimous ? <Text style={{ fontSize: 13, color: '#4ade80', fontWeight: '700' }}>{t('totUnanimousLabel')}</Text> : null}

              <View style={{ flexDirection: 'row', width: '100%', gap: 12, marginTop: 6 }}>
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 32 }}>{round.prompt.leftEmoji}</Text>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>{promptText(round.prompt, 'left', language)}</Text>
                  <Text style={{ color: '#a78bfa', fontWeight: '800', fontSize: 22 }}>{result.leftPct}%</Text>
                  {showChoices ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: -6 }}>
                      {leftVoters.map((v) => (
                        <Avatar key={v.id} person={v} size={28} />
                      ))}
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 32 }}>{round.prompt.rightEmoji}</Text>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>{promptText(round.prompt, 'right', language)}</Text>
                  <Text style={{ color: '#a78bfa', fontWeight: '800', fontSize: 22 }}>{result.rightPct}%</Text>
                  {showChoices ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: -6 }}>
                      {rightVoters.map((v) => (
                        <Avatar key={v.id} person={v} size={28} />
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}

          <View style={{ marginTop: 16 }}>
            <GradientButton
              label={g.settings.roundCount !== 'endless' && g.roundsPlayed + 1 >= g.settings.roundCount ? t('totFinishButton') : t('totNextButton')}
              onPress={game.nextRound}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // status === 'voting'
  if (!revealed) {
    return (
      <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
        <CloseButton onPress={onClose} top={insets.top + 10} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, gap: 14 }}>
          <Text style={{ fontSize: 12.5, color: '#8e879f' }}>{t('totPassPhoneTitle')}</Text>
          {currentVoter ? <Avatar person={currentVoter} size={72} ring /> : null}
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' }}>{currentVoter ? t('totYourTurnLabel', { name: currentVoter.name }) : ''}</Text>
          <Text style={{ fontSize: 11.5, color: '#635c73' }}>{t('totVotedProgress', { voted: votedCount, total: round.voterOrder.length })}</Text>
          <GradientButton label={t('totReadyButton')} onPress={() => setRevealed(true)} />
        </View>
      </View>
    );
  }

  const onSelect = (choice: ThisOrThatChoice) => {
    if (!currentVoterId) return;
    game.selectChoice(currentVoterId, choice);
  };

  return (
    <View className="absolute inset-0 bg-vbg z-[300]" style={{ paddingTop: insets.top }}>
      <CloseButton onPress={onClose} top={insets.top + 10} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 70, paddingBottom: 24, justifyContent: 'center' }}>
        {secondsLeft !== null ? (
          <Text style={{ fontSize: 24, fontWeight: '800', color: secondsLeft <= 3 ? '#f87171' : '#fff', textAlign: 'center', marginBottom: 10 }}>{secondsLeft}</Text>
        ) : null}
        <Text style={{ fontSize: 12, color: '#8e879f', textAlign: 'center', marginBottom: 16 }}>THIS OR THAT 🎯</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ChoiceCard
            emoji={round.prompt.leftEmoji}
            label={promptText(round.prompt, 'left', language)}
            selected={round.pendingChoice === 'left'}
            dimmed={round.pendingChoice === 'right'}
            onPress={() => onSelect('left')}
          />
          <ChoiceCard
            emoji={round.prompt.rightEmoji}
            label={promptText(round.prompt, 'right', language)}
            selected={round.pendingChoice === 'right'}
            dimmed={round.pendingChoice === 'left'}
            onPress={() => onSelect('right')}
          />
        </View>

        <View style={{ alignItems: 'center', marginTop: 24, gap: 12 }}>
          <GradientButton label={t('totConfirmButton')} onPress={() => currentVoterId && game.confirmVote(currentVoterId)} disabled={!round.pendingChoice} />
          <Text style={{ fontSize: 11.5, color: '#635c73' }}>{t('totVotedProgress', { voted: votedCount, total: round.voterOrder.length })}</Text>
        </View>
      </View>
    </View>
  );
}
